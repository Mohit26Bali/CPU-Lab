"use client";

import { useOutOfOrderPlayback } from "@/simulation/out-of-order/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { InstructionQueuePanel } from "@/components/modules/out-of-order/instruction-queue-panel";
import { ReservationStationsPanel } from "@/components/modules/out-of-order/reservation-stations-panel";
import { ExecutionUnitsPanel } from "@/components/modules/out-of-order/execution-units-panel";
import { ReorderBufferPanel } from "@/components/modules/out-of-order/reorder-buffer-panel";
import { OutOfOrderInspector } from "@/components/inspector/out-of-order-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { OutOfOrderTheory } from "@/components/modules/out-of-order/out-of-order-theory";

export default function OutOfOrderPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 11 — Out-of-Order Execution"
        rightSlot={<OutOfOrderTheory usePlayback={useOutOfOrderPlayback} />}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[180px_220px_220px_1fr_260px]">
        <InstructionQueuePanel usePlayback={useOutOfOrderPlayback} />
        <ReservationStationsPanel usePlayback={useOutOfOrderPlayback} />
        <ExecutionUnitsPanel usePlayback={useOutOfOrderPlayback} />
        <ReorderBufferPanel usePlayback={useOutOfOrderPlayback} />
        <OutOfOrderInspector usePlayback={useOutOfOrderPlayback} />
      </div>

      <PlaybackControls usePlayback={useOutOfOrderPlayback} />
    </main>
  );
}
