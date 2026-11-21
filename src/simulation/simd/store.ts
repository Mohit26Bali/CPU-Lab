import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { SimdEngine, type SimdSnapshot, type SimdProgram, type LaneWidth } from "./engine";

export function simdProgram(laneWidth: LaneWidth): SimdProgram {
  return { laneWidth };
}

const engine = new SimdEngine();

export const useSimdPlayback = createPlaybackStore<SimdSnapshot, SimdProgram>(engine, simdProgram(4));
