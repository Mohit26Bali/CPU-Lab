"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { MemoryHierarchySnapshot } from "@/simulation/memory-hierarchy/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function MemoryHierarchyTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<MemoryHierarchySnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — The Full Memory Hierarchy">
      <TheorySection heading="Why the whole thing exists">
        <p>
          Modules 6-8 covered how a cache decides hit vs. miss. This module zooms all the way
          out: every tier a piece of data could live in, from a register inside the ALU to a spinning
          disk platter, and how differently far away each one is. The numbers here are the
          well-known reference latencies popularized as &quot;latency numbers every programmer
          should know&quot; — real order-of-magnitude approximations, not a benchmark of any one
          machine.
        </p>
      </TheorySection>

      <TheorySection heading="On-chip jumps are small" watchCycle={2} onWatch={jumpToCycle}>
        <p>
          Register → L1 → L2 → L3 → RAM: each step is roughly{" "}
          <strong className="text-foreground">3-7x</strong> slower than the last. Noticeable, but
          all in the same ballpark — nanoseconds throughout. This is why a CPU stalling on an L3
          miss that hits RAM is a routine, survivable event, handled by the pipeline stalling or
          finding other work.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 6 — RAM to SSD is not a small jump" watchCycle={6} onWatch={jumpToCycle}>
        <p>
          SSD access is roughly <strong className="text-foreground">160x</strong> slower than
          RAM — the first jump that changes units, from nanoseconds to microseconds. This is the
          line between &quot;the CPU waits&quot; and &quot;the operating system schedules
          something else while it waits,&quot; which is exactly why page faults (Module 10) are
          such an expensive event.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 7 — disk is a different world" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          A disk seek is roughly <strong className="text-foreground">625x</strong> slower than
          an SSD access, and about{" "}
          <strong className="text-foreground">33 million times</strong> slower than a register
          read. At the &quot;L1 = 1 second&quot; scale this module computes live, that&apos;s the
          difference between blinking and waiting nearly four months. No amount of clever
          pipelining fixes a wait that long — the only real answer is to avoid needing the disk
          at all, which is the entire reason caching, prefetching, and virtual memory exist.
        </p>
      </TheorySection>

      <TheorySection heading="Why this shapes real system design">
        <p>
          Every technique in this app — caching (6-8), branch prediction (5), out-of-order
          execution, virtual memory (10) — exists because of the gaps on this ladder. A CPU that
          did nothing but wait for RAM on every access would be idle almost all the time; the
          entire discipline of computer architecture is largely about hiding or avoiding these
          gaps.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
