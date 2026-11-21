"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ReplacementPolicy, ReplacementSnapshot } from "@/simulation/replacement-policy/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function ReplacementTheory({
  usePlayback,
  activePolicy,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ReplacementSnapshot>>>;
  activePolicy: ReplacementPolicy;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Replacement Policies">
      <TheorySection heading="The question only exists when there's a choice">
        <p>
          A 4-line fully associative cache, 8 requests: 0, 1, 2, 3, 0, 4, 1, 5. The first four
          requests just fill the cache — no decision to make. The interesting part starts at
          request 5, once the cache is full and something has to leave to make room for a new
          block. <strong className="text-foreground">Which</strong> line gets evicted is the
          entire subject of this module.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 5 — block 0 is touched again" watchCycle={5} onWatch={jumpToCycle}>
        <p>
          Block 0 is requested a second time — a hit for every policy. But watch what it does
          (or doesn&apos;t do) to each policy&apos;s bookkeeping: LRU updates block 0&apos;s
          &quot;last used&quot; timestamp, making it look fresh. FIFO doesn&apos;t care — block
          0&apos;s insertion time never changes no matter how often it&apos;s reused.
        </p>
      </TheorySection>

      {activePolicy === "fifo" && (
        <>
          <TheorySection heading="Cycle 6 — evicts by age, not usage" watchCycle={6} onWatch={jumpToCycle}>
            <p>
              Block 4 needs a line. FIFO looks only at insertion order: 0, 1, 2, 3 — block 0 was
              inserted first, so it&apos;s evicted, <em>despite</em> having just been reused a
              cycle ago. FIFO has no concept of recency at all.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 7 — it pays off this time" watchCycle={7} onWatch={jumpToCycle}>
            <p>
              Block 1 is requested again — and it&apos;s still here, because FIFO never touched
              it. <strong className="text-foreground">Hit.</strong> Simple insertion-order
              tracking, no per-access bookkeeping, and on this trace it does better than LRU.
            </p>
          </TheorySection>
        </>
      )}

      {activePolicy === "lru" && (
        <>
          <TheorySection heading="Cycle 6 — evicts by recency, not age" watchCycle={6} onWatch={jumpToCycle}>
            <p>
              Block 4 needs a line. LRU looks at last-used time: block 0 was just refreshed, so
              among 0, 1, 2, 3 it&apos;s block 1 that hasn&apos;t been touched the longest.
              LRU evicts block 1.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 7 — the exact case LRU is bad at" watchCycle={7} onWatch={jumpToCycle}>
            <p>
              Block 1 is requested again immediately — but LRU just evicted it.{" "}
              <strong className="text-foreground">Miss.</strong> This is LRU&apos;s real weakness:
              it&apos;s a heuristic based on the past, not a prediction of the future. Evicting
              &quot;least recently used&quot; is usually a good bet, but this trace was built to
              show the bet losing. Final score on this run: FIFO 2 hits, LRU only 1 — LRU is not
              universally better, just usually better on typical access patterns.
            </p>
          </TheorySection>
        </>
      )}

      {activePolicy === "random" && (
        <>
          <TheorySection heading="Cycle 6 — no bookkeeping at all" watchCycle={6} onWatch={jumpToCycle}>
            <p>
              Random doesn&apos;t track insertion order or recency — it just picks one of the 4
              occupied lines uniformly at random. No per-access updates, no per-line metadata:
              the cheapest possible policy to implement in hardware.
            </p>
          </TheorySection>
          <TheorySection heading="This run happened to land on FIFO's choice">
            <p>
              With this session&apos;s seed, Random evicted the same blocks FIFO did — pure
              coincidence, not a property of the algorithm. Run it with a different seed and
              you&apos;d get different evictions and a different hit rate. That unpredictability
              is Random&apos;s defining trait: no adversarial access pattern can reliably defeat
              it (unlike LRU&apos;s cycle above), but it also can&apos;t reliably exploit locality
              the way LRU usually does.
            </p>
          </TheorySection>
        </>
      )}

      <TheorySection heading="Why real hardware often approximates LRU rather than implementing it exactly">
        <p>
          True LRU needs to know the exact access-order rank of every line, which gets expensive
          to track precisely as associativity grows. Many real CPUs use cheaper approximations
          (clock/second-chance algorithms, or a handful of &quot;not recently used&quot; bits) that behave
          like LRU most of the time without the full bookkeeping cost — trading a small amount of
          hit-rate accuracy for much simpler hardware.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
