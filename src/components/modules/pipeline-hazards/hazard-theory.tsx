"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { HazardSnapshot } from "@/simulation/pipeline-hazards/engine";
import type { ScenarioKey } from "@/simulation/pipeline-hazards/store";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function HazardTheory({
  usePlayback,
  activeScenario,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<HazardSnapshot>>>;
  activeScenario: ScenarioKey;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Pipeline Hazards">
      <TheorySection heading="Why hazards happen">
        <p>
          Module 2&apos;s pipeline assumed every instruction could always move forward one stage
          per cycle. In reality, three things can break that assumption:
        </p>
        <ul className="list-disc pl-4">
          <li>
            <strong className="text-foreground">Structural</strong> — two instructions need the
            same piece of hardware in the same cycle.
          </li>
          <li>
            <strong className="text-foreground">Data</strong> — an instruction needs a value that
            an earlier, still in-flight instruction hasn&apos;t produced yet.
          </li>
          <li>
            <strong className="text-foreground">Control</strong> — the CPU doesn&apos;t know
            which instruction to fetch next until a branch resolves.
          </li>
        </ul>
        <p>
          This module&apos;s pipeline has no fix for any of them yet — it just detects the
          problem and stalls (inserts a bubble) or flushes. That&apos;s intentional: Module 4
          (Forwarding) and Module 5 (Branch Prediction) are the fixes.
        </p>
      </TheorySection>

      {activeScenario === "data" && (
        <>
          <TheorySection heading="Cycle 4 — ADD stalls in Decode" watchCycle={4} onWatch={jumpToCycle}>
            <p>
              &quot;ADD R2, R1, R3&quot; reaches Decode needing R1 and R3. Both producers
              (&quot;MOV R1, #5&quot; and &quot;MOV R3, #10&quot;) are still in flight — one in
              Execute, one in Memory — neither has written back yet. Without forwarding, the only
              option is to freeze: Decode retries the same instruction, and Fetch freezes too, so
              nothing wrong gets pulled in behind it.
            </p>
          </TheorySection>
          <TheorySection heading="Cycle 6 — resolved" watchCycle={6} onWatch={jumpToCycle}>
            <p>
              By cycle 6, both producers have completed Write Back. ADD finally decodes
              successfully — 2 cycles were lost waiting. The same thing happens again right after
              for &quot;SUB R4, R2, R1&quot;, which depends on ADD&apos;s result.
            </p>
            <p className="font-mono text-xs text-neon-green">R2 = 15, then R4 = R2 - R1 = 10</p>
          </TheorySection>
        </>
      )}

      {activeScenario === "structural" && (
        <>
          <TheorySection
            heading="Cycle 3 — STORE also hits a data hazard first"
            watchCycle={3}
            onWatch={jumpToCycle}
          >
            <p>
              &quot;STORE R1, [0]&quot; needs R1 from &quot;MOV R1, #5&quot;, which hasn&apos;t
              written back yet — same data-hazard stall as before, resolved by cycle 5.
            </p>
          </TheorySection>
          <TheorySection
            heading="Cycle 7 — the actual structural hazard"
            watchCycle={7}
            onWatch={jumpToCycle}
          >
            <p>
              This scenario assumes a <strong className="text-foreground">unified memory</strong>{" "}
              — one physical port shared by instruction fetch and data access (Module 1 and 2
              quietly assumed separate ports, which is why you never saw this before). When STORE
              reaches Memory, Fetch wants the same port for the next instruction in the same
              cycle. One of them has to wait — Fetch stalls one cycle.
            </p>
          </TheorySection>
        </>
      )}

      {activeScenario === "control" && (
        <>
          <TheorySection
            heading="Cycle 7 — the branch resolves, and it's taken"
            watchCycle={7}
            onWatch={jumpToCycle}
          >
            <p>
              &quot;BEQ R1, R2, #1&quot; can only be evaluated in Execute — that&apos;s where the
              ALU actually compares R1 and R2. Until then, the CPU has already guessed
              &quot;not taken&quot; and fetched the very next instruction,
              &quot;MOV R3, #99&quot;, into the pipeline behind it. Since R1 and R2 are both 5,
              the branch <strong className="text-foreground">is</strong> taken — so that guess
              was wrong.
            </p>
          </TheorySection>
          <TheorySection heading="The wrong-path instruction is squashed" watchCycle={7} onWatch={jumpToCycle}>
            <p>
              &quot;MOV R3, #99&quot; is discarded before it ever reaches Decode — it never
              affects any register. Fetch immediately redirects to the branch target,
              &quot;MOV R4, #7&quot;. Exactly one bubble, one cycle lost. Watch R3 in the CPU
              Inspector: it stays 0 for the rest of the run.
            </p>
            <p className="font-mono text-xs text-neon-green">R5 = R4 + R1 = 7 + 5 = 12</p>
          </TheorySection>
        </>
      )}

      <TheorySection heading="What actually fixes these">
        <p>
          Structural hazards are fixed with more hardware (separate ports, duplicated units) —
          which is exactly why Module 1 and 2 never showed one. Data hazards are fixed by{" "}
          <strong className="text-foreground">forwarding</strong>: feeding a result straight from
          the ALU or Memory stage back into a waiting instruction instead of waiting for Write
          Back — Module 4 shows this eliminating the exact stalls you just watched. Control
          hazards are softened by <strong className="text-foreground">predicting</strong> which
          way a branch will go instead of always guessing not-taken — Module 5.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
