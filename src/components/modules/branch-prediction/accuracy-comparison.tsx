"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { BranchPredictionEngine } from "@/simulation/branch-prediction/engine";
import { branchPredictionProgram } from "@/simulation/branch-prediction/store";
import { PREDICTOR_LABELS, type PredictorKind } from "@/simulation/branch-prediction/predictors";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { StoreApi, UseBoundStore } from "zustand";
import type { BranchPredictionSnapshot } from "@/simulation/branch-prediction/engine";

interface Result {
  kind: PredictorKind;
  cycles: number;
  correct: number;
  total: number;
}

function evaluate(kind: PredictorKind): Result {
  const engine = new BranchPredictionEngine();
  engine.initialize(branchPredictionProgram(kind));
  let last = engine.tick();
  let guard = 0;
  while (!last.isFinal && guard < 500) {
    last = engine.tick();
    guard += 1;
  }
  const correct = last.predictionLog.filter((p) => p.correct).length;
  return { kind, cycles: last.cycle, correct, total: last.predictionLog.length };
}

export function AccuracyComparison({
  usePlayback,
  active,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<BranchPredictionSnapshot>>>;
  active: PredictorKind;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);
  const results = useMemo(
    () => (Object.keys(PREDICTOR_LABELS) as PredictorKind[]).map(evaluate),
    [],
  );
  const maxCycles = Math.max(...results.map((r) => r.cycles));

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-neon-blue" />
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Predictor Comparison
        </h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {results.map((r) => {
          const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
          const isActive = r.kind === active;
          return (
            <div key={r.kind} className={`flex flex-col gap-1 ${isActive ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className={isActive ? "text-neon-blue" : "text-foreground-muted"}>
                  {PREDICTOR_LABELS[r.kind]}
                </span>
                <span className="font-mono text-foreground-muted">
                  {r.cycles}c · {pct}% ({r.correct}/{r.total})
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/6">
                <div
                  className={`h-full rounded-full ${isActive ? "bg-neon-blue" : "bg-ink/15"}`}
                  style={{ width: `${(r.cycles / maxCycles) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => jumpToCycle(1)}
        className="mt-1 self-start text-[10px] text-foreground-muted underline decoration-dotted hover:text-foreground"
      >
        Replay this predictor from cycle 1
      </button>
    </div>
  );
}
