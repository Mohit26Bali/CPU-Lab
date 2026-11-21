import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { ForwardingEngine, type ForwardingSnapshot, type ForwardingProgram } from "./engine";
import { parseProgram } from "@/simulation/pipeline-hazards/isa";

export const FORWARDING_DEMO_PROGRAM = `MOV R1, #5
ADD R2, R1, R1
SUB R3, R2, R1
LOAD R4, [0]
ADD R5, R4, R1`;

export function forwardingProgram(forwardingEnabled: boolean): ForwardingProgram {
  return { instructions: parseProgram(FORWARDING_DEMO_PROGRAM), forwardingEnabled };
}

const engine = new ForwardingEngine();

export const useForwardingPlayback = createPlaybackStore<ForwardingSnapshot, ForwardingProgram>(
  engine,
  forwardingProgram(false),
);
