"use client";

import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function PerformanceTheory() {
  return (
    <TheoryDialog title="Theory — Performance Analysis">
      <TheorySection heading="Composing two real simulators, honestly">
        <p>
          This module doesn&apos;t run a third, from-scratch CPU model. It runs your program
          through the exact same pipeline engine as Module 3 (real hazard detection, real
          stalls, real branch flushes) and separately feeds every LOAD/STORE it actually executes
          through the exact same cache engine as Module 6 (real L1/L2/L3/RAM cascade). The
          performance report is the two combined: pipeline cycles, plus whatever extra latency a
          cache miss adds on top of the one cycle the pipeline already charged for a normal
          memory access.
        </p>
      </TheorySection>

      <TheorySection heading="The default program, and a subtlety in reading it">
        <p>
          The default program is a real loop (same backward-BEQ trick as Module 5): it sums the
          same memory address 5 times. There is only <strong className="text-foreground">one
          LOAD instruction</strong> in the source code — but it executes{" "}
          <strong className="text-foreground">five times</strong>, once per iteration. This
          module counts dynamic executions, not lines of code: scanning the source text once
          would only find one LOAD and completely miss what the program actually does at
          runtime.
        </p>
      </TheorySection>

      <TheorySection heading="Reading the default result">
        <p>
          With the default program: 58 baseline pipeline cycles, plus 56 extra cycles from a
          single cache miss (the very first LOAD — nothing was in the cache yet), for 114 total.
          The other 4 dynamic LOADs all hit L1, since they all target the exact same address —
          real temporal locality, the same effect Module 6 demonstrated, showing up here as a
          consequence of your code rather than a hand-picked trace.
        </p>
        <p>
          IPC lands under 0.1 for this run — not because the pipeline is bad, but because one
          57-cycle cache miss dominates a 10-instruction program. That&apos;s a real, useful
          finding: for short-running code, a single cold cache miss can matter more than every
          other cost combined.
        </p>
      </TheorySection>

      <TheorySection heading="Why branch accuracy looks low here">
        <p>
          The loop has two branches: an unconditional jump back to the top (taken every single
          time it&apos;s reached) and an exit check (taken only once, on the final iteration).
          Under the always-predict-not-taken policy this pipeline uses, the unconditional jump
          mispredicts <em>every time</em> — which is exactly the kind of branch Module 5&apos;s
          adaptive predictors exist to fix. Try rewriting the loop and watch how the mix of
          taken/not-taken branches changes this number.
        </p>
      </TheorySection>

      <TheorySection heading="What this doesn't model">
        <p>
          There&apos;s no out-of-order execution (Module 11) or superscalar issue (Module 12)
          here — this estimate assumes the simple in-order pipeline from Modules 3-5. A real
          performance analyzer for a modern CPU would need to layer those in too. Treat this as
          what it honestly is: a real, composed estimate from two verified models, not a
          cycle-accurate simulation of an actual shipping processor.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
