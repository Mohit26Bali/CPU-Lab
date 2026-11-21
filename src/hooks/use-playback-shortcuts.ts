import { useEffect } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { BaseCycleSnapshot } from "@/types/simulation";
import type { PlaybackState } from "@/lib/playback/create-playback-store";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Space to play/pause, arrow keys to step, Ctrl/Cmd+R to replay from
 * cycle 1 — bound globally so it works no matter what's focused, except
 * while the user is actually typing (e.g. the Performance Analyzer's code
 * editor), where these keys need their normal text-editing meaning.
 */
export function usePlaybackShortcuts<TState extends BaseCycleSnapshot>(
  usePlayback: UseBoundStore<StoreApi<PlaybackState<TState>>>,
) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const store = usePlayback.getState();
      if (e.code === "Space") {
        e.preventDefault();
        store.toggle();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        store.stepForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        store.stepBackward();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        store.jumpToCycle(1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [usePlayback]);
}
