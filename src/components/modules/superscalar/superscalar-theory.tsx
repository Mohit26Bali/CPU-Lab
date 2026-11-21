"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { SuperscalarSnapshot } from "@/simulation/superscalar/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function SuperscalarTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SuperscalarSnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Superscalar Execution">
      <TheorySection heading="Width, not reordering">
        <p>
          Module 11&apos;s out-of-order machine fetched one instruction per cycle, but could
          execute them in whatever order their data allowed. This module does the opposite kind
          of scaling: it fetches, decodes, and executes{" "}
          <strong className="text-foreground">two instructions per cycle</strong>, but strictly
          in the original program order. That&apos;s what &quot;superscalar&quot; means —
          multiple execution units and a wide front end, not reordering.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 3 — the payoff" watchCycle={3} onWatch={jumpToCycle}>
        <p>
          &quot;MOV R1, #5&quot; and &quot;MOV R2, #10&quot; are completely independent, so both
          lanes issue to Execute in the very same cycle. This is the whole point of superscalar
          hardware: twice the throughput, for free, whenever the instruction stream allows it.
        </p>
      </TheorySection>

      <TheorySection
        heading="Cycle 4 — an independent instruction, stuck anyway"
        watchCycle={4}
        onWatch={jumpToCycle}
      >
        <p>
          &quot;ADD R3, R1, R2&quot; needs both registers the previous pair just computed, so it
          stalls in Decode — expected, same as Module 3. But watch{" "}
          <strong className="text-foreground">&quot;MOV R4, #1&quot;</strong> right behind it: it
          doesn&apos;t depend on anything, it could run immediately — but it&apos;s stuck in lane
          1 anyway, because this machine is strictly in-order and lane 1 can never get ahead of a
          stalled lane 0. This is the exact limitation Module 11&apos;s out-of-order execution
          was built to remove.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 6 — catching up together" watchCycle={6} onWatch={jumpToCycle}>
        <p>
          The moment the hazard clears, both ADD and MOV R4 issue together — full width again.
          The stall cost both lanes equally, even though only one of them actually needed to
          wait.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 7 — a different kind of limit" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          &quot;LOAD R5, [0]&quot; and &quot;LOAD R6, [4]&quot; have no data dependency on each
          other at all — decode has no objection. But this machine only has{" "}
          <strong className="text-foreground">one memory port</strong>. Two ALU ops can run
          together because there are two ALU lanes; two memory ops can&apos;t, because there&apos;s
          only one path to memory. Lane 1 waits — a purely structural stall, nothing to do with
          data.
        </p>
      </TheorySection>

      <TheorySection heading="The result: average IPC well under 2">
        <p>
          Across this run, only 2 of 10 active cycles hit full 2-wide issue — average IPC lands
          around 1.5, not 2.0. This is normal and realistic: real superscalar CPUs rarely sustain
          their peak issue width, because real programs are full of exactly these two
          limits — data dependencies between nearby instructions, and a finite number of
          execution ports for each kind of work. Utilization graphs like this one are how
          architects actually measure whether adding a third lane would even help.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
