import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";
import type { Instruction, Operand, Opcode } from "@/simulation/pipeline-hazards/isa";
import { REGISTER_NAMES, destRegister } from "@/simulation/pipeline-hazards/isa";

type UnitType = "ALU" | "MEM";

const LATENCY: Partial<Record<Opcode, number>> = { MOV: 1, ADD: 2, SUB: 2, LOAD: 4, STORE: 4 };
const UNIT_FOR_OPCODE: Partial<Record<Opcode, UnitType>> = {
  MOV: "ALU",
  ADD: "ALU",
  SUB: "ALU",
  LOAD: "MEM",
  STORE: "MEM",
};

export const NUM_ALU_UNITS = 2;
export const NUM_MEM_UNITS = 1;
export const NUM_ALU_RS = 3;
export const NUM_MEM_RS = 2;
export const ROB_CAPACITY = 4;
const MEMORY_SIZE = 16;

interface RSEntry {
  id: number;
  unitType: UnitType;
  busy: boolean;
  opcode: Opcode | null;
  robIndex: number | null;
  instrIndex: number | null;
  raw: string | null;
  qj: number | null;
  qk: number | null;
  vj: number | null;
  vk: number | null;
  address: number | null;
}

interface EUEntry {
  id: number;
  unitType: UnitType;
  busy: boolean;
  opcode: Opcode | null;
  robIndex: number | null;
  instrIndex: number | null;
  raw: string | null;
  vj: number | null;
  vk: number | null;
  address: number | null;
  remainingCycles: number;
  result: number | null;
  resultReady: boolean;
}

interface ROBEntry {
  index: number;
  instrIndex: number;
  raw: string;
  opcode: Opcode;
  destReg: string | null;
  address: number | null;
  value: number | null;
  ready: boolean;
  committed: boolean;
}

export type RSView = RSEntry;
export type EUView = EUEntry;
export type ROBView = ROBEntry;

export interface OutOfOrderSnapshot extends BaseCycleSnapshot {
  instructionQueue: { instrIndex: number; raw: string }[];
  rs: RSView[];
  eu: EUView[];
  rob: ROBView[];
  registers: Record<string, number>;
  registersChanged: string[];
  memory: number[];
  memoryChanged: number[];
  dispatchedThisCycle: number | null;
  issuedThisCycle: number[];
  broadcastRobIndex: number | null;
  committedRobIndex: number | null;
  instructionsCommitted: number;
  isFinal: boolean;
}

function computeResult(opcode: Opcode, vj: number, vk: number, memory: number[], address: number | null): number {
  switch (opcode) {
    case "MOV":
      return vj;
    case "ADD":
      return vj + vk;
    case "SUB":
      return vj - vk;
    case "LOAD":
      return memory[address ?? 0] ?? 0;
    case "STORE":
      return vj; // the value to be written to memory at commit time
    default:
      return 0;
  }
}

/**
 * A simplified but real Tomasulo machine: in-order dispatch into
 * reservation stations, out-of-order issue to execution units the instant
 * operands are ready, a single common data bus (one broadcast per cycle,
 * so simultaneous completions must arbitrate — oldest instruction wins),
 * and a reorder buffer that only ever commits its head, in program order,
 * regardless of what finished executing when. No branches in this module —
 * speculation/recovery is its own topic.
 */
export class OutOfOrderEngine implements SimulationEngine<OutOfOrderSnapshot, Instruction[]> {
  private instructions: Instruction[] = [];
  private dispatchPC = 0;
  private rs: RSEntry[] = [];
  private eu: EUEntry[] = [];
  private rob: ROBEntry[] = [];
  private regStatus: Record<string, number | null> = {};
  private registers: Record<string, number> = {};
  private memory: number[] = [];
  private cycleCount = 0;
  private history: OutOfOrderSnapshot[] = [];

  initialize(program: Instruction[]): void {
    this.instructions = program;
    this.dispatchPC = 0;
    this.rs = [
      ...Array.from({ length: NUM_ALU_RS }, (_, i) => makeRS(i, "ALU")),
      ...Array.from({ length: NUM_MEM_RS }, (_, i) => makeRS(NUM_ALU_RS + i, "MEM")),
    ];
    this.eu = [
      ...Array.from({ length: NUM_ALU_UNITS }, (_, i) => makeEU(i, "ALU")),
      ...Array.from({ length: NUM_MEM_UNITS }, (_, i) => makeEU(NUM_ALU_UNITS + i, "MEM")),
    ];
    this.rob = [];
    this.regStatus = Object.fromEntries(REGISTER_NAMES.map((r) => [r, null]));
    this.registers = Object.fromEntries(REGISTER_NAMES.map((r) => [r, 0]));
    this.memory = new Array(MEMORY_SIZE).fill(0);
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize(this.instructions);
  }

  getState(): OutOfOrderSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): OutOfOrderSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): OutOfOrderSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private resolveOperand(op: Operand): { val: number | null; tag: number | null } {
    if (op.kind === "immediate") return { val: op.value, tag: null };
    if (op.kind === "address") return { val: op.value, tag: null };
    const pending = this.regStatus[op.name];
    if (pending !== null && pending !== undefined) {
      // The producing instruction may have already broadcast its result this very
      // cycle (before this dispatch) without yet committing — the ROB already has
      // the value, so there's no need to make this operand wait on the CDB at all.
      const producer = this.rob[pending];
      if (producer && producer.ready) return { val: producer.value, tag: null };
      return { val: null, tag: pending };
    }
    return { val: this.registers[op.name] ?? 0, tag: null };
  }

  /**
   * Memory ordering: a LOAD must not read an address while an OLDER STORE to that same address is still
   * waiting to commit (a store only reaches memory at commit), or it would return stale data.
   */
  private loadMustWait(rs: RSEntry): boolean {
    if (rs.opcode !== "LOAD") return false;
    return this.rob.some(
      (older) =>
        older.opcode === "STORE" && !older.committed && older.address === rs.address && older.index < (rs.robIndex ?? 0),
    );
  }

  private committedCount(): number {
    return this.rob.filter((r) => r.committed).length;
  }

  tick(): OutOfOrderSnapshot {
    this.cycleCount += 1;
    const notes: string[] = [];

    const isFinal = this.dispatchPC >= this.instructions.length && this.committedCount() === this.instructions.length;
    if (isFinal) {
      const snapshot = this.buildSnapshot(null, [], null, null, "Program complete — every instruction has committed.");
      snapshot.isFinal = true;
      snapshot.events = [{ kind: "program-complete", message: snapshot.explanation }];
      this.history.push(snapshot);
      return snapshot;
    }

    const registersChanged: string[] = [];
    const memoryChanged: number[] = [];

    // 1. COMMIT — strictly the ROB head, strictly in order.
    let committedRobIndex: number | null = null;
    const head = this.rob.find((r) => !r.committed);
    if (head && head.ready) {
      if (head.opcode === "STORE") {
        this.memory[head.address!] = head.value!;
        memoryChanged.push(head.address!);
        notes.push(`Commit: ${head.raw} writes memory[${head.address}] = ${head.value}.`);
      } else if (head.destReg) {
        this.registers[head.destReg] = head.value!;
        registersChanged.push(head.destReg);
        notes.push(`Commit: ${head.raw} writes ${head.destReg} = ${head.value}.`);
      } else {
        notes.push(`Commit: ${head.raw}.`);
      }
      head.committed = true;
      committedRobIndex = head.index;
      // Only retire this register's rename if nothing newer has since re-tagged it.
      if (head.destReg && this.regStatus[head.destReg] === head.index) {
        this.regStatus[head.destReg] = null;
      }
    }

    // 2. EXECUTE — advance in-flight units.
    for (const unit of this.eu) {
      if (unit.busy && !unit.resultReady && unit.remainingCycles > 0) {
        unit.remainingCycles -= 1;
        if (unit.remainingCycles === 0) {
          unit.result = computeResult(unit.opcode!, unit.vj ?? 0, unit.vk ?? 0, this.memory, unit.address);
          unit.resultReady = true;
        }
      }
    }

    // 3. BROADCAST (CDB) — at most one result per cycle; oldest instruction wins.
    let broadcastRobIndex: number | null = null;
    const waiting = this.eu.filter((u) => u.busy && u.resultReady);
    if (waiting.length > 0) {
      const winner = waiting.reduce((a, b) => (a.robIndex! < b.robIndex! ? a : b));
      const robEntry = this.rob[winner.robIndex!];
      robEntry.value = winner.result;
      robEntry.ready = true;
      broadcastRobIndex = robEntry.index;
      notes.push(`CDB: ${robEntry.raw} broadcasts result ${winner.result} to ROB[${robEntry.index}].`);
      for (const rs of this.rs) {
        if (rs.busy) {
          if (rs.qj === winner.robIndex) {
            rs.vj = winner.result;
            rs.qj = null;
          }
          if (rs.qk === winner.robIndex) {
            rs.vk = winner.result;
            rs.qk = null;
          }
        }
      }
      winner.busy = false;
      winner.opcode = null;
      winner.robIndex = null;
      winner.instrIndex = null;
      winner.raw = null;
      winner.vj = null;
      winner.vk = null;
      winner.address = null;
      winner.result = null;
      winner.resultReady = false;
      winner.remainingCycles = 0;
    }

    // 4. ISSUE — ready reservation stations move to a free matching execution unit.
    const issuedThisCycle: number[] = [];
    for (const unitType of ["ALU", "MEM"] as UnitType[]) {
      const freeUnit = this.eu.find((u) => u.unitType === unitType && !u.busy);
      if (!freeUnit) continue;
      const ready = this.rs
        .filter((r) => r.busy && r.unitType === unitType && r.qj === null && r.qk === null && !this.loadMustWait(r))
        .sort((a, b) => a.robIndex! - b.robIndex!)[0];
      if (!ready) continue;
      freeUnit.busy = true;
      freeUnit.opcode = ready.opcode;
      freeUnit.robIndex = ready.robIndex;
      freeUnit.instrIndex = ready.instrIndex;
      freeUnit.raw = ready.raw;
      freeUnit.vj = ready.vj;
      freeUnit.vk = ready.vk;
      freeUnit.address = ready.address;
      freeUnit.remainingCycles = LATENCY[ready.opcode!] ?? 1;
      freeUnit.result = null;
      freeUnit.resultReady = false;
      issuedThisCycle.push(ready.robIndex!);
      notes.push(`Issue: ${ready.raw} → ${unitType} unit ${freeUnit.id}.`);

      ready.busy = false;
      ready.opcode = null;
      ready.robIndex = null;
      ready.instrIndex = null;
      ready.raw = null;
      ready.qj = null;
      ready.qk = null;
      ready.vj = null;
      ready.vk = null;
      ready.address = null;
    }

    // 5. DISPATCH — next instruction in program order, if ROB and a matching RS both have room.
    let dispatchedThisCycle: number | null = null;
    const inFlight = this.dispatchPC - this.committedCount();
    if (this.dispatchPC < this.instructions.length && inFlight < ROB_CAPACITY) {
      const instr = this.instructions[this.dispatchPC];
      const unitType = UNIT_FOR_OPCODE[instr.opcode]!;
      const freeRS = this.rs.find((r) => !r.busy && r.unitType === unitType);
      if (freeRS) {
        const robIndex = this.dispatchPC;
        const dest = destRegister(instr);
        let address: number | null = null;
        let vj: number | null = null;
        let qj: number | null = null;
        let vk: number | null = null;
        let qk: number | null = null;

        if (instr.opcode === "LOAD") {
          address = instr.src1.kind === "address" ? instr.src1.value : 0;
        } else if (instr.opcode === "STORE") {
          address = instr.dest?.kind === "address" ? instr.dest.value : 0;
          const r = this.resolveOperand(instr.src1);
          vj = r.val;
          qj = r.tag;
        } else {
          const r1 = this.resolveOperand(instr.src1);
          vj = r1.val;
          qj = r1.tag;
          if (instr.src2) {
            const r2 = this.resolveOperand(instr.src2);
            vk = r2.val;
            qk = r2.tag;
          }
        }

        this.rob.push({
          index: robIndex,
          instrIndex: this.dispatchPC,
          raw: instr.raw,
          opcode: instr.opcode,
          destReg: dest,
          address,
          value: null,
          ready: false,
          committed: false,
        });

        freeRS.busy = true;
        freeRS.opcode = instr.opcode;
        freeRS.robIndex = robIndex;
        freeRS.instrIndex = this.dispatchPC;
        freeRS.raw = instr.raw;
        freeRS.qj = qj;
        freeRS.qk = qk;
        freeRS.vj = vj;
        freeRS.vk = vk;
        freeRS.address = address;

        if (dest) this.regStatus[dest] = robIndex;
        notes.push(`Dispatch: ${instr.raw} → ROB[${robIndex}], ${unitType} RS ${freeRS.id}.`);
        dispatchedThisCycle = this.dispatchPC;
        this.dispatchPC += 1;
      }
    }

    const explanation = notes.length > 0 ? notes.join("  |  ") : "Stalled — no resources available this cycle.";
    const snapshot = this.buildSnapshot(
      dispatchedThisCycle,
      issuedThisCycle,
      broadcastRobIndex,
      committedRobIndex,
      explanation,
    );
    snapshot.registersChanged = registersChanged;
    snapshot.memoryChanged = memoryChanged;
    snapshot.events = [{ kind: "ooo-tick", message: explanation }];
    this.history.push(snapshot);
    return snapshot;
  }

  private buildSnapshot(
    dispatchedThisCycle: number | null,
    issuedThisCycle: number[],
    broadcastRobIndex: number | null,
    committedRobIndex: number | null,
    explanation: string,
  ): OutOfOrderSnapshot {
    return {
      cycle: this.cycleCount,
      instructionQueue: this.instructions
        .slice(this.dispatchPC)
        .map((instr, i) => ({ instrIndex: this.dispatchPC + i, raw: instr.raw })),
      rs: this.rs.map((r) => ({ ...r })),
      eu: this.eu.map((u) => ({ ...u })),
      rob: this.rob.map((r) => ({ ...r })),
      registers: { ...this.registers },
      registersChanged: [],
      memory: [...this.memory],
      memoryChanged: [],
      dispatchedThisCycle,
      issuedThisCycle,
      broadcastRobIndex,
      committedRobIndex,
      instructionsCommitted: this.committedCount(),
      events: [],
      explanation,
      isFinal: false,
    };
  }
}

function makeRS(id: number, unitType: UnitType): RSEntry {
  return {
    id,
    unitType,
    busy: false,
    opcode: null,
    robIndex: null,
    instrIndex: null,
    raw: null,
    qj: null,
    qk: null,
    vj: null,
    vk: null,
    address: null,
  };
}

function makeEU(id: number, unitType: UnitType): EUEntry {
  return {
    id,
    unitType,
    busy: false,
    opcode: null,
    robIndex: null,
    instrIndex: null,
    raw: null,
    vj: null,
    vk: null,
    address: null,
    remainingCycles: 0,
    result: null,
    resultReady: false,
  };
}
