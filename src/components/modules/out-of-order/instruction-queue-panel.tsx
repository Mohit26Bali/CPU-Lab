"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { OutOfOrderSnapshot } from "@/simulation/out-of-order/engine";
import { InstructionChip } from "./instruction-chip";

export function InstructionQueuePanel({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<OutOfOrderSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  return (
    <div className="glass flex h-full flex-col gap-2 overflow-y-auto p-3">
      <h3 className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
        Instruction Queue
      </h3>
      <div className="flex flex-col gap-1.5">
        {current.instructionQueue.length === 0 ? (
          <span className="text-[10px] text-foreground-muted">empty</span>
        ) : (
          current.instructionQueue.map((instr) => (
            <div key={instr.instrIndex} className="flex">
              <InstructionChip raw={instr.raw} index={instr.instrIndex} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
