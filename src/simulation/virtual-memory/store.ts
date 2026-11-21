import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { VirtualMemoryEngine, type VirtualMemorySnapshot } from "./engine";

/**
 * Addresses as (VPN, offset) pairs, 256-byte pages:
 *   (0,10) (1,20) (2,5) (3,100) (0,50) (4,0) (1,200)
 * Four distinct VPNs fill the 4-entry TLB; accessing VPN 0 again at a
 * different offset should still TLB-hit (same page, different byte); VPN 4
 * is a 5th distinct page that forces an LRU eviction; the final VPN 1
 * request then depends on whether it survived that eviction.
 */
export const DEFAULT_TRACE = [10, 276, 517, 868, 50, 1024, 456];

const engine = new VirtualMemoryEngine();

export const useVirtualMemoryPlayback = createPlaybackStore<VirtualMemorySnapshot, number[]>(
  engine,
  DEFAULT_TRACE,
);
