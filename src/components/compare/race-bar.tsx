"use client";

import { motion } from "framer-motion";
import type { RaceSide } from "@/simulation/compare/scenarios";

const ACCENT: Record<RaceSide["accent"], { text: string; bg: string; glow: string }> = {
  blue: { text: "text-neon-blue", bg: "bg-neon-blue", glow: "glow-blue" },
  green: { text: "text-neon-green", bg: "bg-neon-green", glow: "glow-green" },
  orange: { text: "text-neon-orange", bg: "bg-neon-orange", glow: "glow-orange" },
  purple: { text: "text-neon-purple", bg: "bg-neon-purple", glow: "glow-purple" },
  red: { text: "text-neon-red", bg: "bg-neon-red", glow: "glow-red" },
};

export function RaceBar({ side, cursor }: { side: RaceSide; cursor: number }) {
  const idx = Math.min(cursor, side.frames.length - 1);
  const frame = side.frames[idx];
  const finished = idx >= side.frames.length - 1;
  const color = ACCENT[side.accent];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${color.text}`}>{side.label}</span>
        <span className="font-mono text-foreground-muted">
          {finished ? `done — ${side.summary}` : `cycle ${frame.cycle}`}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-ink/6">
        <motion.div
          className={`h-full rounded-full ${color.bg} ${finished ? color.glow : ""}`}
          animate={{ width: `${frame.progress * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
      <p className="truncate font-mono text-[10px] text-foreground-muted">{frame.note}</p>
    </div>
  );
}
