"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { InstructionCycleSnapshot } from "@/simulation/instruction-cycle/engine";
import { TheoryDialog } from "@/components/theory/theory-dialog";
import { TheorySection } from "@/components/theory/theory-section";

export function InstructionCycleTheory({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<InstructionCycleSnapshot>>>;
}) {
  const jumpToCycle = usePlayback((s) => s.jumpToCycle);

  return (
    <TheoryDialog title="Theory — The Instruction Cycle">
      <TheorySection heading="What is the instruction cycle?">
        <p>
          Every instruction a CPU runs goes through the same five steps, in the same order:
          <strong className="text-foreground"> Fetch</strong> the instruction from memory,
          <strong className="text-foreground"> Decode</strong> it to figure out what it means,
          <strong className="text-foreground"> Execute</strong> the operation on the ALU,
          access <strong className="text-foreground">Memory</strong> if the instruction needs
          to read or write it, then <strong className="text-foreground">Write Back</strong> the
          result into a register. This module runs those five steps for real, one cycle each,
          so you can watch a single instruction move through the datapath.
        </p>
        <p>
          In this simplest design, one instruction must finish all five stages before the next
          one starts — so each instruction costs exactly 5 cycles. That&apos;s intentional: it
          makes the mechanics visible before Module 2 introduces pipelining, which overlaps
          these stages across instructions to make the CPU faster.
        </p>
      </TheorySection>

      <TheorySection heading="Cycles 1–5 — MOV R1, #5" watchCycle={1} onWatch={jumpToCycle}>
        <p>
          <strong className="text-foreground">Fetch</strong> reads &quot;MOV R1, #5&quot; from
          instruction memory at PC = 0.{" "}
          <strong className="text-foreground">Decode</strong> recognizes the opcode MOV with an
          immediate source. <strong className="text-foreground">Execute</strong> just passes the
          literal value 5 through the ALU — there&apos;s no math to do.{" "}
          <strong className="text-foreground">Memory</strong> is skipped; MOV never touches RAM.{" "}
          <strong className="text-foreground">Write Back</strong> stores 5 into R1.
        </p>
        <p className="font-mono text-xs text-neon-green">R1 = 5</p>
      </TheorySection>

      <TheorySection heading="Cycles 6–10 — MOV R3, #10" watchCycle={6} onWatch={jumpToCycle}>
        <p>
          Same five steps, next instruction, next register. The Program Counter has advanced to
          1, so Fetch reads the second line.
        </p>
        <p className="font-mono text-xs text-neon-green">R3 = 10</p>
      </TheorySection>

      <TheorySection heading="Cycles 11–15 — ADD R2, R1, R3" watchCycle={11} onWatch={jumpToCycle}>
        <p>
          This is why register file state matters: R1 and R3 were written back by the two
          previous instructions and are still sitting in the register file when this one reads
          them in Decode. Execute&apos;s ALU adds them together.
        </p>
        <p className="font-mono text-xs text-neon-green">R2 = R1 + R3 = 5 + 10 = 15</p>
      </TheorySection>

      <TheorySection heading="Cycles 16–20 — SUB R4, R2, R1" watchCycle={16} onWatch={jumpToCycle}>
        <p>Another ALU operation, this time subtraction, reusing R2 and R1 again.</p>
        <p className="font-mono text-xs text-neon-green">R4 = R2 - R1 = 15 - 5 = 10</p>
      </TheorySection>

      <TheorySection
        heading="Cycles 21–25 — STORE R4, [0] — Memory finally does something"
        watchCycle={21}
        onWatch={jumpToCycle}
      >
        <p>
          For every earlier instruction, the Memory stage was a no-op. Here it isn&apos;t:
          Execute computes the target address (0), and the Memory stage writes R4&apos;s value
          into that address. Note there&apos;s no Write Back for STORE — nothing comes back to a
          register.
        </p>
        <p className="font-mono text-xs text-neon-orange">memory[0] = R4 = 10</p>
      </TheorySection>

      <TheorySection
        heading="Cycles 26–30 — LOAD R5, [0] — reading back what we stored"
        watchCycle={26}
        onWatch={jumpToCycle}
      >
        <p>
          The mirror image of STORE: Execute computes the address, Memory reads the value at
          that address, and Write Back places it into R5.
        </p>
        <p className="font-mono text-xs text-neon-green">R5 = memory[0] = 10</p>
      </TheorySection>

      <TheorySection heading="What's next">
        <p>
          Notice this program takes 30 cycles to run 6 instructions — 5 cycles each, with zero
          overlap. Module 2 (Pipeline) runs this exact program again, but overlaps the stages so
          a new instruction starts every cycle instead of every 5. Same instructions, same
          results, far fewer cycles.
        </p>
      </TheorySection>
    </TheoryDialog>
  );
}
