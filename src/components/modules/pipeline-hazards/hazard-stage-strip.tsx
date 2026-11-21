"use client";

import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import {
  Database,
  Binary,
  Sigma,
  MemoryStick,
  CheckCircle2,
  Hourglass,
  Lock,
  X,
} from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { HazardSnapshot } from "@/simulation/pipeline-hazards/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_META: { stage: Stage; label: string; icon: LucideIcon }[] = [
  { stage: "FETCH", label: "Fetch", icon: Database },
  { stage: "DECODE", label: "Decode", icon: Binary },
  { stage: "EXECUTE", label: "Execute", icon: Sigma },
  { stage: "MEMORY", label: "Memory", icon: MemoryStick },
  { stage: "WRITEBACK", label: "Writeback", icon: CheckCircle2 },
];

export function HazardStageStrip({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<HazardSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const occupancy = current?.occupancy ?? {};
  const hazard = current?.hazardActive ?? null;
  const flushed = current?.flushed ?? null;

  return (
    <div className="glass flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Pipeline — Cycle {current?.cycle ?? 1}
        </h3>
        <AnimatePresence mode="wait">
          {hazard && (
            <motion.span
              key={hazard.type + hazard.raw + (current?.cycle ?? 0)}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                hazard.type === "control"
                  ? "glow-red bg-neon-red/15 text-neon-red"
                  : "glow-orange bg-neon-orange/15 text-neon-orange"
              }`}
            >
              {hazard.type === "data" && <Hourglass size={12} />}
              {hazard.type === "structural" && <Lock size={12} />}
              {hazard.type === "control" && <X size={12} />}
              {hazard.type.toUpperCase()} HAZARD
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-5 gap-3">
          {STAGE_META.map(({ stage, label, icon: Icon }) => {
            const slot = occupancy[stage];
            const isDataStall = stage === "DECODE" && hazard?.type === "data";
            const isStructuralBlock = stage === "FETCH" && hazard?.type === "structural";
            const showFlushGhost = stage === "DECODE" && !slot && flushed;
            const color = slot ? chipColor(slot.instructionIndex) : null;

            return (
              <div
                key={stage}
                className={`flex min-h-[128px] flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                  isDataStall
                    ? "glow-orange border-neon-orange/40 bg-neon-orange/5"
                    : isStructuralBlock
                      ? "glow-orange border-neon-orange/40 bg-neon-orange/5"
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
                        key={`chip-${slot.instructionIndex}`}
                        layoutId={`chip-${slot.instructionIndex}`}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-center font-mono text-[11px] font-medium ${
                          isDataStall
                            ? "border-neon-orange/50 bg-neon-orange/15 text-neon-orange"
                            : color!.chip
                        }`}
                      >
                        {isDataStall && <Hourglass size={10} />}
                        {slot.raw}
                      </motion.div>
                    ) : isStructuralBlock ? (
                      <motion.div
                        key="structural-block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 rounded-full border border-neon-orange/50 bg-neon-orange/10 px-2.5 py-1.5 font-mono text-[10px] text-neon-orange"
                      >
                        <Lock size={10} />
                        port busy
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
