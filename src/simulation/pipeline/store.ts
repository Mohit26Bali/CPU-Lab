import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { PipelineEngine, type PipelineSnapshot } from "./engine";
import { DEFAULT_PROGRAM, parseProgram, type Instruction } from "@/simulation/instruction-cycle/isa";

const engine = new PipelineEngine();

export const usePipelinePlayback = createPlaybackStore<PipelineSnapshot, Instruction[]>(
  engine,
  parseProgram(DEFAULT_PROGRAM),
);

export { parseProgram, DEFAULT_PROGRAM };
