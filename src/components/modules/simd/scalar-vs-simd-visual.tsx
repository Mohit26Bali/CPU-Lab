"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Cpu, Layers3, Check } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { SimdSnapshot, LaneResult } from "@/simulation/simd/engine";

function LaneRow({ lanes }: { lanes: LaneResult[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {lanes.map((lane) => (
        <motion.div
          key={lane.index}
          animate={{ scale: lane.active ? 1.08 : 1 }}
          className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] ${
            lane.active
              ? "glow-blue border-neon-blue/60 bg-neon-blue/15"
              : lane.c !== null
                ? "border-neon-green/30 bg-neon-green/5"
                : "border-glass-border bg-ink/[0.04]"
          }`}
        >
          <span className="text-foreground-muted">{lane.index}</span>
          <AnimatePresence mode="wait">
            {lane.c !== null ? (
              <motion.span
                key="value"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`font-mono font-medium ${lane.active ? "text-neon-blue" : "text-neon-green"}`}
              >
                {lane.c}
              </motion.span>
            ) : (
              <span className="text-foreground-muted">·</span>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

export function ScalarVsSimdVisual({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SimdSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  return (
    <div className="glass flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Cycle {current.cycle} — C[i] = A[i] + B[i], 16 elements
        </h3>
        <span className="font-mono text-xs text-neon-orange">{current.laneWidth}-wide SIMD</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <Cpu size={14} />
          Scalar — one ADD per cycle
          <span className="ml-auto font-mono">
            {current.scalarCompleted}/16 · {current.scalarInstructionsIssued} instructions
          </span>
        </div>
        <LaneRow lanes={current.scalarLanes} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <Layers3 size={14} />
          SIMD — one ADDPS touches {current.laneWidth} lanes per cycle
          <span className="ml-auto flex items-center gap-1.5 font-mono">
            {current.simdCompleted}/16 · {current.simdInstructionsIssued} instructions
            {current.simdDone && <Check size={12} className="text-neon-green" />}
          </span>
        </div>
        <LaneRow lanes={current.simdLanes} />
      </div>
    </div>
  );
}
