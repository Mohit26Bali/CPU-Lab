"use client";

import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { PipelineSnapshot } from "@/simulation/pipeline/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_LETTER: Record<Stage, string> = {
  FETCH: "F",
  DECODE: "D",
  EXECUTE: "E",
  MEMORY: "M",
  WRITEBACK: "W",
};

export function PipelineTimeline({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<PipelineSnapshot>>>;
}) {
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  const { instructions, totalCycles, matrix } = useMemo(() => {
    const nonFinal = history.filter((h) => !h.isFinal);
    const instructions = nonFinal[0]?.instructions ?? [];
    const totalCycles = nonFinal[0]?.totalCycles ?? 0;
    const matrix: (Stage | null)[][] = instructions.map(() => new Array(totalCycles).fill(null));

    for (const snap of nonFinal) {
      for (const [stage, slot] of Object.entries(snap.occupancy)) {
        if (slot) matrix[slot.instructionIndex][snap.cycle - 1] = stage as Stage;
      }
    }
    return { instructions, totalCycles, matrix };
  }, [history]);

  const currentCycle = history[currentIndex]?.cycle ?? 1;

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-hidden p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Pipeline Timeline
      </h3>
      <div className="flex-1 overflow-auto">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `100px repeat(${totalCycles}, 34px)` }}>
          <div />
          {Array.from({ length: totalCycles }, (_, c) => c + 1).map((c) => (
            <button
              key={c}
              onClick={() => jumpToCycle(c)}
              className={`rounded text-center font-mono text-[10px] transition ${
                c === currentCycle
                  ? "bg-neon-blue/20 text-neon-blue"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}

          {instructions.map(({ index, raw }) => {
            const color = chipColor(index);
            return (
              <div key={index} className="contents">
                <div className="flex items-center gap-1.5 truncate pr-2 font-mono text-[11px] text-foreground-muted">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
                  {raw}
                </div>
                {matrix[index].map((stage, c) => {
                  const isCurrentCol = c + 1 === currentCycle;
                  return (
                    <div
                      key={c}
                      className={`flex h-7 items-center justify-center rounded text-[10px] font-semibold ${
                        stage
                          ? `${color.chip} ${isCurrentCol ? color.glow : ""}`
                          : isCurrentCol
                            ? "bg-ink/[0.06]"
                            : ""
                      }`}
                    >
                      {stage ? STAGE_LETTER[stage] : ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
