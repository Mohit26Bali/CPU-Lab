"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import { Database, Binary, Sigma, MemoryStick, CheckCircle2 } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { PipelineSnapshot } from "@/simulation/pipeline/engine";
import type { Stage } from "@/types/simulation";
import { chipColor } from "@/lib/chip-colors";

const STAGE_META: { stage: Stage; icon: LucideIcon }[] = [
  { stage: "FETCH", icon: Database },
  { stage: "DECODE", icon: Binary },
  { stage: "EXECUTE", icon: Sigma },
  { stage: "MEMORY", icon: MemoryStick },
  { stage: "WRITEBACK", icon: CheckCircle2 },
];

export function PipelineInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<PipelineSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);

  if (!current) return null;

  const ipc =
    current.cycle > 0 ? (current.instructionsCompleted / current.cycle).toFixed(2) : "0.00";
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
        <Stat label="In Flight" value={String(current.instructionsInFlight)} />
        <Stat label="Completed" value={String(current.instructionsCompleted)} />
        <Stat label="Total" value={String(current.instructions.length)} />
        <Stat label="IPC" value={ipc} />
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Stage Occupancy
        </div>
        <div className="flex flex-col gap-1.5">
          {STAGE_META.map(({ stage, icon: Icon }) => {
            const slot = current.occupancy[stage];
            const color = slot ? chipColor(slot.instructionIndex) : null;
            return (
              <div key={stage} className="glass-inset flex items-center gap-2 rounded-md px-2.5 py-1.5">
                <Icon size={13} className="text-foreground-muted" />
                <span className="w-16 text-[10px] text-foreground-muted">{stage}</span>
                {slot ? (
                  <span
                    className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[10px] ${color!.chip}`}
                  >
                    {slot.raw}
                  </span>
                ) : (
                  <span className="ml-auto text-[10px] text-foreground-muted">empty</span>
                )}
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
          {recentEvents.map((snap, i) => (
            <li key={snap.cycle} className={i === 0 ? "text-foreground" : ""}>
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
