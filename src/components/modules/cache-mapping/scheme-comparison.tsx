"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { CacheMappingEngine, SCHEME_CONFIG, type MappingScheme } from "@/simulation/cache-mapping/engine";
import { cacheMappingProgram } from "@/simulation/cache-mapping/store";

interface Result {
  scheme: MappingScheme;
  hits: number;
  misses: number;
  latency: number;
}

function evaluate(scheme: MappingScheme): Result {
  const engine = new CacheMappingEngine();
  engine.initialize(cacheMappingProgram(scheme));
  let last = engine.tick();
  let guard = 0;
  while (!last.isFinal && guard < 500) {
    last = engine.tick();
    guard += 1;
  }
  return { scheme, hits: last.hits, misses: last.misses, latency: last.cumulativeLatency };
}

export function SchemeComparison({ active }: { active: MappingScheme }) {
  const results = useMemo(() => (Object.keys(SCHEME_CONFIG) as MappingScheme[]).map(evaluate), []);
  const maxLatency = Math.max(...results.map((r) => r.latency));

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-neon-blue" />
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Same Trace, Same Budget
        </h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {results.map((r) => {
          const total = r.hits + r.misses;
          const pct = total > 0 ? Math.round((r.hits / total) * 100) : 0;
          const isActive = r.scheme === active;
          return (
            <div key={r.scheme} className={`flex flex-col gap-1 ${isActive ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className={isActive ? "text-neon-blue" : "text-foreground-muted"}>
                  {SCHEME_CONFIG[r.scheme].label}
                </span>
                <span className="font-mono text-foreground-muted">
                  {r.latency}c · {pct}% hit ({r.hits}/{total})
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/6">
                <div
                  className={`h-full rounded-full ${isActive ? "bg-neon-blue" : "bg-ink/15"}`}
                  style={{ width: `${(r.latency / maxLatency) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-foreground-muted">
        Same 8 addresses, same 8-line cache budget — only the mapping rule changes.
      </p>
    </div>
  );
}
