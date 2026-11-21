"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Trophy } from "lucide-react";
import type { CompareScenario } from "@/simulation/compare/scenarios";
import { RaceBar } from "./race-bar";

/** Caller must pass `key={scenario.key}` so switching scenarios remounts
 * this component and resets cursor/isPlaying naturally, instead of
 * syncing them via an effect. */
export function CompareRunner({ scenario }: { scenario: CompareScenario }) {
  const maxFrames = Math.max(...scenario.sides.map((s) => s.frames.length));
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCursor((c) => {
        if (c >= maxFrames - 1) {
          setIsPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 200);
    return () => clearInterval(id);
  }, [isPlaying, maxFrames]);

  const bothFinished = cursor >= maxFrames - 1;

  return (
    <div className="glass flex flex-col gap-6 p-6">
      <div>
        <h3 className="text-sm font-medium">{scenario.label}</h3>
        <p className="mt-1 text-xs leading-relaxed text-foreground-muted">{scenario.question}</p>
      </div>

      <div className="flex flex-col gap-5">
        {scenario.sides.map((side) => (
          <RaceBar key={side.label} side={side} cursor={cursor} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setIsPlaying(false);
            setCursor((c) => Math.max(c - 1, 0));
          }}
          disabled={cursor === 0}
          className="rounded-md p-2 text-foreground-muted transition hover:bg-ink/6 hover:text-foreground disabled:opacity-30"
          aria-label="Step back"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="glow-blue flex items-center gap-2 rounded-md bg-neon-blue/15 px-4 py-2 text-sm font-medium text-neon-blue transition hover:bg-neon-blue/25"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isPlaying ? "Pause" : "Race"}
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setCursor((c) => Math.min(c + 1, maxFrames - 1));
          }}
          disabled={cursor >= maxFrames - 1}
          className="rounded-md p-2 text-foreground-muted transition hover:bg-ink/6 hover:text-foreground disabled:opacity-30"
          aria-label="Step forward"
        >
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => {
            setCursor(0);
            setIsPlaying(false);
          }}
          className="rounded-md p-2 text-foreground-muted transition hover:bg-ink/6 hover:text-foreground"
          aria-label="Restart"
        >
          <RotateCcw size={15} />
        </button>
        <input
          type="range"
          min={0}
          max={maxFrames - 1}
          value={cursor}
          onChange={(e) => {
            setIsPlaying(false);
            setCursor(Number(e.target.value));
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-[var(--neon-blue)]"
          aria-label="Race timeline"
        />
      </div>

      <AnimatePresence>
        {bothFinished && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glow-blue flex items-start gap-2 rounded-lg border border-neon-blue/40 bg-neon-blue/5 p-4 text-sm text-foreground"
          >
            <Trophy size={16} className="mt-0.5 shrink-0 text-neon-blue" />
            {scenario.verdict}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
