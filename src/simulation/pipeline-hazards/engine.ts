import type { BaseCycleSnapshot, SimulationEngine, Stage } from "@/types/simulation";
import type { Instruction, Operand } from "./isa";
import { REGISTER_NAMES, destRegister, sourceRegisters } from "./isa";

const STAGES: Stage[] = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"];
const MEMORY_SIZE = 16;

export type HazardType = "data" | "structural" | "control";

export interface HazardEvent {
  type: HazardType;
  cycle: number;
  instructionIndex: number;
  raw: string;
  cyclesLost: number;
  resolved: boolean;
  description: string;
}

export interface PipelineHazardProgram {
  instructions: Instruction[];
  /** When true, Fetch and Memory share one physical port — a real structural hazard. */
  unifiedMemory: boolean;
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

export interface HazardSnapshot extends BaseCycleSnapshot {
  occupancy: Partial<Record<Stage, Slot>>;
  hazardActive: { type: HazardType; raw: string } | null;
  /** The instruction squashed this cycle by a taken branch, if any. */
  flushed: Slot | null;
  registers: Record<string, number>;
  registersChanged: string[];
  memory: number[];
  memoryChanged: number[];
  hazardLog: HazardEvent[];
  instructions: { index: number; raw: string }[];
  instructionsInFlight: number;
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
 * A real 5-stage in-order pipeline with a hazard detection unit. No
 * forwarding — a dependent instruction stalls in Decode until its producer
 * has completed Write Back. Register writes are applied before Decode reads
 * within the same tick ("write first half / read second half of the
 * cycle"), which is why a producer sitting in the Write Back latch does NOT
 * count as a hazard for this cycle's Decode.
 */
export class PipelineHazardEngine
  implements SimulationEngine<HazardSnapshot, PipelineHazardProgram>
{
  private instructions: Instruction[] = [];
  private unifiedMemory = false;
  private registers: Record<string, number> = {};
  private memory: number[] = [];
  private pc = 0;
  private ifid: Slot | null = null;
  private idex: DecodedSlot | null = null;
  private exmem: ExecutedSlot | null = null;
  private memwb: MemWbSlot | null = null;
  private cycleCount = 0;
  private history: HazardSnapshot[] = [];
  private hazardLog: HazardEvent[] = [];
  private instructionsCompleted = 0;
  /**
   * Tracks the in-progress hazard event for whichever instruction is
   * currently stalled, plus its index in hazardLog. Updates are immutable
   * (replace-at-index, never mutate-in-place): the full simulation runs
   * eagerly before any snapshot is read, so mutating a shared object would
   * let a hazard's *eventual* resolution leak into snapshots from cycles
   * before it actually resolved.
   */
  private openHazard: HazardEvent | null = null;
  private openHazardIndex: number | null = null;

  initialize(program: PipelineHazardProgram): void {
    this.instructions = program.instructions;
    this.unifiedMemory = program.unifiedMemory;
    this.registers = Object.fromEntries(REGISTER_NAMES.map((r) => [r, 0]));
    this.memory = new Array(MEMORY_SIZE).fill(0);
    this.pc = 0;
    this.ifid = null;
    this.idex = null;
    this.exmem = null;
    this.memwb = null;
    this.cycleCount = 0;
    this.history = [];
    this.hazardLog = [];
    this.instructionsCompleted = 0;
    this.openHazard = null;
    this.openHazardIndex = null;
  }

  reset(): void {
    this.initialize({ instructions: this.instructions, unifiedMemory: this.unifiedMemory });
  }

  getState(): HazardSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): HazardSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): HazardSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private isDrained(): boolean {
    return this.pc >= this.instructions.length && !this.ifid && !this.idex && !this.exmem && !this.memwb;
  }

  tick(): HazardSnapshot {
    this.cycleCount += 1;
    const cycle = this.cycleCount;

    if (this.isDrained()) {
      const snapshot: HazardSnapshot = {
        cycle,
        occupancy: {},
        hazardActive: null,
        flushed: null,
        registers: { ...this.registers },
        registersChanged: [],
        memory: [...this.memory],
        memoryChanged: [],
        hazardLog: [...this.hazardLog],
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
    let hazardActive: { type: HazardType; raw: string } | null = null;
    const notes: string[] = [];

    // --- WRITEBACK (uses the memwb latch as it entered this cycle) ---
    if (this.memwb) {
      occupancy.WRITEBACK = { instructionIndex: this.memwb.instructionIndex, raw: this.memwb.raw };
      const instr = this.instructions[this.memwb.instructionIndex];
      const dest = destRegister(instr);
      if (dest && this.memwb.result !== null) {
        this.registers[dest] = this.memwb.result;
        registersChanged.push(dest);
        notes.push(`${this.memwb.raw} writes back ${dest}=${this.memwb.result}`);
      }
      this.instructionsCompleted += 1;
    }

    // --- MEMORY (uses the exmem latch as it entered this cycle) ---
    let newMemWb: MemWbSlot | null = null;
    let memoryTouchesRam = false;
    if (this.exmem) {
      occupancy.MEMORY = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw };
      const instr = this.instructions[this.exmem.instructionIndex];
      if (instr.opcode === "LOAD") {
        const value = this.memory[this.exmem.address ?? 0] ?? 0;
        newMemWb = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw, result: value };
        memoryTouchesRam = true;
        notes.push(`${instr.raw} reads memory[${this.exmem.address}] = ${value}`);
      } else if (instr.opcode === "STORE") {
        const addr = this.exmem.address ?? 0;
        this.memory[addr] = this.exmem.storeValue ?? 0;
        memoryChanged.push(addr);
        newMemWb = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw, result: null };
        memoryTouchesRam = true;
        notes.push(`${instr.raw} writes memory[${addr}] = ${this.exmem.storeValue}`);
      } else {
        newMemWb = {
          instructionIndex: this.exmem.instructionIndex,
          raw: this.exmem.raw,
          result: this.exmem.aluResult,
        };
      }
    }

    // --- EXECUTE (uses the idex latch as it entered this cycle) ---
    let newExMem: ExecutedSlot | null = null;
    let branchTarget: number | null = null;
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
        case "BEQ":
          if (this.idex.rs1Val === this.idex.rs2Val) {
            branchTarget = this.idex.instructionIndex + 1 + (instr.branchOffset ?? 0);
            notes.push(
              `${instr.raw} is TAKEN (R equal) — flushing the wrong-path instruction, PC → ${branchTarget}`,
            );
            hazardActive = { type: "control", raw: instr.raw };
            this.logHazard("control", this.idex.instructionIndex, instr.raw, cycle, 1, true,
              "Branch resolved taken in Execute; the instruction already fetched behind it is squashed.");
          } else {
            notes.push(`${instr.raw} is NOT TAKEN — no flush needed.`);
          }
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

    // A taken branch squashes whatever was already fetched into ifid this cycle.
    let flushed: Slot | null = null;
    if (branchTarget !== null && this.ifid) {
      flushed = this.ifid;
      notes.push(`Squashing "${this.ifid.raw}" — it was fetched on the wrong path.`);
      this.ifid = null;
    }

    // --- DECODE (uses the ifid latch; may stall on a real data hazard) ---
    let newIdEx: DecodedSlot | null = null;
    let decodeStalled = false;
    if (this.ifid) {
      occupancy.DECODE = { instructionIndex: this.ifid.instructionIndex, raw: this.ifid.raw };
      const instr = this.instructions[this.ifid.instructionIndex];
      const needed = sourceRegisters(instr);
      const inFlightProducers = [this.idex, this.exmem]
        .filter((s): s is DecodedSlot | ExecutedSlot => s !== null)
        .map((s) => this.instructions[s.instructionIndex]);
      const hazardProducer = inFlightProducers.find((p) => {
        const d = destRegister(p);
        return d && needed.includes(d);
      });

      if (hazardProducer) {
        decodeStalled = true;
        hazardActive = { type: "data", raw: instr.raw };
        this.logHazard(
          "data",
          this.ifid.instructionIndex,
          instr.raw,
          cycle,
          1,
          false,
          `Waiting on register ${destRegister(hazardProducer)} from "${hazardProducer.raw}" — no forwarding available yet.`,
        );
        notes.push(`${instr.raw} stalls in Decode — needs a register not yet written back.`);
      } else {
        if (
          this.openHazard &&
          this.openHazardIndex !== null &&
          this.openHazard.instructionIndex === this.ifid.instructionIndex
        ) {
          this.hazardLog[this.openHazardIndex] = { ...this.openHazard, resolved: true };
          this.openHazard = null;
          this.openHazardIndex = null;
        }
        newIdEx = {
          instructionIndex: this.ifid.instructionIndex,
          raw: this.ifid.raw,
          rs1Val: readOperand(instr.src1, this.registers),
          rs2Val: instr.src2 ? readOperand(instr.src2, this.registers) : undefined,
          address: literalAddress(instr),
        };
      }
    }

    // --- FETCH ---
    let structuralStall = false;
    if (this.unifiedMemory && memoryTouchesRam && !decodeStalled) {
      // Fetch and Memory contend for the same physical port this cycle.
      structuralStall = true;
      hazardActive = hazardActive ?? { type: "structural", raw: this.exmem?.raw ?? "" };
      this.logHazard(
        "structural",
        this.exmem?.instructionIndex ?? -1,
        this.exmem?.raw ?? "",
        cycle,
        1,
        true,
        "Unified memory: Fetch cannot use the memory port while Memory stage is accessing it.",
      );
      notes.push("Structural hazard — Fetch stalls, memory port is busy.");
    }

    let newPc = this.pc;
    if (branchTarget !== null) newPc = branchTarget;

    let newIfId: Slot | null;
    if (decodeStalled) {
      // The stalled instruction stays put in ifid and retries Decode next cycle.
      newIfId = this.ifid;
    } else if (structuralStall) {
      // Decode already consumed ifid successfully; Fetch itself is blocked this cycle.
      newIfId = null;
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

    const snapshot: HazardSnapshot = {
      cycle,
      occupancy,
      hazardActive,
      flushed,
      registers: { ...this.registers },
      registersChanged,
      memory: [...this.memory],
      memoryChanged,
      hazardLog: [...this.hazardLog],
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

  private logHazard(
    type: HazardType,
    instructionIndex: number,
    raw: string,
    cycle: number,
    cyclesLostThisCycle: number,
    resolvedImmediately: boolean,
    description: string,
  ) {
    if (type === "data") {
      if (
        this.openHazard &&
        this.openHazardIndex !== null &&
        this.openHazard.instructionIndex === instructionIndex
      ) {
        const updated: HazardEvent = {
          ...this.openHazard,
          cyclesLost: this.openHazard.cyclesLost + cyclesLostThisCycle,
        };
        this.hazardLog[this.openHazardIndex] = updated;
        this.openHazard = updated;
        return;
      }
      const event: HazardEvent = {
        type,
        cycle,
        instructionIndex,
        raw,
        cyclesLost: cyclesLostThisCycle,
        resolved: false,
        description,
      };
      this.openHazardIndex = this.hazardLog.length;
      this.hazardLog.push(event);
      this.openHazard = event;
      return;
    }

    this.hazardLog.push({
      type,
      cycle,
      instructionIndex,
      raw,
      cyclesLost: cyclesLostThisCycle,
      resolved: resolvedImmediately,
      description,
    });
  }
}

export { STAGES as HAZARD_PIPELINE_STAGES };
