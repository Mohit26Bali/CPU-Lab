"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Radio } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { OutOfOrderSnapshot } from "@/simulation/out-of-order/engine";
import { InstructionChip } from "./instruction-chip";

export function ExecutionUnitsPanel({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<OutOfOrderSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Execution Units
        </h3>
        <AnimatePresence mode="wait">
          {current.broadcastRobIndex !== null && (
            <motion.span
              key={current.broadcastRobIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glow-purple flex items-center gap-1 rounded-full bg-neon-purple/15 px-2 py-0.5 text-[9px] text-neon-purple"
            >
              <Radio size={9} />
              CDB: ROB{current.broadcastRobIndex}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-1.5">
        {current.eu.map((unit) => (
          <div
            key={unit.id}
            className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-md border px-2 py-1.5 ${
              unit.resultReady
                ? "glow-orange border-neon-orange/40 bg-neon-orange/5"
                : unit.busy
                  ? "border-neon-blue/30 bg-ink/[0.05]"
                  : "border-glass-border bg-ink/[0.025]"
            }`}
          >
            <span className="shrink-0 text-[9px] text-foreground-muted">{unit.unitType}{unit.id}</span>
            {unit.busy ? (
              <div className="flex flex-wrap items-center gap-2">
                <InstructionChip raw={unit.raw!} index={unit.instrIndex!} small />
                <span className="font-mono text-[9px] text-neon-orange">
                  {unit.resultReady ? "waiting for bus" : `${unit.remainingCycles}c left`}
                </span>
              </div>
            ) : (
              <span className="text-[9px] text-foreground-muted">idle</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
