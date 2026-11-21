"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { MemoryHierarchySnapshot } from "@/simulation/memory-hierarchy/engine";
import { formatNs } from "@/simulation/memory-hierarchy/format";

export function MemoryHierarchyInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<MemoryHierarchySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current || current.tierIndex < 0) return null;

  const tier = current.tiers[current.tierIndex];
  const prevTier = current.tierIndex > 0 ? current.tiers[current.tierIndex - 1] : null;
  const jumpFactor = prevTier ? Math.round(tier.ns / prevTier.ns) : null;

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        CPU Inspector
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Current Tier" value={tier.label} />
        <Stat label="Latency" value={formatNs(tier.ns)} />
        <Stat label="Cumulative" value={formatNs(current.cumulativeNs)} />
        <Stat label="Capacity" value={tier.capacity} />
      </div>

      {jumpFactor !== null && (
        <div className="glass-inset rounded-md px-3 py-2 text-xs text-foreground-muted">
          <span className="text-neon-orange">{jumpFactor.toLocaleString()}x</span> slower than{" "}
          {prevTier!.label}
        </div>
      )}

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Why
        </div>
        <p className="text-sm leading-relaxed text-foreground-muted">{tier.note}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-md px-2.5 py-2">
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className="truncate font-mono text-sm">{value}</div>
    </div>
  );
}
