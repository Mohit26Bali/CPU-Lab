import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { BranchPredictionEngine, type BranchPredictionSnapshot, type BranchPredictionProgram } from "./engine";
import { parseProgram } from "@/simulation/pipeline-hazards/isa";
import type { PredictorKind } from "./predictors";

/**
 * A real loop: R1 counts down from 3. i4 exits when R1 hits 0 (taken on the
 * 3rd iteration only — pattern NOT-TAKEN, NOT-TAKEN, TAKEN). i5 is an
 * unconditional jump back to the loop top (R0 == R0 always), taken every
 * time it's reached. Two real branch sites, each executed multiple times,
 * so an adaptive predictor has something genuine to learn from.
 */
export const LOOP_PROGRAM = `MOV R1, #3
MOV R2, #1
SUB R1, R1, R2
MOV R3, #0
BEQ R1, R3, #1
BEQ R0, R0, #-4
MOV R4, #99`;

export function branchPredictionProgram(predictorKind: PredictorKind): BranchPredictionProgram {
  return { instructions: parseProgram(LOOP_PROGRAM), predictorKind };
}

const engine = new BranchPredictionEngine();

export const useBranchPredictionPlayback = createPlaybackStore<
  BranchPredictionSnapshot,
  BranchPredictionProgram
>(engine, branchPredictionProgram("always-not-taken"));
