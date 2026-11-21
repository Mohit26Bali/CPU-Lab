import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";

export type LaneWidth = 4 | 8 | 16;
export const TOTAL_ELEMENTS = 16;

export const DATA_A = Array.from({ length: TOTAL_ELEMENTS }, (_, i) => i + 1);
export const DATA_B = Array.from({ length: TOTAL_ELEMENTS }, (_, i) => (i + 1) * 10);

export interface SimdProgram {
  laneWidth: LaneWidth;
}

export interface LaneResult {
  index: number;
  a: number;
  b: number;
  c: number | null;
  active: boolean;
}

export interface SimdSnapshot extends BaseCycleSnapshot {
  laneWidth: LaneWidth;
  scalarLanes: LaneResult[];
  simdLanes: LaneResult[];
  scalarCompleted: number;
  simdCompleted: number;
  scalarInstructionsIssued: number;
  simdInstructionsIssued: number;
  scalarDone: boolean;
  simdDone: boolean;
  isFinal: boolean;
}

/**
 * Runs the exact same task — C[i] = A[i] + B[i] for 16 elements — two ways
 * at once, side by side: one ADD per cycle (scalar) vs one ADDPS per cycle
 * touching `laneWidth` elements simultaneously (SIMD). Both tracks advance
 * every tick using the same real data, so the speedup is something the
 * simulator computes, not a number asserted in a caption.
 */
export class SimdEngine implements SimulationEngine<SimdSnapshot, SimdProgram> {
  private laneWidth: LaneWidth = 4;
  private scalarIndex = 0;
  private simdIndex = 0;
  private scalarResult: (number | null)[] = [];
  private simdResult: (number | null)[] = [];
  private scalarInstructionsIssued = 0;
  private simdInstructionsIssued = 0;
  private cycleCount = 0;
  private history: SimdSnapshot[] = [];

  initialize(program: SimdProgram): void {
    this.laneWidth = program.laneWidth;
    this.scalarIndex = 0;
    this.simdIndex = 0;
    this.scalarResult = new Array(TOTAL_ELEMENTS).fill(null);
    this.simdResult = new Array(TOTAL_ELEMENTS).fill(null);
    this.scalarInstructionsIssued = 0;
    this.simdInstructionsIssued = 0;
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize({ laneWidth: this.laneWidth });
  }

  getState(): SimdSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): SimdSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): SimdSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private buildLanes(result: (number | null)[], activeStart: number, activeEnd: number): LaneResult[] {
    return DATA_A.map((a, i) => ({
      index: i,
      a,
      b: DATA_B[i],
      c: result[i],
      active: i >= activeStart && i < activeEnd,
    }));
  }

  tick(): SimdSnapshot {
    this.cycleCount += 1;

    const scalarDoneBefore = this.scalarIndex >= TOTAL_ELEMENTS;
    const simdDoneBefore = this.simdIndex >= TOTAL_ELEMENTS;
    if (scalarDoneBefore && simdDoneBefore) {
      const snapshot: SimdSnapshot = {
        cycle: this.cycleCount,
        laneWidth: this.laneWidth,
        scalarLanes: this.buildLanes(this.scalarResult, -1, -1),
        simdLanes: this.buildLanes(this.simdResult, -1, -1),
        scalarCompleted: this.scalarIndex,
        simdCompleted: this.simdIndex,
        scalarInstructionsIssued: this.scalarInstructionsIssued,
        simdInstructionsIssued: this.simdInstructionsIssued,
        scalarDone: true,
        simdDone: true,
        events: [{ kind: "race-complete", message: "Both approaches have finished." }],
        explanation: "Both the scalar loop and the SIMD loop have completed all 16 elements.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    let scalarStart = -1;
    let scalarEnd = -1;
    if (!scalarDoneBefore) {
      scalarStart = this.scalarIndex;
      this.scalarResult[this.scalarIndex] = DATA_A[this.scalarIndex] + DATA_B[this.scalarIndex];
      this.scalarIndex += 1;
      scalarEnd = this.scalarIndex;
      this.scalarInstructionsIssued += 1;
    }

    let simdStart = -1;
    let simdEnd = -1;
    if (!simdDoneBefore) {
      simdStart = this.simdIndex;
      simdEnd = Math.min(this.simdIndex + this.laneWidth, TOTAL_ELEMENTS);
      for (let i = simdStart; i < simdEnd; i++) {
        this.simdResult[i] = DATA_A[i] + DATA_B[i];
      }
      this.simdIndex = simdEnd;
      this.simdInstructionsIssued += 1;
    }

    const notes: string[] = [];
    if (scalarStart !== -1) notes.push(`Scalar ADD processes element ${scalarStart}.`);
    if (simdStart !== -1) {
      notes.push(`SIMD ADDPS processes elements ${simdStart}-${simdEnd - 1} (${simdEnd - simdStart} lanes) at once.`);
    } else if (simdDoneBefore && !scalarDoneBefore) {
      notes.push("SIMD already finished — idle while scalar catches up.");
    }

    const snapshot: SimdSnapshot = {
      cycle: this.cycleCount,
      laneWidth: this.laneWidth,
      scalarLanes: this.buildLanes(this.scalarResult, scalarStart, scalarEnd),
      simdLanes: this.buildLanes(this.simdResult, simdStart, simdEnd),
      scalarCompleted: this.scalarIndex,
      simdCompleted: this.simdIndex,
      scalarInstructionsIssued: this.scalarInstructionsIssued,
      simdInstructionsIssued: this.simdInstructionsIssued,
      scalarDone: this.scalarIndex >= TOTAL_ELEMENTS,
      simdDone: this.simdIndex >= TOTAL_ELEMENTS,
      events: [{ kind: "simd-tick", message: notes.join("  |  ") }],
      explanation: notes.join("  |  "),
      isFinal: false,
    };
    this.history.push(snapshot);
    return snapshot;
  }
}
