"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { BranchPredictionSnapshot } from "@/simulation/branch-prediction/engine";
import { branchPredictionProgram } from "@/simulation/branch-prediction/store";
import { PREDICTOR_LABELS, type PredictorKind } from "@/simulation/branch-prediction/predictors";

const DESCRIPTIONS: Record<PredictorKind, string> = {
  "always-taken": "Every branch guessed taken. Simple, sometimes right.",
  "always-not-taken": "Every branch guessed not-taken. The classic naive default.",
  "one-bit": "Predicts whatever the same branch did last time.",
  "two-bit": "A saturating counter — resists flipping on a single surprise.",
};

export function PredictorTabs({
  usePlayback,
  active,
  onChange,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<BranchPredictionSnapshot>>>;
  active: PredictorKind;
  onChange: (kind: PredictorKind) => void;
}) {
  const loadProgram = usePlayback((s) => s.loadProgram);

  return (
    <div className="glass flex flex-wrap items-center gap-2 p-3">
      {(Object.keys(PREDICTOR_LABELS) as PredictorKind[]).map((kind) => {
        const isActive = kind === active;
        return (
          <button
            key={kind}
            onClick={() => {
              onChange(kind);
              loadProgram(branchPredictionProgram(kind));
            }}
            className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
              isActive
                ? "glow-blue border-neon-blue/40 bg-neon-blue/10"
                : "border-glass-border bg-ink/[0.04] hover:border-neon-blue/20"
            }`}
          >
            <span className={`text-xs font-medium ${isActive ? "text-neon-blue" : "text-foreground"}`}>
              {PREDICTOR_LABELS[kind]}
            </span>
            <span className="text-[10px] text-foreground-muted">{DESCRIPTIONS[kind]}</span>
          </button>
        );
      })}
    </div>
  );
}
