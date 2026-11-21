"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { ArrowLeft, Hourglass } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ForwardingSnapshot } from "@/simulation/forwarding/engine";
import { REGISTER_NAMES } from "@/simulation/pipeline-hazards/isa";

export function ForwardingInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ForwardingSnapshot>>>;
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
          Forwarding Log
        </div>
        {current.forwardLog.length === 0 ? (
          <p className="text-xs text-foreground-muted">No forwards yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {current.forwardLog.map((f, i) => (
              <div key={i} className="glass-inset flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]">
                <ArrowLeft size={11} className="text-neon-purple" />
                <span className="font-mono text-neon-purple">{f.register}</span>
                <span className="truncate text-foreground-muted">from {f.producerRaw}</span>
                <span className="ml-auto text-foreground-muted">c{f.cycle}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Stall Log
        </div>
        {current.stallLog.length === 0 ? (
          <p className="text-xs text-foreground-muted">No stalls yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {current.stallLog.map((s, i) => (
              <div key={i} className="glass-inset flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]">
                <Hourglass size={11} className="text-neon-orange" />
                <span className="truncate font-mono text-foreground">{s.raw}</span>
                <span className="ml-auto text-foreground-muted">
                  {s.reason === "load-use" ? "load-use" : "no fwd"}
                </span>
              </div>
            ))}
          </div>
        )}
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
