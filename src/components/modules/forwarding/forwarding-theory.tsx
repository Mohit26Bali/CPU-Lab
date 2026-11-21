"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ForwardingSnapshot } from "@/simulation/forwarding/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function ForwardingTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ForwardingSnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Forwarding">
      <TheorySection heading="The idea">
        <p>
          Module 3&apos;s pipeline had no choice but to stall on a data hazard: it waited until
          the producer&apos;s Write Back had actually updated the register file. But the
          producer&apos;s result usually exists <em>earlier</em> than that — an ALU result is
          ready the moment Execute finishes, sitting in the EX/MEM latch a full stage before
          Write Back would place it in the register file.
        </p>
        <p>
          Forwarding adds a wire that reads the value straight out of that latch and feeds it to
          whatever needs it, bypassing the register file entirely. Same instructions, same
          program, far fewer stalls.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 3 — a hazard that costs zero cycles" watchCycle={3} onWatch={jumpToCycle}>
        <p>
          &quot;ADD R2, R1, R1&quot; needs R1 the instant &quot;MOV R1, #5&quot; is still sitting
          in Execute, one stage ahead. With forwarding on, the EX/MEM latch already holds 5 — it
          gets routed straight into ADD&apos;s Decode this same cycle. No stall at all, compare
          this to Module 3 where the identical dependency cost 2 full cycles.
        </p>
      </TheorySection>

      <TheorySection
        heading="Cycle 6 — the one hazard forwarding can't fix"
        watchCycle={6}
        onWatch={jumpToCycle}
      >
        <p>
          &quot;ADD R5, R4, R1&quot; needs R4 from &quot;LOAD R4, [0]&quot;, which is one stage
          ahead — normally a same-cycle forward. But a LOAD&apos;s data doesn&apos;t exist until
          its <em>own</em> Memory stage actually reads it; at this point the load is only in
          Execute, computing an address. There is nothing yet to forward. This is the classic{" "}
          <strong className="text-foreground">load-use hazard</strong> — even a fully forwarded
          pipeline stalls here for exactly one cycle.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 7 — now it can forward" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          One cycle later, the LOAD has completed Memory and its result sits in the MEM/WB latch.
          Now the forward succeeds and ADD proceeds. Total cost: 1 cycle, instead of the 2 cycles
          it would have cost with no forwarding at all.
        </p>
      </TheorySection>

      <TheorySection heading="Why this matters">
        <p>
          Toggle the switch above between &quot;Without Forwarding&quot; and &quot;With
          Forwarding&quot; and watch the same program run in 16 cycles versus 11 — a 31% speedup
          from wiring alone, no change to the instructions themselves. This is also why compilers
          try to reorder independent instructions between a load and its use: even with
          forwarding, that one hazard is unavoidable in hardware, but software can often hide it.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
