"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { VirtualMemorySnapshot } from "@/simulation/virtual-memory/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function VirtualMemoryTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<VirtualMemorySnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Virtual Memory">
      <TheorySection heading="Why programs never see real addresses">
        <p>
          Every address a program uses is virtual — a private, program-facing number that has to
          be translated to an actual physical location before RAM can be touched. This gives
          every process its own address space (two programs can both think they own address 10)
          and lets the OS move physical memory around without the program ever knowing. The cost
          is that <strong className="text-foreground">every single memory access needs a
          translation first</strong>.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 1 — the expensive path" watchCycle={1} onWatch={jumpToCycle}>
        <p>
          Virtual address 10 splits into VPN 0 and offset 10. The TLB (translation lookaside
          buffer — a small cache of recent translations) is empty, so this misses. The only
          option is a <strong className="text-foreground">page table walk</strong>: a real
          memory access to look up VPN 0&apos;s physical frame, costing 30 cycles here — the
          same order of magnitude as a RAM access in Module 6, because that&apos;s literally what
          it is.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 5 — same page, different address, still a hit" watchCycle={5} onWatch={jumpToCycle}>
        <p>
          Virtual address 50 is a completely different number from address 10 — but it&apos;s
          still inside VPN 0. The TLB caches by <strong className="text-foreground">page</strong>,
          not by exact address, so this hits in 1 cycle. Watch the physical address change from
          1290 to 1330: the PFN stays 5 (same frame), only the offset changes — the offset bits
          pass straight through translation untouched.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 6 — the TLB is only 4 entries" watchCycle={6} onWatch={jumpToCycle}>
        <p>
          VPN 4 is a fifth distinct page, and the TLB only holds 4 translations. Exactly like
          Module 8&apos;s LRU cache lines, the least-recently-used entry — VPN 1, last touched at
          cycle 2 — gets evicted to make room. This isn&apos;t a data cache; it&apos;s the same
          LRU idea applied to translations instead of values.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 7 — paying for it immediately" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          VPN 1 is requested again right after being evicted — a TLB miss, another 30-cycle page
          table walk, even though this exact page was translated for free back at cycle 2. This
          is the real-world cost of a small TLB: programs that touch more distinct pages than the
          TLB can hold pay the translation cost over and over, a phenomenon called{" "}
          <strong className="text-foreground">TLB thrashing</strong>.
        </p>
      </TheorySection>

      <TheorySection heading="Why this matters beyond translation speed">
        <p>
          A TLB miss doesn&apos;t just cost cycles — it&apos;s exactly the kind of long, data-
          dependent stall that pipelines (Module 2), out-of-order execution, and prefetching all
          exist to hide. It&apos;s also why operating systems try to give each process large,
          contiguous chunks of memory (fewer distinct pages touched) and why huge pages exist:
          fewer, bigger pages mean fewer distinct VPNs, which means far less TLB pressure.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
