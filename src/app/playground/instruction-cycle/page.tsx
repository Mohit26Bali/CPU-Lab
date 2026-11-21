"use client";

import { useInstructionCyclePlayback, DEFAULT_PROGRAM } from "@/simulation/instruction-cycle/store";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { CpuInspector } from "@/components/inspector/cpu-inspector";
import { CodePanel } from "@/components/modules/instruction-cycle/code-panel";
import { CpuDiagram } from "@/components/modules/instruction-cycle/cpu-diagram";
import { CycleInfoPanel } from "@/components/modules/instruction-cycle/cycle-info-panel";
import { ModuleNav } from "@/components/shared/module-nav";
import { InstructionCycleTheory } from "@/components/modules/instruction-cycle/instruction-cycle-theory";

const programLines = DEFAULT_PROGRAM.split("\n");

export default function InstructionCyclePage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 1 — Instruction Cycle"
        rightSlot={<InstructionCycleTheory usePlayback={useInstructionCyclePlayback} />}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[280px_1fr_300px_320px]">
        <CodePanel usePlayback={useInstructionCyclePlayback} program={programLines} />
        <CpuDiagram usePlayback={useInstructionCyclePlayback} />
        <CycleInfoPanel usePlayback={useInstructionCyclePlayback} />
        <CpuInspector usePlayback={useInstructionCyclePlayback} />
      </div>

      <PlaybackControls usePlayback={useInstructionCyclePlayback} />
    </main>
  );
}
