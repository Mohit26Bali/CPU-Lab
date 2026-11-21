import type { BaseCycleSnapshot, SimulationEngine, Stage } from "@/types/simulation";
import type { Instruction, Operand } from "@/simulation/pipeline-hazards/isa";
import { REGISTER_NAMES, destRegister, sourceRegisters } from "@/simulation/pipeline-hazards/isa";

const STAGES: Stage[] = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"];
const MEMORY_SIZE = 16;

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

export interface ForwardEvent {
  cycle: number;
  fromStage: "EX/MEM" | "MEM/WB";
  register: string;
  value: number;
  producerRaw: string;
  consumerRaw: string;
}

export interface StallEvent {
  cycle: number;
  instructionIndex: number;
  raw: string;
  reason: "load-use" | "no-forwarding";
}

export interface ForwardingProgram {
  instructions: Instruction[];
  forwardingEnabled: boolean;
}

export interface ForwardingSnapshot extends BaseCycleSnapshot {
  occupancy: Partial<Record<Stage, Slot>>;
  forwardActive: ForwardEvent | null;
  stallActive: StallEvent | null;
  registers: Record<string, number>;
  registersChanged: string[];
  memory: number[];
  memoryChanged: number[];
  forwardLog: ForwardEvent[];
  stallLog: StallEvent[];
  instructions: { index: number; raw: string }[];
  instructionsInFlight: number;
  instructionsCompleted: number;
  isFinal: boolean;
}

/**
 * Same 5-stage in-order pipeline as Module 3, but the hazard-detection unit
 * can now bypass (forward) a fresh EX/MEM or MEM/WB result straight into a
 * waiting Decode instead of stalling — *if* forwardingEnabled. The one case
 * forwarding cannot fix even when enabled: load-use, since a LOAD's data
 * isn't real until its own Memory stage completes, one cycle later than an
 * ALU result. Toggle forwardingEnabled off to see this engine degrade back
 * into Module 3's pure-stall behavior.
 */
export class ForwardingEngine implements SimulationEngine<ForwardingSnapshot, ForwardingProgram> {
  private instructions: Instruction[] = [];
  private forwardingEnabled = true;
  private registers: Record<string, number> = {};
  private memory: number[] = [];
  private pc = 0;
  private ifid: Slot | null = null;
  private idex: DecodedSlot | null = null;
  private exmem: ExecutedSlot | null = null;
  private memwb: MemWbSlot | null = null;
  private cycleCount = 0;
  private history: ForwardingSnapshot[] = [];
  private forwardLog: ForwardEvent[] = [];
  private stallLog: StallEvent[] = [];
  private instructionsCompleted = 0;
  private openStallIndex: number | null = null;

  initialize(program: ForwardingProgram): void {
    this.instructions = program.instructions;
    this.forwardingEnabled = program.forwardingEnabled;
    this.registers = Object.fromEntries(REGISTER_NAMES.map((r) => [r, 0]));
    this.memory = new Array(MEMORY_SIZE).fill(0);
    this.pc = 0;
    this.ifid = null;
    this.idex = null;
    this.exmem = null;
    this.memwb = null;
    this.cycleCount = 0;
    this.history = [];
    this.forwardLog = [];
    this.stallLog = [];
    this.instructionsCompleted = 0;
    this.openStallIndex = null;
  }

  reset(): void {
    this.initialize({ instructions: this.instructions, forwardingEnabled: this.forwardingEnabled });
  }

  getState(): ForwardingSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): ForwardingSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): ForwardingSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private isDrained(): boolean {
    return this.pc >= this.instructions.length && !this.ifid && !this.idex && !this.exmem && !this.memwb;
  }

  tick(): ForwardingSnapshot {
    this.cycleCount += 1;
    const cycle = this.cycleCount;

    if (this.isDrained()) {
      const snapshot: ForwardingSnapshot = {
        cycle,
        occupancy: {},
        forwardActive: null,
        stallActive: null,
        registers: { ...this.registers },
        registersChanged: [],
        memory: [...this.memory],
        memoryChanged: [],
        forwardLog: [...this.forwardLog],
        stallLog: [...this.stallLog],
        instructions: this.instructions.map((i, index) => ({ index, raw: i.raw })),
        instructionsInFlight: 0,
        instructionsCompleted: this.instructionsCompleted,
        events: [{ kind: "program-complete", message: "Pipeline fully drained." }],
        explanation: "All instructions have completed. The pipeline is empty.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    const occupancy: Partial<Record<Stage, Slot>> = {};
    const registersChanged: string[] = [];
    const memoryChanged: number[] = [];
    const notes: string[] = [];

    // --- WRITEBACK ---
    if (this.memwb) {
      occupancy.WRITEBACK = { instructionIndex: this.memwb.instructionIndex, raw: this.memwb.raw };
      const instr = this.instructions[this.memwb.instructionIndex];
      const dest = destRegister(instr);
      if (dest && this.memwb.result !== null) {
        this.registers[dest] = this.memwb.result;
        registersChanged.push(dest);
      }
      this.instructionsCompleted += 1;
    }

    // --- MEMORY ---
    let newMemWb: MemWbSlot | null = null;
    if (this.exmem) {
      occupancy.MEMORY = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw };
      const instr = this.instructions[this.exmem.instructionIndex];
      if (instr.opcode === "LOAD") {
        const value = this.memory[this.exmem.address ?? 0] ?? 0;
        newMemWb = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw, result: value };
      } else if (instr.opcode === "STORE") {
        const addr = this.exmem.address ?? 0;
        this.memory[addr] = this.exmem.storeValue ?? 0;
        memoryChanged.push(addr);
        newMemWb = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw, result: null };
      } else {
        newMemWb = {
          instructionIndex: this.exmem.instructionIndex,
          raw: this.exmem.raw,
          result: this.exmem.aluResult,
        };
      }
    }

    // --- EXECUTE ---
    let newExMem: ExecutedSlot | null = null;
    if (this.idex) {
      occupancy.EXECUTE = { instructionIndex: this.idex.instructionIndex, raw: this.idex.raw };
      const instr = this.instructions[this.idex.instructionIndex];
      let aluResult = 0;
      switch (instr.opcode) {
        case "MOV":
          aluResult = this.idex.rs1Val;
          break;
        case "ADD":
          aluResult = this.idex.rs1Val + (this.idex.rs2Val ?? 0);
          break;
        case "SUB":
          aluResult = this.idex.rs1Val - (this.idex.rs2Val ?? 0);
          break;
      }
      newExMem = {
        instructionIndex: this.idex.instructionIndex,
        raw: this.idex.raw,
        aluResult,
        address: this.idex.address,
        storeValue: instr.opcode === "STORE" ? this.idex.rs1Val : undefined,
      };
    }

    // --- DECODE (may stall, or resolve via forwarding) ---
    let newIdEx: DecodedSlot | null = null;
    let decodeStalled = false;
    let forwardActive: ForwardEvent | null = null;
    let stallActive: StallEvent | null = null;

    if (this.ifid) {
      occupancy.DECODE = { instructionIndex: this.ifid.instructionIndex, raw: this.ifid.raw };
      const instr = this.instructions[this.ifid.instructionIndex];
      const needed = sourceRegisters(instr);

      const resolve = (name: string): { value: number; forward: ForwardEvent | null } | null => {
        // Producer one stage ahead (currently entering EX this cycle).
        if (this.idex) {
          const producer = this.instructions[this.idex.instructionIndex];
          if (destRegister(producer) === name) {
            if (this.forwardingEnabled && producer.opcode !== "LOAD" && newExMem) {
              return {
                value: newExMem.aluResult,
                forward: {
                  cycle,
                  fromStage: "EX/MEM",
                  register: name,
                  value: newExMem.aluResult,
                  producerRaw: producer.raw,
                  consumerRaw: instr.raw,
                },
              };
            }
            return null; // hazard: either forwarding is off, or this is a load-use case
          }
        }
        // Producer two stages ahead (currently entering Memory this cycle).
        if (this.exmem) {
          const producer = this.instructions[this.exmem.instructionIndex];
          if (destRegister(producer) === name) {
            if (this.forwardingEnabled && newMemWb && newMemWb.result !== null) {
              return {
                value: newMemWb.result,
                forward: {
                  cycle,
                  fromStage: "MEM/WB",
                  register: name,
                  value: newMemWb.result,
                  producerRaw: producer.raw,
                  consumerRaw: instr.raw,
                },
              };
            }
            return null;
          }
        }
        return { value: this.registers[name], forward: null }; // no pending producer — safe to read register file
      };

      let hazard = false;
      let isLoadUse = false;
      let rs1Val = 0;
      let rs2Val: number | undefined;
      const regs = [instr.src1.kind === "register" ? instr.src1.name : null, instr.src2?.kind === "register" ? instr.src2.name : null];

      for (const r of needed) {
        const resolved = resolve(r);
        if (!resolved) {
          hazard = true;
          if (this.idex && destRegister(this.instructions[this.idex.instructionIndex]) === r) {
            isLoadUse = this.instructions[this.idex.instructionIndex].opcode === "LOAD";
          }
          break;
        }
        if (resolved.forward) forwardActive = resolved.forward;
        if (regs[0] === r) rs1Val = resolved.value;
        if (regs[1] === r) rs2Val = resolved.value;
      }

      if (hazard) {
        decodeStalled = true;
        forwardActive = null; // a forward only counts if the instruction actually moves on this cycle
        stallActive = {
          cycle,
          instructionIndex: this.ifid.instructionIndex,
          raw: instr.raw,
          reason: isLoadUse ? "load-use" : "no-forwarding",
        };
        if (this.openStallIndex === null || this.stallLog[this.openStallIndex]?.instructionIndex !== this.ifid.instructionIndex) {
          this.openStallIndex = this.stallLog.length;
          this.stallLog.push(stallActive);
        }
        notes.push(
          `${instr.raw} stalls in Decode${isLoadUse ? " — load-use hazard, forwarding can't help this one" : this.forwardingEnabled ? "" : " — no forwarding available"}.`,
        );
      } else {
        this.openStallIndex = null;
        if (instr.src1.kind !== "register") rs1Val = readOperand(instr.src1, this.registers);
        if (instr.src2 && instr.src2.kind !== "register") rs2Val = readOperand(instr.src2, this.registers);
        newIdEx = {
          instructionIndex: this.ifid.instructionIndex,
          raw: this.ifid.raw,
          rs1Val,
          rs2Val,
          address: literalAddress(instr),
        };
        if (forwardActive) {
          this.forwardLog.push(forwardActive);
          notes.push(
            `${instr.raw} reads ${forwardActive.register} forwarded from "${forwardActive.producerRaw}" (${forwardActive.fromStage}) — no stall.`,
          );
        }
      }
    }

    // --- FETCH ---
    let newIfId: Slot | null;
    let newPc = this.pc;
    if (decodeStalled) {
      newIfId = this.ifid;
    } else if (newPc < this.instructions.length) {
      newIfId = { instructionIndex: newPc, raw: this.instructions[newPc].raw };
      occupancy.FETCH = newIfId;
      newPc += 1;
    } else {
      newIfId = null;
    }

    const occupiedCount = Object.keys(occupancy).length;
    const explanation =
      notes.length > 0
        ? notes.join("  |  ")
        : occupiedCount > 0
          ? STAGES.filter((s) => occupancy[s]).map((s) => `${occupancy[s]!.raw} → ${s}`).join("  |  ")
          : "Pipeline idle.";

    const snapshot: ForwardingSnapshot = {
      cycle,
      occupancy,
      forwardActive,
      stallActive,
      registers: { ...this.registers },
      registersChanged,
      memory: [...this.memory],
      memoryChanged,
      forwardLog: [...this.forwardLog],
      stallLog: [...this.stallLog],
      instructions: this.instructions.map((i, index) => ({ index, raw: i.raw })),
      instructionsInFlight: occupiedCount,
      instructionsCompleted: this.instructionsCompleted,
      events: [{ kind: "pipeline-tick", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);

    this.memwb = newMemWb;
    this.exmem = newExMem;
    this.idex = decodeStalled ? null : newIdEx;
    this.ifid = newIfId;
    this.pc = newPc;

    return snapshot;
  }
}

export { STAGES as FORWARDING_STAGES };
