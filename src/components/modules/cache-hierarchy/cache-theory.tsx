"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheHierarchySnapshot } from "@/simulation/cache-hierarchy/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function CacheTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheHierarchySnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Cache Hierarchy">
      <TheorySection heading="Why a hierarchy at all">
        <p>
          RAM is huge but slow — this module charges it 40 cycles per access. A cache is small
          but fast: L1 costs 1 cycle, but only holds 4 blocks here. The hierarchy exists because
          you can&apos;t have both size and speed in one piece of hardware, so real CPUs stack
          several: a tiny fast L1, a bigger slower L2, a bigger-still L3, then RAM as the last
          resort. Every request checks the fastest level first and only falls through when it
          has to.
        </p>
      </TheorySection>

      <TheorySection heading="Requests 1–3 — the expensive first touch" watchCycle={1} onWatch={jumpToCycle}>
        <p>
          Blocks 0, 1, and 2 have never been accessed. Each one misses at L1, misses at L2,
          misses at L3, and finally hits RAM — paying for every level along the way:{" "}
          <span className="font-mono text-neon-orange">1 + 4 + 12 + 40 = 57 cycles</span>. On the
          way back, the block is installed into L3, L2, and L1 simultaneously, so it&apos;ll be
          fast <em>next</em> time.
        </p>
      </TheorySection>

      <TheorySection heading="Requests 4–5 — the payoff" watchCycle={4} onWatch={jumpToCycle}>
        <p>
          Blocks 0 and 1 are requested again. This time they&apos;re sitting right in L1 —{" "}
          <span className="font-mono text-neon-green">1 cycle</span> instead of 57. This is{" "}
          <strong className="text-foreground">temporal locality</strong>: data accessed recently
          is likely to be accessed again soon, and the cache exists specifically to exploit it.
        </p>
      </TheorySection>

      <TheorySection heading="Request 7 — L1 fills up and evicts" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          L1 only has 4 lines. By the time block 50 arrives, L1 already holds 0, 1, 2, and 25 —
          full. Something has to leave to make room. This engine uses{" "}
          <strong className="text-foreground">LRU (least recently used)</strong>: block 2 hasn&apos;t
          been touched since request 3, while 0, 1, and 25 have all been used more recently, so 2
          is evicted. (Module 8 covers LRU vs FIFO vs Random in depth — this is LRU in action.)
        </p>
      </TheorySection>

      <TheorySection heading="Request 10 — an L2 hit re-promotes a block" watchCycle={10} onWatch={jumpToCycle}>
        <p>
          Block 1 was evicted from L1 back at request 9 (to make room for block 75), but it was
          never evicted from L2 — L2 has 8 lines and only 6 distinct blocks have ever been
          touched. So this request misses L1 but{" "}
          <strong className="text-foreground">hits L2</strong>: only{" "}
          <span className="font-mono text-neon-blue">1 + 4 = 5 cycles</span> instead of 57. The
          block is then re-installed into L1, evicting block 25 (the new LRU victim). This is the
          entire point of a multi-level hierarchy — losing a level doesn&apos;t mean starting
          over from RAM.
        </p>
      </TheorySection>

      <TheorySection heading="What this module doesn't show yet">
        <p>
          This cache is fully associative — any block can live in any line, which is simple but
          expensive to build in real hardware. Module 7 covers how real caches narrow the search
          using direct mapping and set-associative mapping, and Module 8 compares LRU against
          FIFO and Random eviction under pressure.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
