"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { Hourglass, Lock, X, Check, Clock } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { HazardSnapshot, HazardType } from "@/simulation/pipeline-hazards/engine";

const TYPE_META: Record<HazardType, { label: string; icon: typeof Hourglass; classes: string }> = {
  data: { label: "Data", icon: Hourglass, classes: "border-neon-orange/40 bg-neon-orange/10 text-neon-orange" },
  structural: { label: "Structural", icon: Lock, classes: "border-neon-orange/40 bg-neon-orange/10 text-neon-orange" },
  control: { label: "Control", icon: X, classes: "border-neon-red/40 bg-neon-red/10 text-neon-red" },
};

export function Scoreboard({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<HazardSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);
  const log = current?.hazardLog ?? [];

  const totalCyclesLost = log.reduce((sum, h) => sum + h.cyclesLost, 0);

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Scoreboard
        </h3>
        <span className="font-mono text-[11px] text-foreground-muted">
          {totalCyclesLost} cycle{totalCyclesLost === 1 ? "" : "s"} lost so far
        </span>
      </div>
      {log.length === 0 ? (
        <p className="text-xs text-foreground-muted">No hazards yet — keep playing.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {log.map((h, i) => {
            const meta = TYPE_META[h.type];
            const Icon = meta.icon;
            return (
              <button
                key={i}
                onClick={() => jumpToCycle(h.cycle)}
                className="glass-inset flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition hover:border-neon-blue/30"
              >
                <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] ${meta.classes}`}>
                  <Icon size={10} />
                  {meta.label}
                </span>
                <span className="flex-1 truncate font-mono text-[11px] text-foreground">{h.raw}</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-foreground-muted">
                  <Clock size={10} />
                  {h.cyclesLost}
                </span>
                {h.resolved ? (
                  <Check size={12} className="text-neon-green" />
                ) : (
                  <Hourglass size={12} className="text-neon-orange" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
