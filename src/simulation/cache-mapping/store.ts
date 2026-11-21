import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { CacheMappingEngine, type CacheMappingSnapshot, type CacheMappingProgram, type MappingScheme } from "./engine";

/**
 * Addresses 0 and 32 are exactly TOTAL_LINES * BLOCK_SIZE apart (8 * 4 = 32)
 * — the classic direct-mapped conflict distance. Under direct mapping they
 * fight over the same single line and thrash on every access despite 7
 * other lines sitting empty. Under set-associative or full associativity,
 * both blocks fit at once and every access after the first hits.
 */
export const DEFAULT_TRACE = [0, 32, 0, 32, 0, 32, 0, 32];

export function cacheMappingProgram(scheme: MappingScheme): CacheMappingProgram {
  return { trace: DEFAULT_TRACE, scheme };
}

const engine = new CacheMappingEngine();

export const useCacheMappingPlayback = createPlaybackStore<CacheMappingSnapshot, CacheMappingProgram>(
  engine,
  cacheMappingProgram("direct"),
);
