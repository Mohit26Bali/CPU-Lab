"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { BranchPredictionSnapshot } from "@/simulation/branch-prediction/engine";
import type { PredictorKind } from "@/simulation/branch-prediction/predictors";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function BranchTheory({
  usePlayback,
  activePredictor,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<BranchPredictionSnapshot>>>;
  activePredictor: PredictorKind;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Branch Prediction">
      <TheorySection heading="The program is a real loop">
        <p>
          This module&apos;s program isn&apos;t a straight line — R1 counts down from 3, and{" "}
          <code className="text-neon-orange">BEQ R0, R0, #-4</code> jumps{" "}
          <em>backward</em> to re-run the loop body. There are two branches: one checks
          &quot;is the loop done?&quot; (taken only on the 3rd pass), the other unconditionally
          jumps back to the top (taken every pass it&apos;s reached). Because the loop actually
          runs three times, a predictor gets to make the same guess more than once — which is
          the only way an <em>adaptive</em> predictor can prove it learned anything.
        </p>
      </TheorySection>

      <TheorySection heading="Why guessing matters at all">
        <p>
          A branch&apos;s outcome isn&apos;t known until Execute — two stages after Fetch. Module
          3 dealt with this by always assuming not-taken and eating a flush when wrong. A
          predictor lets Fetch guess a specific direction <em>per branch</em>, so a correct guess
          costs zero cycles instead of assuming the same thing every time.
        </p>
      </TheorySection>

      {activePredictor === "always-not-taken" && (
        <>
          <TheorySection heading="Cycle 11 — a free correct guess" watchCycle={11} onWatch={jumpToCycle}>
            <p>
              The loop-check branch is genuinely not taken on its first evaluation (R1 is still
              2, not 0) — &quot;always not-taken&quot; happens to be right here, for free.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 12 — and immediately wrong" watchCycle={12} onWatch={jumpToCycle}>
            <p>
              The very next branch, the unconditional jump back to the loop top, is <em>always</em>{" "}
              taken. A static not-taken predictor gets this wrong every single time it&apos;s
              evaluated — there&apos;s no way for it to do better, it never adapts.
            </p>
          </TheorySection>
          <TheorySection heading="30 cycles total — the worst of the four">
            <p>
              This predictor mispredicts the loop-back branch on every pass. Compare it against
              1-bit or 2-bit, which learn that branch is always taken after the first miss.
            </p>
          </TheorySection>
        </>
      )}

      {activePredictor === "always-taken" && (
        <>
          <TheorySection heading="Cycle 11 — wrong on the loop check" watchCycle={11} onWatch={jumpToCycle}>
            <p>
              &quot;Always taken&quot; guesses the loop-check branch exits immediately — wrong,
              since the loop hasn&apos;t finished. It gets the loop-back branch right for free
              right after, since that one really is always taken.
            </p>
          </TheorySection>
          <TheorySection heading="29 cycles, 60% accuracy">
            <p>
              Better than always-not-taken here only because this particular loop happens to
              contain a branch that really is always taken. Neither static predictor is actually
              reading the program — they just got lucky or unlucky with which branch dominates.
            </p>
          </TheorySection>
        </>
      )}

      {(activePredictor === "one-bit" || activePredictor === "two-bit") && (
        <>
          <TheorySection heading="Cycle 12 — the only real surprise" watchCycle={12} onWatch={jumpToCycle}>
            <p>
              Starting cold, this predictor also misses the loop-back branch the first time (no
              history yet). But it immediately updates.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 19 — it learned" watchCycle={19} onWatch={jumpToCycle}>
            <p>
              Second time around, the same branch is predicted <strong className="text-foreground">taken</strong>{" "}
              — and it&apos;s right. Check the CPU Inspector&apos;s Predictor State panel:{" "}
              {activePredictor === "one-bit" ? '"last: taken"' : '"strongly taken"'} for this branch
              site now.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 24 — the one miss adaptation can't avoid" watchCycle={24} onWatch={jumpToCycle}>
            <p>
              The loop-check branch has been not-taken twice, so the predictor confidently
              expects not-taken again — but the third time, the loop actually exits. This is the{" "}
              <strong className="text-foreground">loop-exit misprediction</strong>: unavoidable
              for any predictor whose only evidence is what happened last time, because the
              exit genuinely looks identical to a normal iteration right up until it isn&apos;t.
            </p>
          </TheorySection>
          <TheorySection heading="29 cycles, 80% accuracy">
            <p>
              {activePredictor === "one-bit"
                ? "A single bit of memory per branch was enough to fix the loop-back branch entirely."
                : "The 2-bit counter reaches the same result here, but its extra state means a single unusual iteration wouldn't immediately flip its guess — it takes two misses in a row to change its mind, which matters more on noisier, longer-running loops than this one."}
            </p>
          </TheorySection>
        </>
      )}

      <TheorySection heading="Try the other predictors">
        <p>
          Switch tabs above — same program, same 29-or-30 cycle range, but the mix of hits and
          misses (and which cycles turn red) is different for each. That difference is the whole
          reason real CPUs ship branch predictors instead of a fixed guess.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
