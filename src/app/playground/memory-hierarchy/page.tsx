"use client";

import { useMemoryHierarchyPlayback } from "@/simulation/memory-hierarchy/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { LatencyLadder } from "@/components/modules/memory-hierarchy/latency-ladder";
import { LatencyGraph } from "@/components/modules/memory-hierarchy/latency-graph";
import { HumanScalePanel } from "@/components/modules/memory-hierarchy/human-scale-panel";
import { MemoryHierarchyInspector } from "@/components/inspector/memory-hierarchy-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { MemoryHierarchyTheory } from "@/components/modules/memory-hierarchy/memory-hierarchy-theory";

export default function MemoryHierarchyPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 9 — Memory Hierarchy"
        rightSlot={<MemoryHierarchyTheory usePlayback={useMemoryHierarchyPlayback} />}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[280px_1fr_280px]">
        <LatencyLadder usePlayback={useMemoryHierarchyPlayback} />
        <div className="flex flex-col gap-4 lg:overflow-y-auto">
          <HumanScalePanel usePlayback={useMemoryHierarchyPlayback} />
          <LatencyGraph usePlayback={useMemoryHierarchyPlayback} />
        </div>
        <MemoryHierarchyInspector usePlayback={useMemoryHierarchyPlayback} />
      </div>

      <PlaybackControls usePlayback={useMemoryHierarchyPlayback} />
    </main>
  );
}
