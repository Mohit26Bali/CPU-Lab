"use client";

import { useVirtualMemoryPlayback } from "@/simulation/virtual-memory/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { AddressTranslationDiagram } from "@/components/modules/virtual-memory/address-translation-diagram";
import { TlbGrid } from "@/components/modules/virtual-memory/tlb-grid";
import { VirtualMemoryInspector } from "@/components/inspector/virtual-memory-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { VirtualMemoryTheory } from "@/components/modules/virtual-memory/virtual-memory-theory";

export default function VirtualMemoryPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 10 — Virtual Memory"
        rightSlot={<VirtualMemoryTheory usePlayback={useVirtualMemoryPlayback} />}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[340px_1fr_300px]">
        <AddressTranslationDiagram usePlayback={useVirtualMemoryPlayback} />
        <TlbGrid usePlayback={useVirtualMemoryPlayback} />
        <VirtualMemoryInspector usePlayback={useVirtualMemoryPlayback} />
      </div>

      <PlaybackControls usePlayback={useVirtualMemoryPlayback} />
    </main>
  );
}
