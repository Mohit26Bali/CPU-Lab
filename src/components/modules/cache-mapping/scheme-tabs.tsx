"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheMappingSnapshot, MappingScheme } from "@/simulation/cache-mapping/engine";
import { SCHEME_CONFIG } from "@/simulation/cache-mapping/engine";
import { cacheMappingProgram } from "@/simulation/cache-mapping/store";

const DESCRIPTIONS: Record<MappingScheme, string> = {
  direct: "Every block has exactly one legal line. Fast to check, easy to thrash.",
  "set-associative": "Blocks map to a set of 2 lines — some flexibility, less thrashing.",
  full: "Any block can go in any of the 8 lines. Most flexible, needs LRU search.",
};

export function SchemeTabs({
  usePlayback,
  active,
  onChange,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheMappingSnapshot>>>;
  active: MappingScheme;
  onChange: (scheme: MappingScheme) => void;
}) {
  const loadProgram = usePlayback((s) => s.loadProgram);

  return (
    <div className="glass flex flex-wrap items-center gap-2 p-3">
      {(Object.keys(SCHEME_CONFIG) as MappingScheme[]).map((scheme) => {
        const isActive = scheme === active;
        return (
          <button
            key={scheme}
            onClick={() => {
              onChange(scheme);
              loadProgram(cacheMappingProgram(scheme));
            }}
            className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
              isActive
                ? "glow-blue border-neon-blue/40 bg-neon-blue/10"
                : "border-glass-border bg-ink/[0.04] hover:border-neon-blue/20"
            }`}
          >
            <span className={`text-xs font-medium ${isActive ? "text-neon-blue" : "text-foreground"}`}>
              {SCHEME_CONFIG[scheme].label}
            </span>
            <span className="text-[10px] text-foreground-muted">{DESCRIPTIONS[scheme]}</span>
          </button>
        );
      })}
    </div>
  );
}
