"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Check, Hourglass, ArrowRight } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { OutOfOrderSnapshot } from "@/simulation/out-of-order/engine";
import { chipColor } from "@/lib/chip-colors";

export function ReorderBufferPanel({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<OutOfOrderSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  const headIndex = current.rob.findIndex((r) => !r.committed);

  return (
    <div className="glass flex h-full flex-col gap-2 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Reorder Buffer — commits head only, in order
        </h3>
        <span className="font-mono text-[10px] text-foreground-muted">
          {current.instructionsCommitted} / {current.rob.length + current.instructionQueue.length} committed
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {current.rob.map((entry, i) => {
          const color = chipColor(entry.instrIndex);
          const isHead = i === headIndex;
          const justCommitted = entry.index === current.committedRobIndex;
          return (
            <motion.div
              key={entry.index}
              animate={{ scale: justCommitted ? 1.02 : 1 }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                isHead
                  ? "glow-blue border-neon-blue/50 bg-neon-blue/5"
                  : entry.committed
                    ? "border-neon-green/30 bg-neon-green/5"
                    : "border-glass-border bg-ink/[0.04]"
              }`}
            >
              {isHead && <ArrowRight size={12} className="shrink-0 text-neon-blue" />}
              <span className="w-9 shrink-0 font-mono text-[10px] text-foreground-muted">
                ROB{entry.index}
              </span>
              <span className={`flex-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${color.chip}`}>
                {entry.raw}
              </span>
              <AnimatePresence mode="wait">
                {entry.committed ? (
                  <motion.span
                    key="committed"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 rounded-full bg-neon-green/15 px-2 py-0.5 text-[9px] text-neon-green"
                  >
                    <Check size={9} />
                    committed{entry.value !== null ? ` (${entry.value})` : ""}
                  </motion.span>
                ) : entry.ready ? (
                  <motion.span
                    key="ready"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 rounded-full bg-neon-orange/15 px-2 py-0.5 text-[9px] text-neon-orange"
                  >
                    <Hourglass size={9} />
                    ready ({entry.value}), waiting to commit
                  </motion.span>
                ) : (
                  <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[9px] text-foreground-muted">
                    executing
                  </span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {current.instructionQueue.map((instr) => (
          <div
            key={`q-${instr.instrIndex}`}
            className="flex items-center gap-2 rounded-lg border border-dashed border-glass-border px-3 py-2 opacity-40"
          >
            <span className="w-9 shrink-0 font-mono text-[10px] text-foreground-muted">—</span>
            <span className="flex-1 font-mono text-[10px] text-foreground-muted">{instr.raw}</span>
            <span className="text-[9px] text-foreground-muted">not dispatched</span>
          </div>
        ))}
      </div>
    </div>
  );
}
