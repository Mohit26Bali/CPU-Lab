"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheMappingSnapshot, MappingScheme } from "@/simulation/cache-mapping/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function CacheMappingTheory({
  usePlayback,
  activeScheme,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheMappingSnapshot>>>;
  activeScheme: MappingScheme;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Cache Mapping">
      <TheorySection heading="Same 8 lines, three different rules">
        <p>
          Every scheme here gets the exact same budget — 8 total cache lines — and the exact
          same trace: address 0, then 32, alternating 8 times. The only thing that changes is the{" "}
          <strong className="text-foreground">rule for which line(s) a block is allowed to
          live in</strong>. That single rule turns out to matter enormously.
        </p>
        <p>
          Address 0 and address 32 are exactly 32 bytes apart — with a 4-byte block size and 8
          lines, that&apos;s precisely one full trip around the cache. It&apos;s not a
          coincidence; it&apos;s chosen to expose exactly how each scheme handles two blocks that
          collide.
        </p>
      </TheorySection>

      {activeScheme === "direct" && (
        <>
          <TheorySection heading="Cycle 1–2 — first touches" watchCycle={1} onWatch={jumpToCycle}>
            <p>
              Address 0 → block 0 → index 0 (miss, installs). Address 32 → block 8 → index{" "}
              <span className="font-mono text-neon-orange">8 mod 8 = 0</span> — the{" "}
              <em>same index</em>. Direct mapping gives block 8 no choice: it must evict whatever
              sits at index 0, even though indices 1 through 7 are completely empty.
            </p>
          </TheorySection>
          <TheorySection heading="Every cycle after — pure thrashing" watchCycle={3} onWatch={jumpToCycle}>
            <p>
              Block 0 and block 8 now fight over the one line they&apos;re both forced to use,
              evicting each other every single access. Final result:{" "}
              <span className="font-mono text-neon-red">8 misses out of 8</span>, 160 cycles —
              despite the cache having 7x more room than these two blocks actually need. This is
              a <strong className="text-foreground">conflict miss</strong>: not a capacity
              problem, a mapping-rule problem.
            </p>
          </TheorySection>
        </>
      )}

      {activeScheme === "set-associative" && (
        <>
          <TheorySection heading="Cycle 1–2 — both blocks land in the same set" watchCycle={1} onWatch={jumpToCycle}>
            <p>
              With 4 sets of 2 ways, block 0 and block 8 both map to set 0 — same as direct
              mapping&apos;s conflict. The difference: set 0 has{" "}
              <strong className="text-foreground">two</strong> lines, not one. Both blocks fit at
              once, one per way.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 3 onward — no more conflict" watchCycle={3} onWatch={jumpToCycle}>
            <p>
              Every access after the first two is a hit — 6 hits out of 8, 46 cycles. The same
              collision that caused direct mapping to thrash 100% of the time costs this scheme
              nothing beyond the two unavoidable first-touch misses.
            </p>
          </TheorySection>
        </>
      )}

      {activeScheme === "full" && (
        <>
          <TheorySection heading="Cycle 1–2 — no index at all" watchCycle={1} onWatch={jumpToCycle}>
            <p>
              Full associativity has zero index bits — every one of the 8 lines is a candidate
              for every block. Blocks 0 and 8 don&apos;t collide because nothing is forced to
              share a line; the cache just needs to search all 8 tags to know if it has a block.
            </p>
          </TheorySection>
          <TheorySection heading="Same result as set-associative, more searching" watchCycle={3} onWatch={jumpToCycle}>
            <p>
              6 hits out of 8, 46 cycles — identical to the 2-way result on this trace, because
              only 2 distinct blocks are ever touched and 8 lines is more than enough either way.
              The real-world cost of full associativity isn&apos;t shown by this trace: comparing
              a tag against all 8 lines simultaneously needs more comparator hardware than
              checking just 1 (direct) or 2 (set-associative) — which is exactly why real CPUs
              use set-associative caches almost everywhere.
            </p>
          </TheorySection>
        </>
      )}

      <TheorySection heading="Why set-associative wins in practice">
        <p>
          Direct mapping is cheap hardware but fragile — any two frequently-used addresses that
          happen to be a multiple of the cache size apart will thrash, no matter how much unused
          space exists elsewhere. Full associativity never thrashes but needs expensive
          all-lines-at-once comparison hardware. Set-associative — 2-way, 4-way, 8-way — is the
          compromise nearly every real cache actually ships: enough flexibility to absorb most
          conflicts, without needing to search the entire cache on every access.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
