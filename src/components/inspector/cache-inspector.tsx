"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheHierarchySnapshot } from "@/simulation/cache-hierarchy/engine";

export function CacheInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheHierarchySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);

  if (!current) return null;

  const totalHits = current.levelStats.reduce((sum, l) => (l.name !== "RAM" ? sum + l.hits : sum), 0);
  const totalChecks = current.levelStats.reduce((sum, l) => (l.name !== "RAM" ? sum + l.hits + l.misses : sum), 0);
  const cacheHitRate = totalChecks > 0 ? Math.round((totalHits / totalChecks) * 100) : 0;
  const requestsServed = current.requestLog.length;
  const avgLatency = requestsServed > 0 ? (current.cumulativeLatency / requestsServed).toFixed(1) : "0.0";

  const recentEvents = history.slice(Math.max(0, currentIndex - 5), currentIndex + 1).reverse();

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Request {current.requestIndex + 1}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Cache Hit Rate" value={`${cacheHitRate}%`} />
        <Stat label="Avg Latency" value={`${avgLatency}c`} />
        <Stat label="Requests Served" value={String(requestsServed)} />
        <Stat label="Total Latency" value={`${current.cumulativeLatency}c`} />
      </div>

      <div className="flex flex-col gap-3">
        {current.levels.map((level) => (
          <div key={level.name}>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
              <span>{level.name} · {level.lines.length} lines</span>
              <span className="font-mono normal-case text-foreground-muted">+{level.latency}c</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {level.lines.map((line, i) => (
                <div
                  key={`${level.name}-${i}-${line.block}-${line.justInstalled}`}
                  className={`glass-inset flex h-9 items-center justify-center rounded-md font-mono text-xs ${
                    line.justInstalled ? "flash-register glow-green" : ""
                  }`}
                >
                  {line.block === null ? (
                    <span className="text-foreground-muted">—</span>
                  ) : (
                    line.block
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Event Log
        </div>
        <ul className="flex flex-col gap-1.5 font-mono text-[10px] text-foreground-muted">
          {recentEvents.map((snap) => (
            <li key={snap.cycle} className={snap === current ? "text-foreground" : ""}>
              <span className="text-neon-purple">#{snap.requestIndex + 1}:</span> {snap.explanation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-md px-2.5 py-2">
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
