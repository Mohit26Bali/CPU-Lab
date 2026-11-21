"use client";

import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { BranchPredictionSnapshot } from "@/simulation/branch-prediction/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_LETTER: Record<Stage, string> = {
  FETCH: "F",
  DECODE: "D",
  EXECUTE: "E",
  MEMORY: "M",
  WRITEBACK: "W",
};

export function BranchTimeline({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<BranchPredictionSnapshot>>>;
}) {
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  const { rows, totalCycles, markedCycles } = useMemo(() => {
    const nonFinal = history.filter((h) => !h.isFinal);
    const totalCycles = nonFinal.length;
    // One row per static instruction index; the loop revisits some indices multiple
    // times, but each visit lands at a distinct (globally increasing) cycle, so painting
    // straight into cells[cycle - 1] naturally captures every dynamic occurrence.
    const rowsMap = new Map<number, { raw: string; cells: (Stage | null)[] }>();
    const order: number[] = [];
    const markedCycles = new Map<number, "hit" | "miss">();

    const instructions = nonFinal[0]?.instructions ?? [];
    for (const instr of instructions) {
      rowsMap.set(instr.index, { raw: instr.raw, cells: new Array(totalCycles).fill(null) });
      order.push(instr.index);
    }
    for (const snap of nonFinal) {
      for (const [stage, slot] of Object.entries(snap.occupancy)) {
        if (!slot) continue;
        const row = rowsMap.get(slot.instructionIndex);
        if (row) row.cells[snap.cycle - 1] = stage as Stage;
      }
      if (snap.resolvedThisCycle) markedCycles.set(snap.cycle, snap.resolvedThisCycle.correct ? "hit" : "miss");
    }

    return { rows: order.map((i) => ({ index: i, ...rowsMap.get(i)! })), totalCycles, markedCycles };
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
          style={{ gridTemplateColumns: `140px repeat(${totalCycles}, 30px)` }}
        >
          <div />
          {Array.from({ length: totalCycles }, (_, c) => c + 1).map((c) => {
            const mark = markedCycles.get(c);
            return (
              <button
                key={c}
                onClick={() => jumpToCycle(c)}
                className={`rounded text-center font-mono text-[10px] transition ${
                  c === currentCycle
                    ? "bg-neon-blue/20 text-neon-blue"
                    : mark === "hit"
                      ? "text-neon-green"
                      : mark === "miss"
                        ? "text-neon-red"
                        : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            );
          })}

          {rows.map(({ index, raw, cells }) => {
            const color = chipColor(index);
            return (
              <div key={index} className="contents">
                <div className="flex items-center gap-1.5 truncate pr-2 font-mono text-[11px] text-foreground-muted">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
                  {raw}
                </div>
                {cells.map((stage, c) => {
                  const isCurrentCol = c + 1 === currentCycle;
                  const mark = markedCycles.get(c + 1);
                  const isResolveCell = stage === "EXECUTE" && mark;
                  return (
                    <div
                      key={c}
                      className={`flex h-7 items-center justify-center rounded text-[10px] font-semibold ${
                        isResolveCell
                          ? mark === "hit"
                            ? `border border-neon-green/50 bg-neon-green/15 text-neon-green ${isCurrentCol ? "glow-green" : ""}`
                            : `border border-neon-red/50 bg-neon-red/15 text-neon-red ${isCurrentCol ? "glow-red" : ""}`
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
        Green Execute cells mark a correct prediction · red marks a misprediction.
      </p>
    </div>
  );
}
