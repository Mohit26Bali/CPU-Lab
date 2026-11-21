"use client";

import { useState } from "react";
import { useReplacementPlayback } from "@/simulation/replacement-policy/store";
import type { ReplacementPolicy } from "@/simulation/replacement-policy/engine";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { CacheFillVisual } from "@/components/modules/replacement-policy/cache-fill-visual";
import { PolicyTabs } from "@/components/modules/replacement-policy/policy-tabs";
import { PolicyComparison } from "@/components/modules/replacement-policy/policy-comparison";
import { ReplacementInspector } from "@/components/inspector/replacement-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { ReplacementTheory } from "@/components/modules/replacement-policy/replacement-theory";

export default function ReplacementPolicyPage() {
  const [policy, setPolicy] = useState<ReplacementPolicy>("fifo");

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 8 — Replacement Policies"
        rightSlot={<ReplacementTheory usePlayback={useReplacementPlayback} activePolicy={policy} />}
      />

      <PolicyTabs usePlayback={useReplacementPlayback} active={policy} onChange={setPolicy} />

      <CacheFillVisual usePlayback={useReplacementPlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_280px]">
        <PolicyComparison active={policy} />
        <ReplacementInspector usePlayback={useReplacementPlayback} />
      </div>

      <PlaybackControls usePlayback={useReplacementPlayback} />
    </main>
  );
}
