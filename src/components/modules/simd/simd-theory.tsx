"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { LaneWidth, SimdSnapshot } from "@/simulation/simd/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

const FINISH_CYCLE: Record<LaneWidth, number> = { 4: 4, 8: 2, 16: 1 };

export function SimdTheory({
  usePlayback,
  activeWidth,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<SimdSnapshot>>>;
  activeWidth: LaneWidth;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — SIMD">
      <TheorySection heading="One instruction, many lanes">
        <p>
          Every module so far has been <strong className="text-foreground">SISD</strong> —
          single instruction, single data: one ADD produces one result. SIMD (single
          instruction, multiple data) does the opposite: one instruction like{" "}
          <code className="text-neon-orange">ADDPS</code> carries an operation across several
          data lanes at once, in true lockstep — same operation, same cycle, every lane. This
          only works when you&apos;re doing the <em>same</em> thing to many independent pieces of
          data, which is exactly what graphics, audio, and numerical code spend most of their
          time doing.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 1 — the first instruction already diverges" watchCycle={1} onWatch={jumpToCycle}>
        <p>
          Scalar issues one ADD and finishes element 0. SIMD issues one ADDPS and finishes{" "}
          {activeWidth} elements in that same single cycle. Nothing about the hardware&apos;s
          clock changed — the instruction itself just describes more work per issue.
        </p>
      </TheorySection>

      <TheorySection
        heading={`Cycle ${FINISH_CYCLE[activeWidth]} — SIMD is already done`}
        watchCycle={FINISH_CYCLE[activeWidth]}
        onWatch={jumpToCycle}
      >
        <p>
          All 16 elements are finished using only{" "}
          <strong className="text-foreground">{16 / activeWidth}</strong> ADDPS instruction
          {16 / activeWidth === 1 ? "" : "s"}, while scalar has only completed{" "}
          {FINISH_CYCLE[activeWidth]} of its 16 required instructions. From here, SIMD just sits
          idle — there&apos;s no more work in this task for it to do — while scalar keeps
          grinding through the remaining elements one at a time.
        </p>
      </TheorySection>

      <TheorySection heading="Why wider isn't automatically better">
        <p>
          Try switching to 4-wide: it still beats scalar 4x, but not 16x. A SIMD unit is only as
          useful as the amount of parallel, same-operation work available — 16 lanes processing a
          4-element array wastes 12 of them every cycle. Real CPUs offer multiple widths (SSE at
          4-wide single-precision, AVX at 8-wide, AVX-512 at 16-wide) precisely because the right
          choice depends on the data, not just &quot;wider is always better.&quot;
        </p>
      </TheorySection>

      <TheorySection heading="The catch SIMD doesn't remove">
        <p>
          This speedup only exists because every lane does the <em>exact same operation</em>. The
          moment a task needs different lanes to take different branches — an `if` that goes
          differently per element — SIMD hardware has to either execute both paths for every lane
          (masking off the ones that don&apos;t apply) or give up the parallelism entirely. That
          tradeoff is why not all code benefits from vectorization, no matter how wide the
          hardware gets.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
