"use client";

import { motion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { VirtualMemorySnapshot } from "@/simulation/virtual-memory/engine";

export function TlbGrid({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<VirtualMemorySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        TLB — {current.tlb.length} entries, fully associative, LRU
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {current.tlb.map((entry) => (
          <motion.div
            key={entry.index}
            animate={{ scale: entry.justInstalled ? 1.03 : 1 }}
            className={`flex flex-col gap-1 rounded-lg border p-3 transition-colors ${
              entry.justInstalled
                ? current.tlbHit
                  ? "glow-green border-neon-green/50 bg-neon-green/10"
                  : "glow-orange border-neon-orange/50 bg-neon-orange/10"
                : entry.vpn !== null
                  ? "border-glass-border bg-ink/[0.05]"
                  : "border-glass-border bg-ink/[0.025]"
            }`}
          >
            <span className="text-[9px] text-foreground-muted">line {entry.index}</span>
            {entry.vpn === null ? (
              <span className="font-mono text-sm text-foreground-muted">empty</span>
            ) : (
              <span className="font-mono text-sm">
                VPN <span className="text-neon-purple">{entry.vpn}</span> → PFN{" "}
                <span className="text-neon-blue">{entry.pfn}</span>
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
