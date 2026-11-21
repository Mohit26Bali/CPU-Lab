"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { TrendingUp } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { SimdSnapshot } from "@/simulation/simd/engine";

export function SimdInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SimdSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);

  if (!current) return null;

  const simdFinishCycle = history.find((h) => !h.isFinal && h.simdDone)?.cycle ?? null;
  const speedup = simdFinishCycle ? (16 / simdFinishCycle).toFixed(1) : "—";
  const recentEvents = history.slice(Math.max(0, currentIndex - 6), currentIndex + 1).reverse();

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Cycle {current.cycle}</span>
      </div>

      <div className="glass-inset flex flex-col items-center gap-1 rounded-lg p-4 text-center">
        <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
          <TrendingUp size={12} />
          SIMD finished at cycle {simdFinishCycle ?? "…"} vs scalar&apos;s 16
        </div>
        <span className="text-2xl font-semibold text-neon-orange">{speedup}x</span>
        <span className="text-[10px] text-foreground-muted">speedup so far</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Scalar Instructions" value={String(current.scalarInstructionsIssued)} />
        <Stat label="SIMD Instructions" value={String(current.simdInstructionsIssued)} />
      </div>

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Event Log
        </div>
        <ul className="flex flex-col gap-1.5 font-mono text-[10px] text-foreground-muted">
          {recentEvents.map((snap) => (
            <li key={snap.cycle} className={snap === current ? "text-foreground" : ""}>
              <span className="text-neon-purple">C{snap.cycle}:</span> {snap.explanation}
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
