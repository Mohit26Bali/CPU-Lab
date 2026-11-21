"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ReplacementPolicy, ReplacementSnapshot } from "@/simulation/replacement-policy/engine";
import { replacementProgram } from "@/simulation/replacement-policy/store";

const POLICIES: { key: ReplacementPolicy; label: string; description: string }[] = [
  { key: "fifo", label: "FIFO", description: "Evicts whichever block was inserted longest ago — usage never resets the clock." },
  { key: "lru", label: "LRU", description: "Evicts whichever block hasn't been touched in the longest time." },
  { key: "random", label: "Random", description: "Evicts a uniformly random resident line. Cheap, no bookkeeping." },
];

export function PolicyTabs({
  usePlayback,
  active,
  onChange,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ReplacementSnapshot>>>;
  active: ReplacementPolicy;
  onChange: (policy: ReplacementPolicy) => void;
}) {
  const loadProgram = usePlayback((s) => s.loadProgram);

  return (
    <div className="glass flex flex-wrap items-center gap-2 p-3">
      {POLICIES.map(({ key, label, description }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => {
              onChange(key);
              loadProgram(replacementProgram(key));
            }}
            className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
              isActive
                ? "glow-blue border-neon-blue/40 bg-neon-blue/10"
                : "border-glass-border bg-ink/[0.04] hover:border-neon-blue/20"
            }`}
          >
            <span className={`text-xs font-medium ${isActive ? "text-neon-blue" : "text-foreground"}`}>
              {label}
            </span>
            <span className="text-[10px] text-foreground-muted">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
