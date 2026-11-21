import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { CacheHierarchyEngine, type CacheHierarchySnapshot } from "./engine";

/**
 * Block numbers (not byte addresses — Module 7 covers address→line mapping).
 * Chosen to show: a first-touch miss cascading all the way to RAM, repeat
 * hits from temporal locality, and a real LRU eviction in L1 once more than
 * 4 distinct blocks are live, followed by an L2 hit that re-promotes an
 * evicted block back into L1.
 */
export const DEFAULT_TRACE = [0, 1, 2, 0, 1, 25, 50, 0, 75, 1];

const engine = new CacheHierarchyEngine();

export const useCacheHierarchyPlayback = createPlaybackStore<CacheHierarchySnapshot, number[]>(
  engine,
  DEFAULT_TRACE,
);
