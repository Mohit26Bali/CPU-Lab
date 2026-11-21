"use client";

import { useState } from "react";
import { useHazardPlayback } from "@/simulation/pipeline-hazards/store";
import type { ScenarioKey } from "@/simulation/pipeline-hazards/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { HazardStageStrip } from "@/components/modules/pipeline-hazards/hazard-stage-strip";
import { HazardTimeline } from "@/components/modules/pipeline-hazards/hazard-timeline";
import { Scoreboard } from "@/components/modules/pipeline-hazards/scoreboard";
import { ScenarioTabs } from "@/components/modules/pipeline-hazards/scenario-tabs";
import { HazardInspector } from "@/components/inspector/hazard-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { HazardTheory } from "@/components/modules/pipeline-hazards/hazard-theory";

export default function PipelineHazardsPage() {
  const [scenario, setScenario] = useState<ScenarioKey>("data");

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 3 — Pipeline Hazards"
        rightSlot={<HazardTheory usePlayback={useHazardPlayback} activeScenario={scenario} />}
      />

      <ScenarioTabs usePlayback={useHazardPlayback} active={scenario} onChange={setScenario} />

      <HazardStageStrip usePlayback={useHazardPlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_280px_280px]">
        <HazardTimeline usePlayback={useHazardPlayback} />
        <Scoreboard usePlayback={useHazardPlayback} />
        <HazardInspector usePlayback={useHazardPlayback} />
      </div>

      <PlaybackControls usePlayback={useHazardPlayback} />
    </main>
  );
}
