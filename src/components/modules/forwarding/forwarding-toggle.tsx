"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import { Zap, ZapOff } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { ForwardingSnapshot } from "@/simulation/forwarding/engine";
import { forwardingProgram } from "@/simulation/forwarding/store";

export function ForwardingToggle({
  usePlayback,
  enabled,
  onChange,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<ForwardingSnapshot>>>;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const loadProgram = usePlayback((s) => s.loadProgram);

  return (
    <div className="glass flex items-center gap-3 p-3">
      <span className="text-xs text-foreground-muted">Same program, two datapaths:</span>
      <button
        onClick={() => {
          onChange(false);
          loadProgram(forwardingProgram(false));
        }}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          !enabled
            ? "glow-orange border-neon-orange/40 bg-neon-orange/15 text-neon-orange"
            : "border-glass-border text-foreground-muted hover:text-foreground"
        }`}
      >
        <ZapOff size={13} />
        Without Forwarding
      </button>
      <button
        onClick={() => {
          onChange(true);
          loadProgram(forwardingProgram(true));
        }}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          enabled
            ? "glow-purple border-neon-purple/40 bg-neon-purple/15 text-neon-purple"
            : "border-glass-border text-foreground-muted hover:text-foreground"
        }`}
      >
        <Zap size={13} />
        With Forwarding
      </button>
    </div>
  );
}
