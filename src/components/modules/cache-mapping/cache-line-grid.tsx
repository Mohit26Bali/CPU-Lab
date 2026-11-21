"use client";

import { motion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheMappingSnapshot } from "@/simulation/cache-mapping/engine";

export function CacheLineGrid({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheMappingSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  const { sets, hit, config } = current;

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          {config.label} — {sets.length} set{sets.length === 1 ? "" : "s"} × {config.waysPerSet} way
          {config.waysPerSet === 1 ? "" : "s"}
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {sets.map((set) => {
          const isSelected = set.ways.some((w) => w.isSelected);
          return (
            <div
              key={set.index}
              className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                isSelected ? "glow-blue border-neon-blue/50 bg-neon-blue/5" : "border-glass-border bg-ink/[0.04]"
              }`}
            >
              <span className="w-10 shrink-0 font-mono text-[10px] text-foreground-muted">
                set {set.index}
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {set.ways.map((way, wi) => (
                  <motion.div
                    key={wi}
                    animate={{ scale: way.justInstalled ? 1.05 : 1 }}
                    className={`flex h-9 min-w-[42px] items-center justify-center rounded-md border font-mono text-xs ${
                      way.justInstalled
                        ? hit
                          ? "glow-green border-neon-green/50 bg-neon-green/15 text-neon-green"
                          : "glow-orange border-neon-orange/50 bg-neon-orange/15 text-neon-orange"
                        : way.tag !== null
                          ? "border-glass-border bg-ink/[0.06] text-foreground-muted"
                          : "border-glass-border bg-ink/[0.025] text-foreground-muted"
                    }`}
                  >
                    {way.tag === null ? "—" : way.tag}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
