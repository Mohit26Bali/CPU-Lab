"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Clock } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { MemoryHierarchySnapshot } from "@/simulation/memory-hierarchy/engine";
import { formatHumanScale } from "@/simulation/memory-hierarchy/format";

export function HumanScalePanel({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<MemoryHierarchySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current || current.tierIndex < 0) return null;

  const tier = current.tiers[current.tierIndex];

  return (
    <div className="glass flex flex-col items-center gap-2 p-6 text-center">
      <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
        <Clock size={13} />
        If an L1 cache access felt like <span className="text-neon-blue">1 second</span>...
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tier.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center"
        >
          <span className="text-3xl font-semibold text-neon-orange">
            {formatHumanScale(tier.humanScaleSeconds)}
          </span>
          <span className="text-sm text-foreground-muted">is what {tier.label} would feel like</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
