"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Cpu, Check, X, Timer } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheMappingSnapshot } from "@/simulation/cache-mapping/engine";

export function RequestResult({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheMappingSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current || current.address === null) return null;

  const { hit, latency, cumulativeLatency } = current;

  return (
    <div className="glass flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-2">
        <Cpu size={16} className="text-neon-purple" />
        <span className="font-mono text-sm">requests block {current.blockNumber}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.cycle}-${hit}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            hit ? "glow-green bg-neon-green/15 text-neon-green" : "glow-red bg-neon-red/15 text-neon-red"
          }`}
        >
          {hit ? <Check size={13} /> : <X size={13} />}
          {hit ? "HIT" : "MISS"}
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Timer size={13} className="text-neon-orange" />
        <span className="font-mono">
          +<span className="text-neon-orange">{latency}</span>c · total{" "}
          <span className="text-foreground">{cumulativeLatency}</span>c
        </span>
      </div>
    </div>
  );
}
