"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import type { BaseCycleSnapshot } from "@/types/simulation";
import type { PlaybackSpeed, PlaybackState } from "@/lib/playback/create-playback-store";
import { usePlaybackClock } from "@/hooks/use-playback-clock";
import { usePlaybackShortcuts } from "@/hooks/use-playback-shortcuts";

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

export function PlaybackControls<TState extends BaseCycleSnapshot>({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<TState>>>;
}) {
  usePlaybackClock(usePlayback);
  usePlaybackShortcuts(usePlayback);

  const isPlaying = usePlayback((s) => s.isPlaying);
  const speed = usePlayback((s) => s.speed);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const total = usePlayback((s) => s.history.length);
  const toggle = usePlayback((s) => s.toggle);
  const stepForward = usePlayback((s) => s.stepForward);
  const stepBackward = usePlayback((s) => s.stepBackward);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);
  const setSpeed = usePlayback((s) => s.setSpeed);

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={stepBackward}
          disabled={currentIndex === 0}
          className="rounded-md p-2 text-foreground-muted transition hover:bg-ink/6 hover:text-foreground disabled:opacity-30"
          aria-label="Previous cycle"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={toggle}
          className="glow-blue flex items-center gap-2 rounded-md bg-neon-blue/15 px-4 py-2 text-sm font-medium text-neon-blue transition hover:bg-neon-blue/25"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={stepForward}
          disabled={currentIndex >= total - 1}
          className="rounded-md p-2 text-foreground-muted transition hover:bg-ink/6 hover:text-foreground disabled:opacity-30"
          aria-label="Next cycle"
        >
          <SkipForward size={18} />
        </button>
        <button
          onClick={() => jumpToCycle(1)}
          className="rounded-md p-2 text-foreground-muted transition hover:bg-ink/6 hover:text-foreground"
          aria-label="Replay from start"
        >
          <RotateCcw size={16} />
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-1 text-xs text-foreground-muted">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded px-2 py-1 transition ${
                speed === s
                  ? "bg-neon-purple/20 text-neon-purple"
                  : "hover:bg-ink/6 hover:text-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap font-mono text-xs text-foreground-muted">
          Cycle {currentIndex + 1} / {total}
        </span>
        <input
          type="range"
          min={1}
          max={total}
          value={currentIndex + 1}
          onChange={(e) => jumpToCycle(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-[var(--neon-blue)]"
          aria-label="Timeline"
        />
      </div>

      <p className="hidden text-[10px] text-foreground-muted sm:block">
        <kbd className="rounded border border-glass-border px-1 py-0.5">Space</kbd> play/pause ·{" "}
        <kbd className="rounded border border-glass-border px-1 py-0.5">←</kbd>{" "}
        <kbd className="rounded border border-glass-border px-1 py-0.5">→</kbd> step ·{" "}
        <kbd className="rounded border border-glass-border px-1 py-0.5">Ctrl+R</kbd> replay
      </p>
    </div>
  );
}
