import type { BaseCycleSnapshot, SimulationEngine, Stage } from "@/types/simulation";
import type { Instruction, Operand } from "@/simulation/pipeline-hazards/isa";
import { REGISTER_NAMES, destRegister, sourceRegisters } from "@/simulation/pipeline-hazards/isa";
import { createPredictor, type Predictor, type PredictorKind } from "./predictors";

const STAGES: Stage[] = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"];
const MEMORY_SIZE = 16;

function readOperand(op: Operand, registers: Record<string, number>): number {
  if (op.kind === "immediate") return op.value;
  if (op.kind === "register") return registers[op.name] ?? 0;
  return op.value;
}

interface Slot {
  instructionIndex: number;
  raw: string;
  predictedTaken?: boolean;
}
interface DecodedSlot extends Slot {
  rs1Val: number;
  rs2Val?: number;
}
interface ExecutedSlot extends Slot {
  aluResult: number;
}
interface MemWbSlot extends Slot {
  result: number | null;
}

export interface PredictionRecord {
  cycle: number;
  instructionIndex: number;
  raw: string;
  predicted: boolean;
  actual: boolean;
  correct: boolean;
}

export interface BranchPredictionProgram {
  instructions: Instruction[];
  predictorKind: PredictorKind;
}

export interface BranchPredictionSnapshot extends BaseCycleSnapshot {
  occupancy: Partial<Record<Stage, Slot>>;
  resolvedThisCycle: PredictionRecord | null;
  flushed: Slot | null;
  registers: Record<string, number>;
  registersChanged: string[];
  predictionLog: PredictionRecord[];
  predictorStates: { instructionIndex: number; raw: string; state: string }[];
  instructions: { index: number; raw: string }[];
  instructionsInFlight: number;
  instructionsCompleted: number;
  isFinal: boolean;
}

/**
 * Same in-order 5-stage pipeline as Module 3, but Fetch now consults a
 * pluggable predictor the instant it sees a branch, instead of always
 * assuming not-taken. Execute still resolves the real outcome and corrects
 * course on a misprediction — but a *correct* prediction costs zero bubbles,
 * which is the entire point of predicting at all.
 */
export class BranchPredictionEngine
  implements SimulationEngine<BranchPredictionSnapshot, BranchPredictionProgram>
{
  private instructions: Instruction[] = [];
  private predictor: Predictor = createPredictor("always-not-taken");
  private registers: Record<string, number> = {};
  private memory: number[] = [];
  private pc = 0;
  private ifid: Slot | null = null;
  private idex: DecodedSlot | null = null;
  private exmem: ExecutedSlot | null = null;
  private memwb: MemWbSlot | null = null;
  private cycleCount = 0;
  private history: BranchPredictionSnapshot[] = [];
  private predictionLog: PredictionRecord[] = [];
  private instructionsCompleted = 0;
  private branchSitesSeen: number[] = [];
  /** Safety valve: a mispredicted/adaptive loop could in principle run long; cap total instructions retired. */
  private retiredGuard = 0;

  initialize(program: BranchPredictionProgram): void {
    this.instructions = program.instructions;
    this.predictor = createPredictor(program.predictorKind);
    this.registers = Object.fromEntries(REGISTER_NAMES.map((r) => [r, 0]));
    this.memory = new Array(MEMORY_SIZE).fill(0);
    this.pc = 0;
    this.ifid = null;
    this.idex = null;
    this.exmem = null;
    this.memwb = null;
    this.cycleCount = 0;
    this.history = [];
    this.predictionLog = [];
    this.instructionsCompleted = 0;
    this.branchSitesSeen = [];
    this.retiredGuard = 0;
  }

  reset(): void {
    this.initialize({
      instructions: this.instructions,
      predictorKind: this.predictor.kind,
    });
  }

  getState(): BranchPredictionSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): BranchPredictionSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): BranchPredictionSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private isDrained(): boolean {
    return this.pc >= this.instructions.length && !this.ifid && !this.idex && !this.exmem && !this.memwb;
  }

  tick(): BranchPredictionSnapshot {
    this.cycleCount += 1;
    const cycle = this.cycleCount;

    if (this.isDrained() || this.retiredGuard > 500) {
      const snapshot: BranchPredictionSnapshot = {
        cycle,
        occupancy: {},
        resolvedThisCycle: null,
        flushed: null,
        registers: { ...this.registers },
        registersChanged: [],
        predictionLog: [...this.predictionLog],
        predictorStates: this.branchSitesSeen.map((i) => ({
          instructionIndex: i,
          raw: this.instructions[i].raw,
          state: this.predictor.describe(i),
        })),
        instructions: this.instructions.map((instr, index) => ({ index, raw: instr.raw })),
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
      this.retiredGuard += 1;
    }

    // --- MEMORY (no LOAD/STORE in this module's programs, but kept for generality) ---
    let newMemWb: MemWbSlot | null = null;
    if (this.exmem) {
      occupancy.MEMORY = { instructionIndex: this.exmem.instructionIndex, raw: this.exmem.raw };
      newMemWb = {
        instructionIndex: this.exmem.instructionIndex,
        raw: this.exmem.raw,
        result: this.exmem.aluResult,
      };
    }

    // --- EXECUTE (branches resolve here) ---
    let newExMem: ExecutedSlot | null = null;
    let branchTarget: number | null = null;
    let resolvedThisCycle: PredictionRecord | null = null;
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
        case "BEQ": {
          const actualTaken = this.idex.rs1Val === this.idex.rs2Val;
          const predicted = this.idex.predictedTaken ?? false;
          const correctTarget = actualTaken
            ? this.idex.instructionIndex + 1 + (instr.branchOffset ?? 0)
            : this.idex.instructionIndex + 1;
          this.predictor.update(this.idex.instructionIndex, actualTaken);
          resolvedThisCycle = {
            cycle,
            instructionIndex: this.idex.instructionIndex,
            raw: instr.raw,
            predicted,
            actual: actualTaken,
            correct: predicted === actualTaken,
          };
          this.predictionLog.push(resolvedThisCycle);
          if (predicted !== actualTaken) {
            branchTarget = correctTarget;
            notes.push(
              `${instr.raw} MISPREDICTED (guessed ${predicted ? "taken" : "not-taken"}, actually ${actualTaken ? "taken" : "not-taken"}) — flushing and redirecting.`,
            );
          } else {
            notes.push(`${instr.raw} predicted correctly (${actualTaken ? "taken" : "not-taken"}) — no bubble.`);
          }
          break;
        }
      }
      newExMem = { instructionIndex: this.idex.instructionIndex, raw: this.idex.raw, aluResult };
    }

    let flushed: Slot | null = null;
    if (branchTarget !== null && this.ifid) {
      flushed = this.ifid;
      notes.push(`Squashing "${this.ifid.raw}" — fetched on the mispredicted path.`);
      this.ifid = null;
    }

    // --- DECODE ---
    let newIdEx: DecodedSlot | null = null;
    let decodeStalled = false;
    if (this.ifid) {
      occupancy.DECODE = { instructionIndex: this.ifid.instructionIndex, raw: this.ifid.raw };
      const instr = this.instructions[this.ifid.instructionIndex];
      const needed = sourceRegisters(instr);
      const producers = [this.idex, this.exmem].filter((s): s is DecodedSlot | ExecutedSlot => s !== null);
      const hazardProducer = producers.find((p) => {
        const d = destRegister(this.instructions[p.instructionIndex]);
        return d && needed.includes(d);
      });

      if (hazardProducer) {
        decodeStalled = true;
        notes.push(`${instr.raw} stalls in Decode — waiting on an in-flight register (no forwarding in this module).`);
      } else {
        newIdEx = {
          instructionIndex: this.ifid.instructionIndex,
          raw: this.ifid.raw,
          rs1Val: readOperand(instr.src1, this.registers),
          rs2Val: instr.src2 ? readOperand(instr.src2, this.registers) : undefined,
          predictedTaken: this.ifid.predictedTaken,
        };
      }
    }

    // --- FETCH (consults the predictor the instant a branch is seen) ---
    let newPc = this.pc;
    if (branchTarget !== null) newPc = branchTarget;

    let newIfId: Slot | null;
    if (decodeStalled) {
      newIfId = this.ifid;
    } else if (newPc < this.instructions.length) {
      const instr = this.instructions[newPc];
      let predictedTaken: boolean | undefined;
      let afterFetchPc = newPc + 1;
      if (instr.opcode === "BEQ") {
        predictedTaken = this.predictor.predict(newPc);
        if (!this.branchSitesSeen.includes(newPc)) this.branchSitesSeen.push(newPc);
        if (predictedTaken) afterFetchPc = newPc + 1 + (instr.branchOffset ?? 0);
      }
      newIfId = { instructionIndex: newPc, raw: instr.raw, predictedTaken };
      occupancy.FETCH = newIfId;
      newPc = afterFetchPc;
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

    const snapshot: BranchPredictionSnapshot = {
      cycle,
      occupancy,
      resolvedThisCycle,
      flushed,
      registers: { ...this.registers },
      registersChanged,
      predictionLog: [...this.predictionLog],
      predictorStates: this.branchSitesSeen.map((i) => ({
        instructionIndex: i,
        raw: this.instructions[i].raw,
        state: this.predictor.describe(i),
      })),
      instructions: this.instructions.map((instr, index) => ({ index, raw: instr.raw })),
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

export { STAGES as BRANCH_PREDICTION_STAGES };
