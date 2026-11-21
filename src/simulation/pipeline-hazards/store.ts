import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { PipelineHazardEngine, type HazardSnapshot, type PipelineHazardProgram } from "./engine";
import {
  parseProgram,
  DATA_HAZARD_PROGRAM,
  STRUCTURAL_HAZARD_PROGRAM,
  CONTROL_HAZARD_PROGRAM,
} from "./isa";

export type ScenarioKey = "data" | "structural" | "control";

export const SCENARIOS: Record<
  ScenarioKey,
  { label: string; program: string; unifiedMemory: boolean; description: string }
> = {
  data: {
    label: "Data Hazard",
    program: DATA_HAZARD_PROGRAM,
    unifiedMemory: false,
    description: "ADD and SUB need registers that haven't been written back yet.",
  },
  structural: {
    label: "Structural Hazard",
    program: STRUCTURAL_HAZARD_PROGRAM,
    unifiedMemory: true,
    description: "Fetch and Memory both want the same unified memory port.",
  },
  control: {
    label: "Control Hazard",
    program: CONTROL_HAZARD_PROGRAM,
    unifiedMemory: false,
    description: "A taken branch means the CPU fetched the wrong instruction.",
  },
};

export function scenarioProgram(key: ScenarioKey): PipelineHazardProgram {
  const s = SCENARIOS[key];
  return { instructions: parseProgram(s.program), unifiedMemory: s.unifiedMemory };
}

const engine = new PipelineHazardEngine();

export const useHazardPlayback = createPlaybackStore<HazardSnapshot, PipelineHazardProgram>(
  engine,
  scenarioProgram("data"),
);
