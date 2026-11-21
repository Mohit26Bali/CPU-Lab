"use client";

import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { HazardSnapshot } from "@/simulation/pipeline-hazards/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_LETTER: Record<Stage, string> = {
  FETCH: "F",
  DECODE: "D",
  EXECUTE: "E",
  MEMORY: "M",
  WRITEBACK: "W",
};

export function HazardTimeline({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<HazardSnapshot>>>;
}) {
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  const { instructions, totalCycles, matrix, hazardCycles } = useMemo(() => {
    const nonFinal = history.filter((h) => !h.isFinal);
    const instructions = nonFinal[0]?.instructions ?? [];
    const totalCycles = nonFinal.length;
    const matrix: (Stage | null)[][] = instructions.map(() => new Array(totalCycles).fill(null));
    const hazardCycles = new Map<number, "data" | "structural" | "control">();

    for (const snap of nonFinal) {
      for (const [stage, slot] of Object.entries(snap.occupancy)) {
        if (slot) matrix[slot.instructionIndex][snap.cycle - 1] = stage as Stage;
      }
      if (snap.hazardActive) hazardCycles.set(snap.cycle, snap.hazardActive.type);
    }
    return { instructions, totalCycles, matrix, hazardCycles };
  }, [history]);

  const currentCycle = history[currentIndex]?.cycle ?? 1;

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-hidden p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Pipeline Timeline
      </h3>
      <div className="flex-1 overflow-auto">
        <div
          className="inline-grid gap-1"
          style={{ gridTemplateColumns: `140px repeat(${totalCycles}, 34px)` }}
        >
          <div />
          {Array.from({ length: totalCycles }, (_, c) => c + 1).map((c) => {
            const hazardType = hazardCycles.get(c);
            return (
              <button
                key={c}
                onClick={() => jumpToCycle(c)}
                className={`rounded text-center font-mono text-[10px] transition ${
                  c === currentCycle
                    ? "bg-neon-blue/20 text-neon-blue"
                    : hazardType === "control"
                      ? "text-neon-red"
                      : hazardType
                        ? "text-neon-orange"
                        : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            );
          })}

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
                  const hazardType = hazardCycles.get(c + 1);
                  const isHazardCell = stage === "DECODE" && hazardType === "data";
                  return (
                    <div
                      key={c}
                      className={`flex h-7 items-center justify-center rounded text-[10px] font-semibold ${
                        isHazardCell
                          ? `border border-neon-orange/50 bg-neon-orange/15 text-neon-orange ${isCurrentCol ? "glow-orange" : ""}`
                          : stage
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
      <p className="text-[10px] text-foreground-muted">
        Orange columns mark stall cycles · red columns mark a branch flush · gaps are bubbles.
      </p>
    </div>
  );
}
