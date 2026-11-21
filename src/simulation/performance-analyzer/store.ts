import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { PipelineHazardEngine, type HazardSnapshot, type PipelineHazardProgram } from "@/simulation/pipeline-hazards/engine";
import { parseProgram } from "@/simulation/pipeline-hazards/isa";

/**
 * A real loop (same negative-offset BEQ trick as Module 5): counts down
 * from 5, loading the same address each iteration, summing into R2. Five
 * dynamic LOADs from one static instruction — good for showing that a
 * static instruction scan isn't the same as the actual execution trace.
 */
export const DEFAULT_CODE = `MOV R1, #5
MOV R2, #0
MOV R3, #1
MOV R5, #0
LOAD R4, [0]
ADD R2, R2, R4
SUB R1, R1, R3
BEQ R1, R5, #1
BEQ R0, R0, #-5
MOV R6, #99`;

export function parseAnalyzerCode(code: string): PipelineHazardProgram {
  return { instructions: parseProgram(code), unifiedMemory: false };
}

const engine = new PipelineHazardEngine();

export const usePerformanceAnalyzerPlayback = createPlaybackStore<HazardSnapshot, PipelineHazardProgram>(
  engine,
  parseAnalyzerCode(DEFAULT_CODE),
);
