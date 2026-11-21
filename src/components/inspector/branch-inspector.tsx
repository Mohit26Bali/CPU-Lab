"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { Check, X } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { BranchPredictionSnapshot } from "@/simulation/branch-prediction/engine";
import { REGISTER_NAMES } from "@/simulation/pipeline-hazards/isa";

export function BranchInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<BranchPredictionSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);

  if (!current) return null;

  const correct = current.predictionLog.filter((p) => p.correct).length;
  const total = current.predictionLog.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Cycle {current.cycle}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Predictions" value={String(total)} />
        <Stat label="Correct" value={String(correct)} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Register File
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {REGISTER_NAMES.map((reg) => {
            const changed = current.registersChanged.includes(reg);
            return (
              <div
                key={`${reg}-${current.cycle}-${changed}`}
                className={`glass-inset flex flex-col items-center rounded-md px-1.5 py-1.5 ${
                  changed ? "flash-register glow-green" : ""
                }`}
              >
                <span className="text-[10px] text-foreground-muted">{reg}</span>
                <span className="font-mono text-sm">{current.registers[reg]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Predictor State
        </div>
        <div className="flex flex-col gap-1.5">
          {current.predictorStates.length === 0 ? (
            <p className="text-xs text-foreground-muted">No branches seen yet.</p>
          ) : (
            current.predictorStates.map((p) => (
              <div key={p.instructionIndex} className="glass-inset rounded-md px-2 py-1.5">
                <div className="font-mono text-[10px] text-foreground">{p.raw}</div>
                <div className="text-[10px] text-neon-purple">{p.state}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Prediction Log
        </div>
        <div className="flex flex-col gap-1.5">
          {current.predictionLog.map((p, i) => (
            <div key={i} className="glass-inset flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]">
              {p.correct ? (
                <Check size={11} className="text-neon-green" />
              ) : (
                <X size={11} className="text-neon-red" />
              )}
              <span className="truncate font-mono text-foreground-muted">c{p.cycle}</span>
              <span className="ml-auto text-foreground-muted">
                {p.predicted ? "T" : "NT"} → {p.actual ? "T" : "NT"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-md px-2 py-2">
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
