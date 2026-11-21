"use client";

import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import { Database, Binary, Sigma, MemoryStick, CheckCircle2, Check, X, Target } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { BranchPredictionSnapshot } from "@/simulation/branch-prediction/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_META: { stage: Stage; label: string; icon: LucideIcon }[] = [
  { stage: "FETCH", label: "Fetch", icon: Database },
  { stage: "DECODE", label: "Decode", icon: Binary },
  { stage: "EXECUTE", label: "Execute", icon: Sigma },
  { stage: "MEMORY", label: "Memory", icon: MemoryStick },
  { stage: "WRITEBACK", label: "Writeback", icon: CheckCircle2 },
];

export function BranchStageStrip({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<BranchPredictionSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const occupancy = current?.occupancy ?? {};
  const resolved = current?.resolvedThisCycle ?? null;
  const flushed = current?.flushed ?? null;
  const isMispredict = resolved !== null && !resolved.correct;
  const isHit = resolved !== null && resolved.correct;

  return (
    <div
      className={`glass flex flex-col gap-4 p-6 transition-colors duration-300 ${
        isMispredict ? "border-neon-red/50 bg-neon-red/[0.04]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Pipeline — Cycle {current?.cycle ?? 1}
        </h3>
        <AnimatePresence mode="wait">
          {resolved && (
            <motion.span
              key={`res-${resolved.cycle}`}
              initial={{ opacity: 0, y: -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isHit
                  ? "glow-green bg-neon-green/15 text-neon-green"
                  : "glow-red bg-neon-red/15 text-neon-red"
              }`}
            >
              {isHit ? <Check size={12} /> : <X size={12} />}
              {isHit ? "PREDICTION CORRECT" : "MISPREDICTION — FLUSHING"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-5 gap-3">
          {STAGE_META.map(({ stage, label, icon: Icon }) => {
            const slot = occupancy[stage];
            const showFlushGhost = stage === "DECODE" && !slot && flushed;
            const color = slot ? chipColor(slot.instructionIndex) : null;
            const isExecuteResolving = stage === "EXECUTE" && resolved;

            return (
              <div
                key={stage}
                className={`flex min-h-[128px] flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                  isExecuteResolving
                    ? isHit
                      ? "glow-green border-neon-green/40 bg-neon-green/5"
                      : "glow-red border-neon-red/40 bg-neon-red/5"
                    : slot
                      ? `${color!.glow} border-neon-blue/30 bg-ink/[0.05]`
                      : "border-glass-border bg-ink/[0.04]"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                  <Icon size={14} />
                  {label}
                </div>
                <div className="flex flex-1 w-full items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    {slot ? (
                      <motion.div
                        key={`chip-${slot.instructionIndex}-${slot.raw}`}
                        layoutId={`chip-${stage}-${slot.instructionIndex}`}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className={`flex flex-col items-center gap-1 rounded-full border px-2.5 py-1.5 text-center font-mono text-[11px] font-medium ${color!.chip}`}
                      >
                        <span className="flex items-center gap-1">{slot.raw}</span>
                        {slot.predictedTaken !== undefined && stage === "FETCH" && (
                          <span className="flex items-center gap-0.5 text-[9px] text-foreground-muted">
                            <Target size={8} />
                            predict {slot.predictedTaken ? "taken" : "not-taken"}
                          </span>
                        )}
                      </motion.div>
                    ) : showFlushGhost ? (
                      <motion.div
                        key={`flush-${flushed.instructionIndex}-${current?.cycle}`}
                        initial={{ opacity: 0.9, scale: 1 }}
                        animate={{ opacity: 0, scale: 0.85 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex items-center gap-1 rounded-full border border-neon-red/50 bg-neon-red/10 px-2.5 py-1.5 font-mono text-[11px] text-neon-red line-through"
                      >
                        <X size={10} />
                        {flushed.raw}
                      </motion.div>
                    ) : (
                      <span className="text-lg text-foreground-muted">·</span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
