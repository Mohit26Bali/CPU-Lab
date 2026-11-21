"use client";

import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import { Database, Binary, Sigma, MemoryStick, CheckCircle2 } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { PipelineSnapshot } from "@/simulation/pipeline/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_META: { stage: Stage; label: string; icon: LucideIcon }[] = [
  { stage: "FETCH", label: "Fetch", icon: Database },
  { stage: "DECODE", label: "Decode", icon: Binary },
  { stage: "EXECUTE", label: "Execute", icon: Sigma },
  { stage: "MEMORY", label: "Memory", icon: MemoryStick },
  { stage: "WRITEBACK", label: "Writeback", icon: CheckCircle2 },
];

export function PipelineStageStrip({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<PipelineSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const occupancy = current?.occupancy ?? {};

  return (
    <div className="glass flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Pipeline — Cycle {current?.cycle ?? 1}
        </h3>
        <span className="font-mono text-xs text-neon-blue">
          {current?.instructionsInFlight ?? 0} in flight
        </span>
      </div>
      <LayoutGroup>
        <div className="grid grid-cols-5 gap-3">
          {STAGE_META.map(({ stage, label, icon: Icon }) => {
            const slot = occupancy[stage];
            const color = slot ? chipColor(slot.instructionIndex) : null;
            return (
              <div
                key={stage}
                className={`flex min-h-[128px] flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                  slot
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
                        className={`rounded-full border px-2.5 py-1.5 text-center font-mono text-[11px] font-medium ${color!.chip}`}
                      >
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
