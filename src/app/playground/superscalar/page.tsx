"use client";

import { useSuperscalarPlayback } from "@/simulation/superscalar/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { DualLaneStageStrip } from "@/components/modules/superscalar/dual-lane-stage-strip";
import { UtilizationGraph } from "@/components/modules/superscalar/utilization-graph";
import { SuperscalarInspector } from "@/components/inspector/superscalar-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { SuperscalarTheory } from "@/components/modules/superscalar/superscalar-theory";

export default function SuperscalarPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 12 — Superscalar"
        rightSlot={<SuperscalarTheory usePlayback={useSuperscalarPlayback} />}
      />

      <DualLaneStageStrip usePlayback={useSuperscalarPlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_320px]">
        <UtilizationGraph usePlayback={useSuperscalarPlayback} />
        <SuperscalarInspector usePlayback={useSuperscalarPlayback} />
      </div>

      <PlaybackControls usePlayback={useSuperscalarPlayback} />
    </main>
  );
}
