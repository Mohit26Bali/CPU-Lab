"use client";

import { useState } from "react";
import { getCompareScenarios } from "@/simulation/compare/scenarios";
import { CompareNav } from "@/components/compare/compare-nav";
import { CompareScenarioTabs } from "@/components/compare/compare-scenario-tabs";
import { CompareRunner } from "@/components/compare/compare-runner";

const SCENARIOS = getCompareScenarios();

export default function ComparePage() {
  const [activeKey, setActiveKey] = useState(SCENARIOS[0].key);
  const active = SCENARIOS.find((s) => s.key === activeKey) ?? SCENARIOS[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 p-4">
      <CompareNav />

      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Same program, two configurations, running side by side.</h2>
        <p className="text-sm text-foreground-muted">
          Every number below comes from the exact same simulation engines used in the numbered
          modules — this just runs two of them at once so the difference is something you watch
          happen, not a number in a caption.
        </p>
      </div>

      <CompareScenarioTabs scenarios={SCENARIOS} active={activeKey} onChange={setActiveKey} />
      <CompareRunner key={active.key} scenario={active} />
    </main>
  );
}
