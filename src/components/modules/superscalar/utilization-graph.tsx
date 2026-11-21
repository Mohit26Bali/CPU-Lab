"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { Gauge } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { SuperscalarSnapshot } from "@/simulation/superscalar/engine";

export function UtilizationGraph({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SuperscalarSnapshot>>>;
}) {
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  const cycles = history.filter((h) => !h.isFinal);
  if (cycles.length === 0) return null;

  const totalIssued = cycles.reduce((sum, c) => sum + c.issuedThisCycle, 0);
  const maxPossible = cycles.length * 2;
  const avgIpc = (totalIssued / cycles.length).toFixed(2);
  const fullWidthCycles = cycles.filter((c) => c.issuedThisCycle === 2).length;
  const currentCycle = history[currentIndex]?.cycle ?? 1;

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-neon-blue" />
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Utilization
        </h3>
      </div>

      <div className="flex h-20 items-end gap-1">
        {cycles.map((c) => {
          const isCurrent = c.cycle === currentCycle;
          const heightPct = (c.issuedThisCycle / 2) * 100;
          const color =
            c.issuedThisCycle === 2 ? "bg-neon-green" : c.issuedThisCycle === 1 ? "bg-neon-orange" : "bg-ink/10";
          return (
            <button
              key={c.cycle}
              onClick={() => jumpToCycle(c.cycle)}
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              <div
                className={`w-full rounded-t-sm ${color} ${isCurrent ? "glow-blue" : ""}`}
                style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: 3 }}
              />
              <span className="text-[8px] text-foreground-muted">{c.cycle}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <Stat label="Avg IPC" value={avgIpc} />
        <Stat label="Full-width cycles" value={`${fullWidthCycles}/${cycles.length}`} />
        <Stat label="Peak possible" value={String(maxPossible)} />
      </div>
      <p className="text-[9px] text-foreground-muted">
        Green = 2 issued, orange = 1 issued, empty = stalled or draining.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-md px-2 py-1.5 text-center">
      <div className="text-foreground-muted">{label}</div>
      <div className="font-mono text-foreground">{value}</div>
    </div>
  );
}
