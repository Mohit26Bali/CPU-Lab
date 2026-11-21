import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { ReplacementPolicyEngine, type ReplacementSnapshot, type ReplacementProgram, type ReplacementPolicy } from "./engine";

/**
 * 4-line cache, 8 requests. Blocks 0-3 fill the cache in order. Block 0 is
 * re-accessed (refreshing its LRU recency but NOT its FIFO insertion order)
 * before block 4 forces the first eviction — engineered so FIFO and LRU are
 * forced to evict *different* blocks on that very first miss, and then
 * disagree again on whether block 1 is still resident when it's requested
 * again right after.
 */
export const DEFAULT_TRACE = [0, 1, 2, 3, 0, 4, 1, 5];
export const RANDOM_SEED = 7;

export function replacementProgram(policy: ReplacementPolicy): ReplacementProgram {
  return { trace: DEFAULT_TRACE, policy, seed: RANDOM_SEED };
}

const engine = new ReplacementPolicyEngine();

export const useReplacementPlayback = createPlaybackStore<ReplacementSnapshot, ReplacementProgram>(
  engine,
  replacementProgram("fifo"),
);
