"use client";

import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import { Database, Binary, Sigma, MemoryStick, CheckCircle2 } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { SuperscalarSnapshot } from "@/simulation/superscalar/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_META: { stage: Stage; label: string; icon: LucideIcon }[] = [
  { stage: "FETCH", label: "Fetch", icon: Database },
  { stage: "DECODE", label: "Decode", icon: Binary },
  { stage: "EXECUTE", label: "Execute", icon: Sigma },
  { stage: "MEMORY", label: "Memory", icon: MemoryStick },
  { stage: "WRITEBACK", label: "Writeback", icon: CheckCircle2 },
];

export function DualLaneStageStrip({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SuperscalarSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;
  const occupancy = current.occupancy;

  return (
    <div className="glass flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          2-Wide Superscalar — Cycle {current.cycle}
        </h3>
        <span className="font-mono text-xs text-neon-blue">
          {current.issuedThisCycle}/2 issued this cycle
        </span>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-5 gap-3">
          {STAGE_META.map(({ stage, label, icon: Icon }) => {
            const lanes = occupancy[stage] ?? [null, null];
            const isExecuteStage = stage === "EXECUTE";
            return (
              <div
                key={stage}
                className="flex min-h-[128px] flex-col items-center justify-between gap-2 rounded-xl border border-glass-border bg-ink/[0.04] p-3"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                  <Icon size={14} />
                  {label}
                </div>
                <div className="flex w-full flex-1 flex-col items-center justify-center gap-1.5">
                  {lanes.map((slot, laneIdx) => {
                    const stalled =
                      isExecuteStage && current.executeStalledLanes[laneIdx] && stage === "EXECUTE";
                    const color = slot ? chipColor(slot.instructionIndex) : null;
                    return (
                      <div key={laneIdx} className="flex h-7 w-full items-center justify-center">
                        <AnimatePresence mode="popLayout">
                          {slot ? (
                            <motion.div
                              key={`${stage}-${laneIdx}-${slot.instructionIndex}`}
                              layoutId={`${stage}-lane${laneIdx}-${slot.instructionIndex}`}
                              transition={{ type: "spring", stiffness: 320, damping: 30 }}
                              className={`flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] font-medium ${
                                stalled
                                  ? "border-neon-orange/50 bg-neon-orange/15 text-neon-orange"
                                  : color!.chip
                              }`}
                            >
                              {slot.raw}
                            </motion.div>
                          ) : (
                            <span className="text-foreground-muted">·</span>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
