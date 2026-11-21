"use client";

import { useState } from "react";
import { useBranchPredictionPlayback } from "@/simulation/branch-prediction/store";
import type { PredictorKind } from "@/simulation/branch-prediction/predictors";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { BranchStageStrip } from "@/components/modules/branch-prediction/branch-stage-strip";
import { BranchTimeline } from "@/components/modules/branch-prediction/branch-timeline";
import { PredictorTabs } from "@/components/modules/branch-prediction/predictor-tabs";
import { AccuracyComparison } from "@/components/modules/branch-prediction/accuracy-comparison";
import { BranchInspector } from "@/components/inspector/branch-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { BranchTheory } from "@/components/modules/branch-prediction/branch-theory";

export default function BranchPredictionPage() {
  const [predictor, setPredictor] = useState<PredictorKind>("always-not-taken");

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 5 — Branch Prediction"
        rightSlot={
          <BranchTheory usePlayback={useBranchPredictionPlayback} activePredictor={predictor} />
        }
      />

      <PredictorTabs usePlayback={useBranchPredictionPlayback} active={predictor} onChange={setPredictor} />

      <BranchStageStrip usePlayback={useBranchPredictionPlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_280px_280px]">
        <BranchTimeline usePlayback={useBranchPredictionPlayback} />
        <AccuracyComparison usePlayback={useBranchPredictionPlayback} active={predictor} />
        <BranchInspector usePlayback={useBranchPredictionPlayback} />
      </div>

      <PlaybackControls usePlayback={useBranchPredictionPlayback} />
    </main>
  );
}
