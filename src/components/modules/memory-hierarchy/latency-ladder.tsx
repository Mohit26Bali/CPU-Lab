"use client";

import { motion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import { Hash, MemoryStick, Database, CircuitBoard, HardDrive } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { MemoryHierarchySnapshot } from "@/simulation/memory-hierarchy/engine";
import { formatNs, formatHumanScale } from "@/simulation/memory-hierarchy/format";

const ICONS: Record<string, LucideIcon> = {
  register: Hash,
  l1: MemoryStick,
  l2: MemoryStick,
  l3: MemoryStick,
  ram: Database,
  ssd: CircuitBoard,
  disk: HardDrive,
};

export function LatencyLadder({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<MemoryHierarchySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);
  if (!current) return null;

  return (
    <div className="glass flex h-full flex-col gap-2 overflow-y-auto p-4">
      <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Memory Hierarchy
      </h3>
      <div className="flex flex-col">
        {current.tiers.map((tier, i) => {
          const Icon = ICONS[tier.key] ?? MemoryStick;
          return (
            <div key={tier.key} className="flex flex-col items-stretch">
              <motion.button
                onClick={() => jumpToCycle(i + 1)}
                animate={{
                  scale: tier.isCurrent ? 1.02 : 1,
                  opacity: tier.revealed ? 1 : 0.35,
                }}
                transition={{ duration: 0.25 }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  tier.isCurrent
                    ? "glow-blue border-neon-blue/50 bg-neon-blue/10"
                    : tier.revealed
                      ? "border-glass-border bg-ink/[0.05]"
                      : "border-glass-border bg-ink/[0.025]"
                }`}
              >
                <Icon size={16} className={tier.isCurrent ? "text-neon-blue" : "text-foreground-muted"} />
                <div className="flex-1">
                  <div className="font-medium">{tier.label}</div>
                  <div className="text-[10px] text-foreground-muted">{tier.capacity}</div>
                </div>
                {tier.revealed && (
                  <div className="text-right">
                    <div className="font-mono text-sm text-neon-orange">{formatNs(tier.ns)}</div>
                    <div className="font-mono text-[10px] text-foreground-muted">
                      feels like {formatHumanScale(tier.humanScaleSeconds)}
                    </div>
                  </div>
                )}
              </motion.button>
              {i < current.tiers.length - 1 && (
                <div
                  className={`ml-6 h-3 w-px ${tier.revealed ? "pulse-wire bg-neon-blue" : "bg-glass-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
