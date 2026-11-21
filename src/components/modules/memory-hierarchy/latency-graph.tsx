"use client";

import { motion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { MemoryHierarchySnapshot } from "@/simulation/memory-hierarchy/engine";
import { formatNs, logScale } from "@/simulation/memory-hierarchy/format";
import { chipColor } from "@/lib/chip-colors";

export function LatencyGraph({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<MemoryHierarchySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);
  if (!current) return null;

  const minNs = Math.min(...current.tiers.map((t) => t.ns));
  const maxNs = Math.max(...current.tiers.map((t) => t.ns));

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Latency by Order of Magnitude (log scale)
      </h3>
      <div className="flex h-40 items-end gap-2">
        {current.tiers.map((tier, i) => {
          const heightFrac = Math.max(logScale(tier.ns, minNs, maxNs), 0.04);
          const color = chipColor(i);
          return (
            <button
              key={tier.key}
              onClick={() => jumpToCycle(i + 1)}
              className="flex flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="font-mono text-[9px] text-foreground-muted">{formatNs(tier.ns)}</span>
              <motion.div
                animate={{ height: `${heightFrac * 100}%`, opacity: tier.revealed ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className={`w-full rounded-t-md border-t-2 ${
                  tier.isCurrent ? `${color.chip} ${color.glow}` : `${color.chip}`
                }`}
                style={{ minHeight: 4 }}
              />
              <span className="text-[9px] text-foreground-muted">{tier.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-foreground-muted">
        Bar height is log-scaled — on a linear scale, every tier before RAM would be invisible
        next to disk.
      </p>
    </div>
  );
}
