import type { BaseCycleSnapshot, SimulationEngine, Stage } from "@/types/simulation";
import type { Instruction, Operand } from "@/simulation/pipeline-hazards/isa";
import { destRegister, sourceRegisters } from "@/simulation/pipeline-hazards/isa";
import { REGISTER_NAMES } from "@/simulation/pipeline-hazards/isa";

const STAGES: Stage[] = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"];
const MEMORY_SIZE = 16;
export const LANES = 2;

type UnitType = "ALU" | "MEM";
const UNIT_FOR_OPCODE: Record<string, UnitType> = { MOV: "ALU", ADD: "ALU", SUB: "ALU", LOAD: "MEM", STORE: "MEM" };

interface Slot {
  instructionIndex: number;
  raw: string;
}
interface DecodedSlot extends Slot {
  rs1Val: number;
  rs2Val?: number;
  address?: number;
}
interface ExecutedSlot extends Slot {
  aluResult: number;
  address?: number;
  storeValue?: number;
}
interface MemWbSlot extends Slot {
  result: number | null;
}

export interface LaneOccupancy {
  occupancy: Partial<Record<Stage, (Slot | null)[]>>;
}

export interface SuperscalarSnapshot extends BaseCycleSnapshot {
  occupancy: Partial<Record<Stage, (Slot | null)[]>>;
  executeStalledLanes: boolean[];
  decodeStalledLanes: boolean[];
  registers: Record<string, number>;
  registersChanged: string[];
  memory: number[];
  memoryChanged: number[];
  issuedThisCycle: number;
  utilizationLog: number[];
  instructionsCompleted: number;
  isFinal: boolean;
}

function readOperand(op: Operand, registers: Record<string, number>): number {
  if (op.kind === "immediate") return op.value;
  if (op.kind === "register") return registers[op.name] ?? 0;
  return op.value;
}

function literalAddress(instr: Instruction): number | undefined {
  if (instr.dest?.kind === "address") return instr.dest.value;
  if (instr.src1.kind === "address") return instr.src1.value;
  return undefined;
}

/**
 * A 2-wide, in-order superscalar pipeline: up to 2 instructions move
 * through Fetch/Decode/Execute/Memory/Writeback together, in program
 * order. Two constraints make width less than 100% free: (1) only one
 * memory port, so two simultaneous LOAD/STORE instructions can't both
 * execute the same cycle: lane 1 waits (structural hazard); (2) no
 * forwarding *within* a fetched pair, so if lane 1 depends on lane 0's
 * result, lane 1 stalls even though lane 0 proceeds fine. And because this
 * machine is strictly in-order, a stall in lane 0 blocks lane 1 too, even
 * if lane 1 itself is completely independent — the exact limitation
 * Module 11's out-of-order execution removes.
 */
export class SuperscalarEngine implements SimulationEngine<SuperscalarSnapshot, Instruction[]> {
  private instructions: Instruction[] = [];
  private pc = 0;
  private ifid: (Slot | null)[] = [null, null];
  private idex: (DecodedSlot | null)[] = [null, null];
  private exmem: (ExecutedSlot | null)[] = [null, null];
  private memwb: (MemWbSlot | null)[] = [null, null];
  private registers: Record<string, number> = {};
  private memory: number[] = [];
  private cycleCount = 0;
  private history: SuperscalarSnapshot[] = [];
  private utilizationLog: number[] = [];
  private instructionsCompleted = 0;

  initialize(program: Instruction[]): void {
    this.instructions = program;
    this.pc = 0;
    this.ifid = [null, null];
    this.idex = [null, null];
    this.exmem = [null, null];
    this.memwb = [null, null];
    this.registers = Object.fromEntries(REGISTER_NAMES.map((r) => [r, 0]));
    this.memory = new Array(MEMORY_SIZE).fill(0);
    this.cycleCount = 0;
    this.history = [];
    this.utilizationLog = [];
    this.instructionsCompleted = 0;
  }

  reset(): void {
    this.initialize(this.instructions);
  }

  getState(): SuperscalarSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): SuperscalarSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): SuperscalarSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private isDrained(): boolean {
    return (
      this.pc >= this.instructions.length &&
      this.ifid.every((s) => s === null) &&
      this.idex.every((s) => s === null) &&
      this.exmem.every((s) => s === null) &&
      this.memwb.every((s) => s === null)
    );
  }

  tick(): SuperscalarSnapshot {
    this.cycleCount += 1;

    if (this.isDrained()) {
      const snapshot: SuperscalarSnapshot = {
        cycle: this.cycleCount,
        occupancy: {},
        executeStalledLanes: [false, false],
        decodeStalledLanes: [false, false],
        registers: { ...this.registers },
        registersChanged: [],
        memory: [...this.memory],
        memoryChanged: [],
        issuedThisCycle: 0,
        utilizationLog: [...this.utilizationLog],
        instructionsCompleted: this.instructionsCompleted,
        events: [{ kind: "program-complete", message: "Pipeline fully drained." }],
        explanation: "All instructions have completed.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    const notes: string[] = [];
    const registersChanged: string[] = [];
    const memoryChanged: number[] = [];
    const occupancy: Partial<Record<Stage, (Slot | null)[]>> = {};

    // 1. WRITEBACK (both lanes, latches as they entered this cycle)
    occupancy.WRITEBACK = this.memwb.map((mw) => (mw ? { instructionIndex: mw.instructionIndex, raw: mw.raw } : null));
    for (const mw of this.memwb) {
      if (!mw) continue;
      const instr = this.instructions[mw.instructionIndex];
      const dest = destRegister(instr);
      if (dest && mw.result !== null) {
        this.registers[dest] = mw.result;
        registersChanged.push(dest);
      }
      this.instructionsCompleted += 1;
    }

    // 2. MEMORY
    occupancy.MEMORY = this.exmem.map((em) => (em ? { instructionIndex: em.instructionIndex, raw: em.raw } : null));
    const newMemWb: (MemWbSlot | null)[] = [null, null];
    for (let L = 0; L < LANES; L++) {
      const em = this.exmem[L];
      if (!em) continue;
      const instr = this.instructions[em.instructionIndex];
      if (instr.opcode === "LOAD") {
        const value = this.memory[em.address ?? 0] ?? 0;
        newMemWb[L] = { instructionIndex: em.instructionIndex, raw: em.raw, result: value };
      } else if (instr.opcode === "STORE") {
        const addr = em.address ?? 0;
        this.memory[addr] = em.storeValue ?? 0;
        memoryChanged.push(addr);
        newMemWb[L] = { instructionIndex: em.instructionIndex, raw: em.raw, result: null };
      } else {
        newMemWb[L] = { instructionIndex: em.instructionIndex, raw: em.raw, result: em.aluResult };
      }
    }

    // 3. EXECUTE readout + structural check (single memory port)
    occupancy.EXECUTE = this.idex.map((d) => (d ? { instructionIndex: d.instructionIndex, raw: d.raw } : null));
    const executeStalledLanes = [false, false];
    const wantsMem = this.idex.map((d) => d !== null && UNIT_FOR_OPCODE[this.instructions[d.instructionIndex].opcode] === "MEM");
    if (wantsMem[0] && wantsMem[1]) {
      executeStalledLanes[1] = true;
      notes.push(`Structural hazard: both lanes want the memory port — "${this.idex[1]!.raw}" waits.`);
    }
    const newExMem: (ExecutedSlot | null)[] = [null, null];
    let issuedThisCycle = 0;
    for (let L = 0; L < LANES; L++) {
      const d = this.idex[L];
      if (!d || executeStalledLanes[L]) continue;
      const instr = this.instructions[d.instructionIndex];
      let aluResult = 0;
      switch (instr.opcode) {
        case "MOV":
          aluResult = d.rs1Val;
          break;
        case "ADD":
          aluResult = d.rs1Val + (d.rs2Val ?? 0);
          break;
        case "SUB":
          aluResult = d.rs1Val - (d.rs2Val ?? 0);
          break;
      }
      newExMem[L] = {
        instructionIndex: d.instructionIndex,
        raw: d.raw,
        aluResult,
        address: d.address,
        storeValue: instr.opcode === "STORE" ? d.rs1Val : undefined,
      };
      issuedThisCycle += 1;
    }

    // 4. DECODE — hazard check against every in-flight producer (both lanes, EX and MEM latches)
    occupancy.DECODE = this.ifid.map((s) => (s ? { instructionIndex: s.instructionIndex, raw: s.raw } : null));
    const decodeStalledLanes = [executeStalledLanes[0], executeStalledLanes[1]];
    const producers = [...this.idex, ...this.exmem].filter((s): s is DecodedSlot | ExecutedSlot => s !== null);

    for (let L = 0; L < LANES; L++) {
      if (!this.ifid[L] || decodeStalledLanes[L]) continue;
      const instr = this.instructions[this.ifid[L]!.instructionIndex];
      const needed = sourceRegisters(instr);
      const hazardProducer = producers.find((p) => {
        const d = destRegister(this.instructions[p.instructionIndex]);
        return d && needed.includes(d);
      });
      if (hazardProducer) {
        decodeStalledLanes[L] = true;
        notes.push(`"${instr.raw}" stalls in Decode — waiting on an in-flight register.`);
      }
    }
    // Intra-group: lane 1 depending on lane 0's result, fetched together, can't forward within the pair.
    if (this.ifid[0] && this.ifid[1] && !decodeStalledLanes[1]) {
      const instr0 = this.instructions[this.ifid[0]!.instructionIndex];
      const instr1 = this.instructions[this.ifid[1]!.instructionIndex];
      const dest0 = destRegister(instr0);
      if (dest0 && sourceRegisters(instr1).includes(dest0)) {
        decodeStalledLanes[1] = true;
        notes.push(`"${instr1.raw}" depends on "${instr0.raw}" from the same cycle — lane 1 stalls.`);
      }
    }
    // In-order issue: lane 1 can never get ahead of a stalled lane 0.
    if (decodeStalledLanes[0]) decodeStalledLanes[1] = true;
    // If lane 1 is stuck in Execute (single memory port), nothing younger may move up behind it either.
    if (executeStalledLanes[1]) decodeStalledLanes[0] = true;

    const newIdEx: (DecodedSlot | null)[] = [null, null];
    for (let L = 0; L < LANES; L++) {
      if (executeStalledLanes[L]) {
        newIdEx[L] = this.idex[L];
        continue;
      }
      if (!this.ifid[L] || decodeStalledLanes[L]) continue;
      const instr = this.instructions[this.ifid[L]!.instructionIndex];
      newIdEx[L] = {
        instructionIndex: this.ifid[L]!.instructionIndex,
        raw: this.ifid[L]!.raw,
        rs1Val: readOperand(instr.src1, this.registers),
        rs2Val: instr.src2 ? readOperand(instr.src2, this.registers) : undefined,
        address: literalAddress(instr),
      };
    }

    // 5. FETCH — strictly in program order.
    occupancy.FETCH = [null, null];
    const newIfId: (Slot | null)[] = [null, null];
    let pc = this.pc;
    const fetchInto = (L: number) => {
      if (pc < this.instructions.length) {
        const slot = { instructionIndex: pc, raw: this.instructions[pc].raw };
        newIfId[L] = slot;
        occupancy.FETCH![L] = slot;
        pc += 1;
      }
    };
    if (decodeStalledLanes[0]) {
      // The older lane is held, so everything behind it is held too (lane 1 stays where it is).
      newIfId[0] = this.ifid[0];
      newIfId[1] = this.ifid[1];
    } else if (decodeStalledLanes[1] && this.ifid[1]) {
      // Lane 0 moved on but lane 1 could not. The waiting instruction is now the OLDEST in the front end,
      // so it moves up into lane 0 and the next instruction in program order is fetched behind it.
      newIfId[0] = this.ifid[1];
      fetchInto(1);
    } else {
      fetchInto(0);
      fetchInto(1);
    }

    this.utilizationLog.push(issuedThisCycle);

    const issueSummary =
      issuedThisCycle === 2
        ? "Execute: both lanes issue this cycle — full width."
        : issuedThisCycle === 1
          ? "Execute: 1 lane issues this cycle."
          : null;
    const explanation = [issueSummary, ...notes].filter(Boolean).join("  |  ") || "Pipeline idle this cycle.";
    const snapshot: SuperscalarSnapshot = {
      cycle: this.cycleCount,
      occupancy,
      executeStalledLanes,
      decodeStalledLanes,
      registers: { ...this.registers },
      registersChanged,
      memory: [...this.memory],
      memoryChanged,
      issuedThisCycle,
      utilizationLog: [...this.utilizationLog],
      instructionsCompleted: this.instructionsCompleted,
      events: [{ kind: "superscalar-tick", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);

    this.memwb = newMemWb;
    this.exmem = newExMem;
    this.idex = newIdEx;
    this.ifid = newIfId;
    this.pc = pc;

    return snapshot;
  }
}

export { STAGES as SUPERSCALAR_STAGES };
