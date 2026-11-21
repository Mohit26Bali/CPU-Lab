import type { BaseCycleSnapshot, SimulationEngine, Stage } from "@/types/simulation";
import type { Instruction } from "@/simulation/instruction-cycle/isa";

const STAGES: Stage[] = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"];

export interface PipelineSlot {
  instructionIndex: number;
  raw: string;
}

export interface PipelineSnapshot extends BaseCycleSnapshot {
  /** Which instruction (if any) currently occupies each of the 5 stages. */
  occupancy: Partial<Record<Stage, PipelineSlot>>;
  instructions: { index: number; raw: string }[];
  totalCycles: number;
  instructionsInFlight: number;
  instructionsCompleted: number;
}

/**
 * A textbook 5-stage in-order pipeline with one instruction issued per
 * cycle and no stalls — the goal of Module 2 is purely to show overlap
 * between instructions. Hazards and stalling are introduced in Module 3.
 */
export class PipelineEngine implements SimulationEngine<PipelineSnapshot, Instruction[]> {
  private instructions: Instruction[] = [];
  private cycleCount = 0;
  private history: PipelineSnapshot[] = [];
  private totalCycles = 0;

  initialize(program: Instruction[]): void {
    this.instructions = program;
    this.cycleCount = 0;
    this.history = [];
    this.totalCycles = program.length + STAGES.length - 1;
  }

  reset(): void {
    this.initialize(this.instructions);
  }

  getState(): PipelineSnapshot {
    if (this.history.length === 0) {
      throw new Error("Engine has not ticked yet. Call tick() at least once.");
    }
    return this.history[this.history.length - 1];
  }

  getHistory(): PipelineSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): PipelineSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  tick(): PipelineSnapshot {
    this.cycleCount += 1;
    const cycle = this.cycleCount;
    const isFinal = cycle > this.totalCycles;

    const occupancy: Partial<Record<Stage, PipelineSlot>> = {};
    let instructionsCompleted = 0;

    if (!isFinal) {
      for (let i = 0; i < this.instructions.length; i++) {
        const stageIdx = cycle - i - 1;
        if (stageIdx >= 0 && stageIdx < STAGES.length) {
          occupancy[STAGES[stageIdx]] = { instructionIndex: i, raw: this.instructions[i].raw };
        }
        if (stageIdx >= STAGES.length) instructionsCompleted += 1;
      }
    } else {
      instructionsCompleted = this.instructions.length;
    }

    const occupiedStages = STAGES.filter((s) => occupancy[s]);
    const explanation = isFinal
      ? "All instructions have drained from the pipeline."
      : occupiedStages.length > 0
        ? occupiedStages.map((s) => `${occupancy[s]!.raw} → ${s}`).join("  |  ")
        : "Pipeline idle.";

    const snapshot: PipelineSnapshot = {
      cycle,
      occupancy,
      instructions: this.instructions.map((instr, index) => ({ index, raw: instr.raw })),
      totalCycles: this.totalCycles,
      instructionsInFlight: occupiedStages.length,
      instructionsCompleted,
      events: [{ kind: "pipeline-tick", message: explanation }],
      explanation,
      isFinal,
    };
    this.history.push(snapshot);
    return snapshot;
  }
}

export { STAGES as PIPELINE_STAGES };
