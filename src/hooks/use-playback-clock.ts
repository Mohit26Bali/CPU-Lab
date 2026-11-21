import { useEffect } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { BaseCycleSnapshot } from "@/types/simulation";
import type { PlaybackState } from "@/lib/playback/create-playback-store";

/**
 * Drives a playback store's stepForward() on an interval while isPlaying is
 * true. Kept out of the store itself so the store stays a pure state
 * container and the interval lifecycle follows React's mount/unmount.
 */
export function usePlaybackClock<TState extends BaseCycleSnapshot>(
  usePlayback: UseBoundStore<StoreApi<PlaybackState<TState>>>,
) {
  const isPlaying = usePlayback((s) => s.isPlaying);
  const speed = usePlayback((s) => s.speed);
  const msPerCycle = usePlayback((s) => s.msPerCycle);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = msPerCycle / speed;
    const id = setInterval(() => {
      usePlayback.getState().stepForward();
    }, intervalMs);
    return () => clearInterval(id);
  }, [isPlaying, speed, msPerCycle, usePlayback]);
}
