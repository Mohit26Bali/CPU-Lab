"use client";

import { useState } from "react";
import { useSimdPlayback } from "@/simulation/simd/store";
import type { LaneWidth } from "@/simulation/simd/engine";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { ScalarVsSimdVisual } from "@/components/modules/simd/scalar-vs-simd-visual";
import { WidthTabs } from "@/components/modules/simd/width-tabs";
import { SimdInspector } from "@/components/inspector/simd-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { SimdTheory } from "@/components/modules/simd/simd-theory";

export default function SimdPage() {
  const [width, setWidth] = useState<LaneWidth>(4);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 13 — SIMD"
        rightSlot={<SimdTheory usePlayback={useSimdPlayback} activeWidth={width} />}
      />

      <WidthTabs usePlayback={useSimdPlayback} active={width} onChange={setWidth} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_300px]">
        <ScalarVsSimdVisual usePlayback={useSimdPlayback} />
        <SimdInspector usePlayback={useSimdPlayback} />
      </div>

      <PlaybackControls usePlayback={useSimdPlayback} />
    </main>
  );
}
