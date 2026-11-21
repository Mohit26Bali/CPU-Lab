"use client";

import { usePipelinePlayback } from "@/simulation/pipeline/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { PipelineStageStrip } from "@/components/modules/pipeline/pipeline-stage-strip";
import { PipelineTimeline } from "@/components/modules/pipeline/pipeline-timeline";
import { PipelineInspector } from "@/components/inspector/pipeline-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { PipelineTheory } from "@/components/modules/pipeline/pipeline-theory";

export default function PipelinePage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 2 — Pipeline"
        rightSlot={<PipelineTheory usePlayback={usePipelinePlayback} />}
      />

      <PipelineStageStrip usePlayback={usePipelinePlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_320px]">
        <PipelineTimeline usePlayback={usePipelinePlayback} />
        <PipelineInspector usePlayback={usePipelinePlayback} />
      </div>

      <PlaybackControls usePlayback={usePipelinePlayback} />
    </main>
  );
}
