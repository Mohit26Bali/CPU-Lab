"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { HazardSnapshot } from "@/simulation/pipeline-hazards/engine";
import { REGISTER_NAMES } from "@/simulation/pipeline-hazards/isa";

export function HazardInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<HazardSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);

  if (!current) return null;

  const ipc =
    current.cycle > 0 ? (current.instructionsCompleted / current.cycle).toFixed(2) : "0.00";

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Cycle {current.cycle}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="In Flight" value={String(current.instructionsInFlight)} />
        <Stat label="Completed" value={String(current.instructionsCompleted)} />
        <Stat label="IPC" value={ipc} />
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
          Memory (changed cells highlighted)
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {current.memory.map((value, addr) => {
            const changed = current.memoryChanged.includes(addr);
            return (
              <div
                key={`${addr}-${current.cycle}-${changed}`}
                className={`glass-inset flex flex-col items-center rounded-md px-1 py-1 ${
                  changed ? "flash-register glow-orange" : ""
                }`}
              >
                <span className="text-[9px] text-foreground-muted">{addr}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          What&apos;s happening this cycle
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-foreground-muted">
          {current.explanation}
        </p>
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
