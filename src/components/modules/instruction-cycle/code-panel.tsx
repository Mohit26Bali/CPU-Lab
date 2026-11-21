"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { InstructionCycleSnapshot } from "@/simulation/instruction-cycle/engine";

export function CodePanel({
  usePlayback,
  program,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<InstructionCycleSnapshot>>>;
  program: string[];
}) {
  const current = usePlayback((s) => s.current);
  const activeLine = current?.instructionIndex ?? -1;

  return (
    <div className="glass flex h-full flex-col gap-2 p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Program
      </h3>
      <pre className="flex-1 overflow-auto font-mono text-sm leading-relaxed">
        {program.map((line, i) => (
          <div
            key={i}
            className={`rounded px-2 py-1 transition-colors ${
              i === activeLine
                ? "glow-blue bg-neon-blue/10 text-foreground"
                : "text-foreground-muted"
            }`}
          >
            <span className="mr-3 select-none text-foreground-muted">
              {String(i).padStart(2, "0")}
            </span>
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}
