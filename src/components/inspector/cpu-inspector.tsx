"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { InstructionCycleSnapshot } from "@/simulation/instruction-cycle/engine";
import { REGISTER_NAMES } from "@/simulation/instruction-cycle/isa";

/**
 * Persistent "DevTools for a processor" panel. Every field here is read
 * directly off the current simulator snapshot — nothing here is decorative.
 */
export function CpuInspector({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<InstructionCycleSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  const history = usePlayback((s) => s.history);
  const currentIndex = usePlayback((s) => s.currentIndex);

  if (!current) return null;

  const committedInstructions = history
    .slice(0, currentIndex + 1)
    .filter((h) => h.stage === "WRITEBACK").length;
  const cpi = committedInstructions > 0 ? (current.cycle / committedInstructions).toFixed(2) : "-";
  const ipc = committedInstructions > 0 ? (committedInstructions / current.cycle).toFixed(2) : "-";

  const recentEvents = history
    .slice(Math.max(0, currentIndex - 6), currentIndex + 1)
    .reverse();

  return (
    <div className="glass flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          CPU Inspector
        </h3>
        <span className="font-mono text-xs text-neon-blue">Cycle {current.cycle}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <InspectorStat label="Program Counter" value={String(current.pc)} />
        <InspectorStat
          label="Current Instruction"
          value={current.instruction?.raw ?? "—"}
          mono
        />
        <InspectorStat label="Stage" value={current.stage ?? "IDLE"} />
        <InspectorStat label="CPI" value={cpi} />
        <InspectorStat label="IPC" value={ipc} />
        <InspectorStat label="Instructions Committed" value={String(committedInstructions)} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Register File
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {REGISTER_NAMES.map((reg) => {
            const changed = current.registersChanged.includes(reg);
            return (
              <div
                key={`${reg}-${current.cycle}-${changed}`}
                className={`glass-inset flex flex-col items-center rounded-md px-1.5 py-1.5 ${
                  changed ? "flash-register glow-green" : ""
                }`}
              >
                <span className="text-[10px] text-foreground-muted">{reg}</span>
                <span className="font-mono text-sm">{current.registers[reg]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Memory (changed cells highlighted)
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {current.memory.map((value, addr) => {
            const changed = current.memoryChanged.includes(addr);
            return (
              <div
                key={`${addr}-${current.cycle}-${changed}`}
                className={`glass-inset flex flex-col items-center rounded-md px-1 py-1 ${
                  changed ? "flash-register glow-orange" : ""
                }`}
              >
                <span className="text-[9px] text-foreground-muted">{addr}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Control Signals
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(current.controlSignals).length === 0 && (
            <span className="text-xs text-foreground-muted">none active</span>
          )}
          {Object.entries(current.controlSignals).map(([signal, active]) =>
            active ? (
              <span
                key={signal}
                className="rounded-full bg-neon-blue/15 px-2 py-0.5 font-mono text-[10px] text-neon-blue"
              >
                {signal}
              </span>
            ) : null,
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Event Log
        </div>
        <ul className="flex flex-col gap-1.5 font-mono text-[11px] text-foreground-muted">
          {recentEvents.map((snap, i) => (
            <li key={snap.cycle} className={i === 0 ? "text-foreground" : ""}>
              <span className="text-neon-purple">C{snap.cycle}:</span> {snap.explanation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InspectorStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass-inset rounded-md px-2.5 py-2">
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className={`text-sm ${mono ? "font-mono text-neon-orange" : ""}`}>{value}</div>
    </div>
  );
}
