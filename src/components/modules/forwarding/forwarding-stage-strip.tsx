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
  ArrowLeft,
} from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ForwardingSnapshot } from "@/simulation/forwarding/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_META: { stage: Stage; label: string; icon: LucideIcon; col: number }[] = [
  { stage: "FETCH", label: "Fetch", icon: Database, col: 1 },
  { stage: "DECODE", label: "Decode", icon: Binary, col: 2 },
  { stage: "EXECUTE", label: "Execute", icon: Sigma, col: 3 },
  { stage: "MEMORY", label: "Memory", icon: MemoryStick, col: 4 },
  { stage: "WRITEBACK", label: "Writeback", icon: CheckCircle2, col: 5 },
];

export function ForwardingStageStrip({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ForwardingSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const occupancy = current?.occupancy ?? {};
  const forward = current?.forwardActive ?? null;
  const stall = current?.stallActive ?? null;

  const sourceCol = forward ? (forward.fromStage === "EX/MEM" ? 3 : 4) : null;

  return (
    <div className="glass flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Pipeline — Cycle {current?.cycle ?? 1}
        </h3>
        <AnimatePresence mode="wait">
          {forward ? (
            <motion.span
              key={`fwd-${forward.register}-${current?.cycle}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glow-purple flex items-center gap-1.5 rounded-full bg-neon-purple/15 px-2.5 py-1 text-[11px] font-medium text-neon-purple"
            >
              <ArrowLeft size={12} />
              FORWARDING {forward.register} from {forward.fromStage}
            </motion.span>
          ) : stall ? (
            <motion.span
              key={`stall-${current?.cycle}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glow-orange flex items-center gap-1.5 rounded-full bg-neon-orange/15 px-2.5 py-1 text-[11px] font-medium text-neon-orange"
            >
              <Hourglass size={12} />
              {stall.reason === "load-use" ? "LOAD-USE HAZARD — can't forward" : "STALL — forwarding disabled"}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-5 gap-x-3" style={{ gridTemplateRows: "16px auto" }}>
          {sourceCol !== null && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pulse-wire glow-purple h-0.5 self-center rounded-full bg-neon-purple"
              style={{ gridRow: 1, gridColumnStart: 2, gridColumnEnd: sourceCol + 1 }}
            />
          )}

          {STAGE_META.map(({ stage, label, icon: Icon, col }) => {
            const slot = occupancy[stage];
            const isStalled = stage === "DECODE" && stall;
            const isForwardTarget = stage === "DECODE" && forward;
            const isForwardSource = forward && col === sourceCol;
            const color = slot ? chipColor(slot.instructionIndex) : null;

            return (
              <div
                key={stage}
                style={{ gridRow: 2 }}
                className={`flex min-h-[128px] flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                  isStalled
                    ? "glow-orange border-neon-orange/40 bg-neon-orange/5"
                    : isForwardTarget || isForwardSource
                      ? "glow-purple border-neon-purple/40 bg-neon-purple/5"
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
                          isStalled
                            ? "border-neon-orange/50 bg-neon-orange/15 text-neon-orange"
                            : isForwardTarget
                              ? "border-neon-purple/50 bg-neon-purple/15 text-neon-purple"
                              : color!.chip
                        }`}
                      >
                        {isStalled && <Hourglass size={10} />}
                        {slot.raw}
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
