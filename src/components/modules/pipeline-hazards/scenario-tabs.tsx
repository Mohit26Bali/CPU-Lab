"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { HazardSnapshot } from "@/simulation/pipeline-hazards/engine";
import { SCENARIOS, scenarioProgram, type ScenarioKey } from "@/simulation/pipeline-hazards/store";

export function ScenarioTabs({
  usePlayback,
  active,
  onChange,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<HazardSnapshot>>>;
  active: ScenarioKey;
  onChange: (key: ScenarioKey) => void;
}) {
  const loadProgram = usePlayback((s) => s.loadProgram);

  return (
    <div className="glass flex flex-wrap items-center gap-2 p-3">
      {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
        const scenario = SCENARIOS[key];
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => {
              onChange(key);
              loadProgram(scenarioProgram(key));
            }}
            className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
              isActive
                ? "glow-blue border-neon-blue/40 bg-neon-blue/10"
                : "border-glass-border bg-ink/[0.04] hover:border-neon-blue/20"
            }`}
          >
            <span className={`text-xs font-medium ${isActive ? "text-neon-blue" : "text-foreground"}`}>
              {scenario.label}
            </span>
            <span className="text-[10px] text-foreground-muted">{scenario.description}</span>
          </button>
        );
      })}
    </div>
  );
}
