"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { LaneWidth, SimdSnapshot } from "@/simulation/simd/engine";
import { simdProgram } from "@/simulation/simd/store";

const WIDTHS: LaneWidth[] = [4, 8, 16];

export function WidthTabs({
  usePlayback,
  active,
  onChange,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SimdSnapshot>>>;
  active: LaneWidth;
  onChange: (w: LaneWidth) => void;
}) {
  const loadProgram = usePlayback((s) => s.loadProgram);

  return (
    <div className="glass flex flex-wrap items-center gap-2 p-3">
      {WIDTHS.map((w) => {
        const isActive = w === active;
        return (
          <button
            key={w}
            onClick={() => {
              onChange(w);
              loadProgram(simdProgram(w));
            }}
            className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
              isActive
                ? "glow-blue border-neon-blue/40 bg-neon-blue/10"
                : "border-glass-border bg-ink/[0.04] hover:border-neon-blue/20"
            }`}
          >
            <span className={`text-xs font-medium ${isActive ? "text-neon-blue" : "text-foreground"}`}>
              {w}-wide
            </span>
            <span className="text-[10px] text-foreground-muted">
              {16 / w} ADDPS instruction{16 / w === 1 ? "" : "s"} total
            </span>
          </button>
        );
      })}
    </div>
  );
}
