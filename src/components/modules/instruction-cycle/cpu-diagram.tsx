"use client";

import { motion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { LucideIcon } from "lucide-react";
import {
  Database,
  Hash,
  FileText,
  Binary,
  Grid3x3,
  Sigma,
  MemoryStick,
  CheckCircle2,
} from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { InstructionCycleSnapshot } from "@/simulation/instruction-cycle/engine";
import type { Stage } from "@/types/simulation";

interface Block {
  id: string;
  label: string;
  icon: LucideIcon;
  stages: Stage[];
}

const BLOCKS: Block[] = [
  { id: "imem", label: "Instruction Memory", icon: Database, stages: ["FETCH"] },
  { id: "pc", label: "Program Counter", icon: Hash, stages: ["FETCH"] },
  { id: "ir", label: "Instruction Register", icon: FileText, stages: ["FETCH", "DECODE"] },
  { id: "decoder", label: "Decoder", icon: Binary, stages: ["DECODE"] },
  { id: "regfile", label: "Register File", icon: Grid3x3, stages: ["DECODE", "EXECUTE"] },
  { id: "alu", label: "ALU", icon: Sigma, stages: ["EXECUTE", "MEMORY"] },
  { id: "dmem", label: "Data Memory", icon: MemoryStick, stages: ["MEMORY"] },
  { id: "writeback", label: "Registers (Write Back)", icon: CheckCircle2, stages: ["WRITEBACK"] },
];

export function CpuDiagram({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<InstructionCycleSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const stage = current?.stage ?? null;

  return (
    <div className="glass flex h-full flex-col items-center gap-2 overflow-y-auto p-6">
      <h3 className="mb-2 self-start text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        CPU Diagram
      </h3>
      <div className="flex w-full max-w-xs flex-col items-center">
        {BLOCKS.map((block, i) => {
          const active = stage !== null && block.stages.includes(stage);
          const Icon = block.icon;
          return (
            <div key={block.id} className="flex w-full flex-col items-center">
              <motion.div
                animate={{
                  scale: active ? 1.05 : 1,
                  opacity: active ? 1 : 0.6,
                }}
                transition={{ duration: 0.25 }}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  active
                    ? "glow-blue border-neon-blue/50 bg-neon-blue/10 font-medium text-foreground"
                    : "border-glass-border bg-ink/[0.04] text-foreground-muted"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-neon-blue" : "text-foreground-muted"}
                />
                <span className="flex-1 text-center">{block.label}</span>
                {active && (
                  <span className="rounded-full bg-neon-blue/20 px-2 py-0.5 text-[10px] text-neon-blue">
                    {stage}
                  </span>
                )}
              </motion.div>
              {i < BLOCKS.length - 1 && (
                <div
                  className={`h-6 w-px ${
                    active || (BLOCKS[i + 1] && stage && BLOCKS[i + 1].stages.includes(stage))
                      ? "pulse-wire bg-neon-blue"
                      : "bg-glass-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
