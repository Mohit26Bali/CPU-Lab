"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Check, X } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ReplacementSnapshot } from "@/simulation/replacement-policy/engine";
import { chipColor } from "@/lib/chip-colors";

export function CacheFillVisual({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ReplacementSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  return (
    <div className="glass flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          {current.policy.toUpperCase()} — Request {current.requestIndex + 1}
        </h3>
        {current.block !== null && (
          <AnimatePresence mode="wait">
            <motion.span
              key={`${current.cycle}-${current.hit}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                current.hit
                  ? "glow-green bg-neon-green/15 text-neon-green"
                  : "glow-red bg-neon-red/15 text-neon-red"
              }`}
            >
              {current.hit ? <Check size={12} /> : <X size={12} />}
              block {current.block} {current.hit ? "HIT" : "MISS"}
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {current.lines.map((line) => {
          const color = line.block !== null ? chipColor(line.block) : null;
          return (
            <div
              key={line.index}
              className={`flex h-24 flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                line.isVictim
                  ? "border-neon-red/40 bg-neon-red/5"
                  : line.justInstalled
                    ? "border-neon-blue/30 bg-ink/[0.05]"
                    : "border-glass-border bg-ink/[0.04]"
              }`}
            >
              <span className="text-[10px] text-foreground-muted">line {line.index}</span>
              <div className="flex flex-1 w-full items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {line.block !== null ? (
                    <motion.div
                      key={`${line.index}-${line.block}`}
                      initial={{ opacity: 0, y: -12, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.85 }}
                      transition={{ duration: 0.35 }}
                      className={`flex items-center justify-center rounded-full border px-3 py-1.5 font-mono text-sm font-medium ${color!.chip} ${
                        line.justInstalled ? color!.glow : ""
                      }`}
                    >
                      {line.block}
                    </motion.div>
                  ) : (
                    <span className="text-lg text-foreground-muted">·</span>
                  )}
                </AnimatePresence>
              </div>
              <span className="font-mono text-[9px] text-foreground-muted">
                {line.block === null ? "empty" : `used c${line.lastUsed}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
