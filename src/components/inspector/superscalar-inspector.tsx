"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { SuperscalarSnapshot } from "@/simulation/superscalar/engine";
import { REGISTER_NAMES } from "@/simulation/pipeline-hazards/isa";

export function SuperscalarInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SuperscalarSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);

  if (!current) return null;

  const recentEvents = history.slice(Math.max(0, currentIndex - 5), currentIndex + 1).reverse();

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Cycle {current.cycle}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Completed" value={String(current.instructionsCompleted)} />
        <Stat label="Issued This Cycle" value={`${current.issuedThisCycle}/2`} />
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

      <div className="flex-1">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Event Log
        </div>
        <ul className="flex flex-col gap-1.5 font-mono text-[10px] text-foreground-muted">
          {recentEvents.map((snap) => (
            <li key={snap.cycle} className={snap === current ? "text-foreground" : ""}>
              <span className="text-neon-purple">C{snap.cycle}:</span> {snap.explanation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-md px-2.5 py-2">
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
