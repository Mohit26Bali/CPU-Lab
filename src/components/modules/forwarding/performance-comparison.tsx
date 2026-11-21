"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";
import { ForwardingEngine } from "@/simulation/forwarding/engine";
import { FORWARDING_DEMO_PROGRAM, forwardingProgram } from "@/simulation/forwarding/store";
import { parseProgram } from "@/simulation/pipeline-hazards/isa";

function totalCycles(forwardingEnabled: boolean): number {
  const engine = new ForwardingEngine();
  engine.initialize(forwardingProgram(forwardingEnabled));
  let last = engine.tick();
  let guard = 0;
  while (!last.isFinal && guard < 500) {
    last = engine.tick();
    guard += 1;
  }
  return last.cycle;
}

export function PerformanceComparison() {
  const { without, withFwd, instructionCount } = useMemo(
    () => ({
      without: totalCycles(false),
      withFwd: totalCycles(true),
      instructionCount: parseProgram(FORWARDING_DEMO_PROGRAM).length,
    }),
    [],
  );

  const saved = without - withFwd;
  const pct = Math.round((saved / without) * 100);
  const maxBar = Math.max(without, withFwd);

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Performance Comparison
      </h3>
      <div className="flex flex-col gap-2.5">
        <Bar label="Without forwarding" cycles={without} max={maxBar} color="bg-neon-orange" />
        <Bar label="With forwarding" cycles={withFwd} max={maxBar} color="bg-neon-purple" />
      </div>
      <div className="glow-purple flex items-center gap-2 rounded-md bg-neon-purple/10 px-3 py-2 text-xs text-neon-purple">
        <Zap size={14} />
        {saved} fewer cycles ({pct}% faster) for the same {instructionCount} instructions.
      </div>
    </div>
  );
}

function Bar({ label, cycles, max, color }: { label: string; cycles: number; max: number; color: string }) {
  const widthPct = Math.max((cycles / max) * 100, 8);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px] text-foreground-muted">
        <span>{label}</span>
        <span className="font-mono text-foreground">{cycles} cycles</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink/6">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
