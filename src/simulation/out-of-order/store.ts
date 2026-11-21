import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { OutOfOrderEngine, type OutOfOrderSnapshot } from "./engine";
import { parseProgram, type Instruction } from "@/simulation/pipeline-hazards/isa";

/**
 * i2 (LOAD) is slow (4 cycles) and has no register dependencies, so it
 * starts executing immediately. i3 (ADD) only depends on the two fast MOVs
 * ahead of it and can execute *while the LOAD is still running* — real
 * out-of-order execution. i4 (MOV) is fully independent and finishes even
 * earlier. But the ROB only ever commits its head in order, so i3 and i4
 * sit "ready" for multiple cycles waiting for the slow LOAD to finally
 * finish and commit before they're allowed to retire.
 */
export const DEFAULT_PROGRAM = `MOV R3, #3
MOV R4, #4
LOAD R1, [0]
ADD R2, R3, R4
MOV R5, #7
SUB R6, R1, R2`;

const engine = new OutOfOrderEngine();

export const useOutOfOrderPlayback = createPlaybackStore<OutOfOrderSnapshot, Instruction[]>(
  engine,
  parseProgram(DEFAULT_PROGRAM),
);
