"use client";

import { useCacheHierarchyPlayback } from "@/simulation/cache-hierarchy/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { CacheDiagram } from "@/components/modules/cache-hierarchy/cache-diagram";
import { RequestTimeline } from "@/components/modules/cache-hierarchy/request-timeline";
import { CacheInspector } from "@/components/inspector/cache-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { CacheTheory } from "@/components/modules/cache-hierarchy/cache-theory";

export default function CacheHierarchyPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 6 — Cache Hierarchy"
        rightSlot={<CacheTheory usePlayback={useCacheHierarchyPlayback} />}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[320px_1fr_320px]">
        <CacheDiagram usePlayback={useCacheHierarchyPlayback} />
        <RequestTimeline usePlayback={useCacheHierarchyPlayback} />
        <CacheInspector usePlayback={useCacheHierarchyPlayback} />
      </div>

      <PlaybackControls usePlayback={useCacheHierarchyPlayback} />
    </main>
  );
}
