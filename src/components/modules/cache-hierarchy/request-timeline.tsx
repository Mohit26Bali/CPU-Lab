"use client";

import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheHierarchySnapshot, CacheLevelName } from "@/simulation/cache-hierarchy/engine";

const LEVEL_COLOR: Record<CacheLevelName | "RAM", string> = {
  L1: "bg-neon-green text-neon-green",
  L2: "bg-neon-blue text-neon-blue",
  L3: "bg-neon-purple text-neon-purple",
  RAM: "bg-neon-red text-neon-red",
};

export function RequestTimeline({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheHierarchySnapshot>>>;
}) {
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  const requests = useMemo(() => history.filter((h) => !h.isFinal), [history]);
  const maxLatency = useMemo(() => Math.max(...requests.map((r) => r.requestLatency), 1), [requests]);

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Request Timeline
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-foreground-muted">
          {(["L1", "L2", "L3", "RAM"] as const).map((l) => (
            <span key={l} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${LEVEL_COLOR[l].split(" ")[0]}`} />
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-1.5">
          {requests.map((r) => {
            const isCurrent = r.cycle === history[currentIndex]?.cycle;
            const colorClasses = LEVEL_COLOR[r.hitLevel ?? "RAM"];
            return (
              <button
                key={r.requestIndex}
                onClick={() => jumpToCycle(r.cycle)}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                  isCurrent ? "glass-inset border border-neon-blue/30" : "hover:bg-ink/[0.04]"
                }`}
              >
                <span className="w-14 shrink-0 truncate font-mono text-[10px] text-foreground-muted">
                  block {r.block}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink/6">
                  <div
                    className={`h-full rounded-full ${colorClasses.split(" ")[0]}`}
                    style={{ width: `${(r.requestLatency / maxLatency) * 100}%` }}
                  />
                </div>
                <span className={`w-8 shrink-0 text-right font-mono text-[10px] ${colorClasses.split(" ")[1]}`}>
                  {r.requestLatency}c
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
