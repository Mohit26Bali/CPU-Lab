"use client";

import type { CompareScenario } from "@/simulation/compare/scenarios";

export function CompareScenarioTabs({
  scenarios,
  active,
  onChange,
}: {
  scenarios: CompareScenario[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="glass flex flex-wrap items-center gap-2 p-3">
      {scenarios.map((s) => {
        const isActive = s.key === active;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
              isActive
                ? "glow-blue border-neon-blue/40 bg-neon-blue/10 text-neon-blue"
                : "border-glass-border bg-ink/[0.04] text-foreground-muted hover:border-neon-blue/20"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
