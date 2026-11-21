"use client";

import { Play, RotateCcw } from "lucide-react";

export function CodeEditor({
  value,
  onChange,
  onRun,
  onReset,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  onReset: () => void;
  error: string | null;
}) {
  return (
    <div className="glass flex h-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Program
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-foreground-muted transition hover:text-foreground"
          >
            <RotateCcw size={11} />
            Reset
          </button>
          <button
            onClick={onRun}
            className="glow-blue flex items-center gap-1.5 rounded-md bg-neon-blue/15 px-3 py-1.5 text-xs font-medium text-neon-blue transition hover:bg-neon-blue/25"
          >
            <Play size={12} />
            Analyze
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none rounded-lg border border-glass-border bg-ink/[0.04] p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-neon-blue/40"
      />
      {error && (
        <p className="rounded-md bg-neon-red/10 px-3 py-2 text-xs text-neon-red">{error}</p>
      )}
      <p className="text-[10px] text-foreground-muted">
        MOV / ADD / SUB / LOAD / STORE / BEQ — the same ISA as Modules 3-5. BEQ offsets can be
        negative to loop backward.
      </p>
    </div>
  );
}
