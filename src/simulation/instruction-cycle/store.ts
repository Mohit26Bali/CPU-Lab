import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { InstructionCycleEngine, type InstructionCycleSnapshot } from "./engine";
import { DEFAULT_PROGRAM, parseProgram, type Instruction } from "./isa";

const engine = new InstructionCycleEngine();

export const useInstructionCyclePlayback = createPlaybackStore<
  InstructionCycleSnapshot,
  Instruction[]
>(engine, parseProgram(DEFAULT_PROGRAM));

export { parseProgram, DEFAULT_PROGRAM };
