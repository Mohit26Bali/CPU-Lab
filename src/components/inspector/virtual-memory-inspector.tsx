"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { Check, X } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { VirtualMemorySnapshot } from "@/simulation/virtual-memory/engine";

export function VirtualMemoryInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<VirtualMemorySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  if (!current) return null;

  const requests = history.filter((h) => !h.isFinal);
  const total = current.hits + current.misses;
  const hitRate = total > 0 ? Math.round((current.hits / total) * 100) : 0;

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Request {current.requestIndex + 1}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="TLB Hit Rate" value={`${hitRate}%`} />
        <Stat label="Cumulative" value={`${current.cumulativeLatency}c`} />
        <Stat label="Hits" value={String(current.hits)} />
        <Stat label="Misses" value={String(current.misses)} />
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Request Trace
        </div>
        <div className="flex flex-col gap-1.5">
          {requests.map((r) => {
            const isCurrent = r.cycle === history[currentIndex]?.cycle;
            return (
              <button
                key={r.requestIndex}
                onClick={() => jumpToCycle(r.cycle)}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                  isCurrent ? "glass-inset border border-neon-blue/30" : "hover:bg-ink/[0.04]"
                }`}
              >
                {r.tlbHit ? (
                  <Check size={12} className="text-neon-green" />
                ) : (
                  <X size={12} className="text-neon-red" />
                )}
                <span className="font-mono text-[11px] text-foreground-muted">
                  vaddr {r.virtualAddress} (vpn {r.vpn}) → paddr {r.physicalAddress}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          What&apos;s happening
        </div>
        <p className="text-sm leading-relaxed text-foreground-muted">{current.explanation}</p>
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
