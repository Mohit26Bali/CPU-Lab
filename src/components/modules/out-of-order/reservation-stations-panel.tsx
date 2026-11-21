"use client";

import { motion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { OutOfOrderSnapshot } from "@/simulation/out-of-order/engine";
import { InstructionChip } from "./instruction-chip";

function operandLabel(v: number | null, q: number | null): string | null {
  if (q !== null) return `wait ROB${q}`;
  if (v !== null) return `${v}`;
  return null;
}

export function ReservationStationsPanel({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<OutOfOrderSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current) return null;

  const alu = current.rs.filter((r) => r.unitType === "ALU");
  const mem = current.rs.filter((r) => r.unitType === "MEM");

  return (
    <div className="glass flex h-full flex-col gap-3 overflow-y-auto p-3">
      <h3 className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
        Reservation Stations
      </h3>
      {[
        { label: "ALU", entries: alu },
        { label: "MEM", entries: mem },
      ].map(({ label, entries }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className="text-[9px] text-foreground-muted">{label}</span>
          {entries.map((rs) => {
            const j = operandLabel(rs.vj, rs.qj);
            const k = operandLabel(rs.vk, rs.qk);
            const readyToIssue = rs.busy && rs.qj === null && rs.qk === null;
            return (
              <motion.div
                key={rs.id}
                animate={{ scale: readyToIssue ? 1.02 : 1 }}
                className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${
                  readyToIssue
                    ? "glow-blue border-neon-blue/40 bg-neon-blue/5"
                    : rs.busy
                      ? "border-glass-border bg-ink/[0.05]"
                      : "border-glass-border bg-ink/[0.025]"
                }`}
              >
                {rs.busy ? (
                  <>
                    <InstructionChip raw={rs.raw!} index={rs.instrIndex!} small />
                    <span className="font-mono text-[9px] text-foreground-muted">
                      {[j, k].filter(Boolean).join(", ") || "—"}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] text-foreground-muted">empty</span>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
