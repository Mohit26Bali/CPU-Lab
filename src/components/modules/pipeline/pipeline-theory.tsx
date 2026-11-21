"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { PipelineSnapshot } from "@/simulation/pipeline/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function PipelineTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<PipelineSnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Pipelining">
      <TheorySection heading="Why pipeline at all?">
        <p>
          In Module 1, an instruction occupies the whole datapath for all 5 cycles before the
          next one is even fetched — so most of the hardware sits idle most of the time (the ALU
          is only busy during Execute). Pipelining runs the stages like an assembly line: while
          instruction 1 is in Decode, instruction 2 can already be in Fetch, using hardware that
          would otherwise be idle.
        </p>
        <p>
          This doesn&apos;t make any single instruction finish faster — a MOV still takes 5
          cycles start to finish. What improves is <strong className="text-foreground">throughput</strong>:
          how many instructions complete per cycle, once the pipeline is full.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 1 — filling the pipeline" watchCycle={1} onWatch={jumpToCycle}>
        <p>
          Only one instruction exists so far: &quot;MOV R1, #5&quot; enters Fetch. Every other
          stage is empty — there&apos;s nothing yet to Decode, Execute, access Memory for, or
          write back.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 2 — the second instruction enters" watchCycle={2} onWatch={jumpToCycle}>
        <p>
          &quot;MOV R1, #5&quot; moves into Decode. Critically, Fetch doesn&apos;t sit idle
          waiting for it — &quot;MOV R3, #10&quot; enters Fetch in the very same cycle. Two
          instructions, two different stages, at once.
        </p>
      </TheorySection>

      <TheorySection
        heading="Cycles 5–6 — steady state: all five stages busy"
        watchCycle={5}
        onWatch={jumpToCycle}
      >
        <p>
          By cycle 5, five different instructions occupy all five stages simultaneously:
          Writeback, Memory, Execute, Decode, and Fetch are all doing useful work in the same
          cycle. This is the pipeline running at full throughput — one instruction finishes
          every single cycle.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 7 — draining" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          This program only has 6 instructions, so once the last one (&quot;LOAD R5, [0]&quot;)
          is fetched at cycle 6, Fetch has nothing left to do. From here the pipeline drains from
          the front, one stage at a time, until the last instruction writes back.
        </p>
      </TheorySection>

      <TheorySection heading="The payoff">
        <p>
          Module 1 ran these same 6 instructions in <strong className="text-foreground">30
          cycles</strong> (5 each, no overlap). This pipeline runs them in{" "}
          <strong className="text-foreground">10 cycles</strong> — a 3x speedup from overlap
          alone, with the exact same hardware and the exact same instructions.
        </p>
      </TheorySection>

      <TheorySection heading="What this module doesn't model yet">
        <p>
          Look closely at instruction 3: &quot;ADD R2, R1, R3&quot; needs R1 and R3, which are
          still being written back by instructions 1 and 2 while instruction 3 is trying to
          Decode. In a real overlapping pipeline that&apos;s a{" "}
          <strong className="text-foreground">data hazard</strong> — this module doesn&apos;t
          stall or forward data for it yet. That&apos;s exactly what Module 3 (Hazards) and
          Module 4 (Forwarding) cover next.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
