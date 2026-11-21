"use client";

import { useState } from "react";
import { useForwardingPlayback } from "@/simulation/forwarding/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { ForwardingStageStrip } from "@/components/modules/forwarding/forwarding-stage-strip";
import { ForwardingTimeline } from "@/components/modules/forwarding/forwarding-timeline";
import { ForwardingToggle } from "@/components/modules/forwarding/forwarding-toggle";
import { PerformanceComparison } from "@/components/modules/forwarding/performance-comparison";
import { ForwardingInspector } from "@/components/inspector/forwarding-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { ForwardingTheory } from "@/components/modules/forwarding/forwarding-theory";

export default function ForwardingPage() {
  const [enabled, setEnabled] = useState(false);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 4 — Forwarding"
        rightSlot={<ForwardingTheory usePlayback={useForwardingPlayback} />}
      />

      <ForwardingToggle usePlayback={useForwardingPlayback} enabled={enabled} onChange={setEnabled} />

      <ForwardingStageStrip usePlayback={useForwardingPlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_280px_280px]">
        <ForwardingTimeline usePlayback={useForwardingPlayback} />
        <PerformanceComparison />
        <ForwardingInspector usePlayback={useForwardingPlayback} />
      </div>

      <PlaybackControls usePlayback={useForwardingPlayback} />
    </main>
  );
}
