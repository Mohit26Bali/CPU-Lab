"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { InstructionCycleSnapshot } from "@/simulation/instruction-cycle/engine";
import { ExplainThisCycle } from "@/components/ai/explain-this-cycle";

export function CycleInfoPanel({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<InstructionCycleSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);

  if (!current) return null;

  const previous = currentIndex > 0 ? history[currentIndex - 1] : null;

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Cycle Information
      </h3>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-foreground-muted">Current Cycle</span>
        <span className="font-mono text-lg text-neon-blue">{current.cycle}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-foreground-muted">Instruction</span>
        <span className="font-mono text-sm">{current.instruction?.raw ?? "—"}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-foreground-muted">Control Signals</span>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(current.controlSignals).length === 0 ? (
            <span className="text-xs text-foreground-muted">none</span>
          ) : (
            Object.keys(current.controlSignals).map((s) => (
              <span
                key={s}
                className="rounded-full bg-neon-blue/15 px-2 py-0.5 font-mono text-[10px] text-neon-blue"
              >
                {s}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-foreground-muted">Registers Changed</span>
        <div className="flex flex-wrap gap-1.5">
          {current.registersChanged.length === 0 ? (
            <span className="text-xs text-foreground-muted">none</span>
          ) : (
            current.registersChanged.map((r) => (
              <span
                key={r}
                className="glow-green rounded-full bg-neon-green/15 px-2 py-0.5 font-mono text-[10px] text-neon-green"
              >
                {r} = {current.registers[r]}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-foreground-muted">Explanation</span>
        <p className="text-sm leading-relaxed text-foreground-muted">{current.explanation}</p>
      </div>

      <div className="mt-auto border-t border-glass-border pt-4">
        <ExplainThisCycle
          request={{
            module: "Module 1 — Instruction Cycle",
            cycle: current.cycle,
            instruction: current.instruction?.raw ?? null,
            stage: current.stage,
            explanation: current.explanation,
            registersChanged: current.registersChanged,
            registers: current.registers,
            previousExplanation: previous?.explanation ?? null,
          }}
        />
      </div>
    </div>
  );
}
