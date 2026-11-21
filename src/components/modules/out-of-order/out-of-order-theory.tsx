"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { OutOfOrderSnapshot } from "@/simulation/out-of-order/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function OutOfOrderTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<OutOfOrderSnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — Out-of-Order Execution">
      <TheorySection heading="The problem this solves">
        <p>
          Module 3 showed a strictly in-order pipeline stalling completely whenever one
          instruction had to wait — even if a totally unrelated instruction right behind it was
          ready to go. Out-of-order execution fixes that: instructions can run the moment{" "}
          <em>their own</em> operands are ready, regardless of what&apos;s still waiting ahead of
          them. The catch is that the rest of the machine — and the program&apos;s observable
          behavior — still has to look like everything happened in order. That illusion is what
          the Reorder Buffer (ROB) is for.
        </p>
        <p>
          This program: two fast constants, a slow 4-cycle LOAD with no dependencies, an ADD that
          only depends on the two constants, another independent constant, and a SUB that depends
          on the LOAD and the ADD.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 4 — the slow instruction is already running" watchCycle={4} onWatch={jumpToCycle}>
        <p>
          The LOAD has no register dependencies, so it starts executing the moment it&apos;s
          issued — but it takes 4 cycles. Meanwhile ADD dispatches right behind it, into a
          completely separate reservation station.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 7 — ADD finishes before LOAD does" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          ADD only needed 2 cycles and its operands were ready immediately, so it finishes and
          broadcasts its result on the CDB <strong className="text-foreground">before</strong>{" "}
          the LOAD — even though LOAD was dispatched first and is program-order-earlier. This is
          out-of-order execution, verified: watch ROB3 (ADD) turn &quot;ready&quot; while ROB2
          (LOAD) is still &quot;executing.&quot;
        </p>
      </TheorySection>

      <TheorySection heading="Cycles 7–9 — only one result can broadcast per cycle" watchCycle={7} onWatch={jumpToCycle}>
        <p>
          There&apos;s a subtler event hiding here: MOV R5 also finishes executing at cycle 7, at
          the exact same moment as ADD. But this machine has a single common data bus — only one
          result can broadcast per cycle. The arbiter picks the older instruction (ADD, ROB3)
          first; MOV R5 has to wait. It loses the bus <em>again</em> at cycle 8 to the LOAD, and
          finally gets through at cycle 9. This is real, cheap hardware behavior: cheap CDBs are
          single-broadcast, and it means being ready isn&apos;t enough — you still queue for the
          bus.
        </p>
      </TheorySection>

      <TheorySection heading="Cycle 10 — commit finally catches up" watchCycle={10} onWatch={jumpToCycle}>
        <p>
          ADD has been sitting &quot;ready&quot; in the ROB since cycle 7 — three full cycles —
          purely because LOAD, which is ahead of it in program order, hadn&apos;t committed yet.
          The ROB only ever commits its <strong className="text-foreground">head</strong>. The
          moment LOAD commits (cycle 9), ADD is finally allowed to commit right after. No matter
          how out-of-order the execution gets internally, the register file only ever changes in
          the original program order — which is exactly what makes this safe to build.
        </p>
      </TheorySection>

      <TheorySection heading="Why this is worth the complexity">
        <p>
          Reservation stations, a reorder buffer, and register renaming (the &quot;which ROB
          entry will produce this register&apos;s next value&quot; bookkeeping this engine does
          on every dispatch) are a lot of hardware. The payoff: a single slow instruction — a cache miss,
          a long-latency operation — no longer stalls everything behind it, only the specific
          instructions that actually depend on it. Every high-performance CPU since the 1990s is
          built this way.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
