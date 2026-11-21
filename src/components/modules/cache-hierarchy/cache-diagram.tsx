"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Cpu, MemoryStick, Database, Check, X, Timer } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheHierarchySnapshot, CacheLevelName } from "@/simulation/cache-hierarchy/engine";
import { DEFAULT_LEVELS, RAM_LATENCY } from "@/simulation/cache-hierarchy/engine";

const NODES: { key: CacheLevelName | "RAM"; label: string; latency: number }[] = [
  ...DEFAULT_LEVELS.map((l) => ({ key: l.name, label: l.name, latency: l.latency })),
  { key: "RAM", label: "RAM", latency: RAM_LATENCY },
];

export function CacheDiagram({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheHierarchySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const path = current?.path ?? [];

  const stepFor = (key: CacheLevelName | "RAM") => path.find((p) => p.level === key);

  return (
    <div className="glass flex h-full flex-col items-center gap-3 overflow-y-auto p-6">
      <div className="flex w-full items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Memory Request
        </h3>
        {current?.block !== null && current && (
          <span className="font-mono text-xs text-neon-blue">block {current.block}</span>
        )}
      </div>

      <div className="flex w-full max-w-xs flex-col items-center">
        <div className="flex w-full items-center gap-3 rounded-xl border border-neon-purple/40 bg-neon-purple/10 px-4 py-3 text-sm">
          <Cpu size={16} className="text-neon-purple" />
          <span className="flex-1 text-center">CPU</span>
        </div>
        <Wire active={path.length > 0} />

        {NODES.map((node, i) => {
          const step = stepFor(node.key);
          const reached = step !== undefined;
          const isHit = step?.hit === true;
          const isMiss = step !== undefined && !step.hit;

          return (
            <div key={node.key} className="flex w-full flex-col items-center">
              <motion.div
                animate={{
                  scale: reached ? 1.03 : 1,
                  opacity: reached ? 1 : 0.5,
                }}
                transition={{ duration: 0.25 }}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  isHit
                    ? "glow-green border-neon-green/50 bg-neon-green/10"
                    : isMiss
                      ? "glow-red border-neon-red/50 bg-neon-red/10"
                      : "border-glass-border bg-ink/[0.04] text-foreground-muted"
                }`}
              >
                {node.key === "RAM" ? (
                  <Database size={16} className={isHit ? "text-neon-green" : "text-foreground-muted"} />
                ) : (
                  <MemoryStick size={16} className={isHit ? "text-neon-green" : isMiss ? "text-neon-red" : "text-foreground-muted"} />
                )}
                <span className="flex-1 text-center">
                  {node.label}
                  <span className="ml-1.5 text-[10px] text-foreground-muted">+{node.latency}c</span>
                </span>
                <AnimatePresence mode="wait">
                  {reached && (
                    <motion.span
                      key={isHit ? "hit" : "miss"}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isHit ? "bg-neon-green/12 text-neon-green" : "bg-neon-red/12 text-neon-red"
                      }`}
                    >
                      {isHit ? <Check size={10} /> : <X size={10} />}
                      {isHit ? "HIT" : "MISS"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              {i < NODES.length - 1 && <Wire active={reached && isMiss} />}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-full border border-glass-border px-3 py-1.5">
        <Timer size={13} className="text-neon-orange" />
        <span className="font-mono text-xs">
          this request: <span className="text-neon-orange">{current?.requestLatency ?? 0}</span> cycles
        </span>
      </div>
    </div>
  );
}

function Wire({ active }: { active: boolean }) {
  return <div className={`h-5 w-px ${active ? "pulse-wire bg-neon-blue" : "bg-glass-border"}`} />;
}
