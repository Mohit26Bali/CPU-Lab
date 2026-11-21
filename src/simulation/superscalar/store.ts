import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { SuperscalarEngine, type SuperscalarSnapshot } from "./engine";
import { parseProgram, type Instruction } from "@/simulation/pipeline-hazards/isa";

/**
 * Three fetch pairs, three different outcomes:
 *  (MOV R1,#5 / MOV R2,#10) — independent, both lanes issue: full 2-wide.
 *  (ADD R3,R1,R2 / MOV R4,#1) — ADD needs R1,R2 from the pair above and
 *    stalls; MOV R4 is completely independent but is stuck behind it
 *    anyway, because this machine is in-order.
 *  (LOAD R5,[0] / LOAD R6,[4]) — no data dependency between them, but only
 *    one memory port exists: a pure structural stall.
 */
export const DEFAULT_PROGRAM = `MOV R1, #5
MOV R2, #10
ADD R3, R1, R2
MOV R4, #1
LOAD R5, [0]
LOAD R6, [4]`;

const engine = new SuperscalarEngine();

export const useSuperscalarPlayback = createPlaybackStore<SuperscalarSnapshot, Instruction[]>(
  engine,
  parseProgram(DEFAULT_PROGRAM),
);
