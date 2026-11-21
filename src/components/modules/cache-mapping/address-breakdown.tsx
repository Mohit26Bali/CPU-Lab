"use client";

import type { StoreApi, UseBoundStore } from "zustand";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { CacheMappingSnapshot } from "@/simulation/cache-mapping/engine";
import { ADDRESS_BITS, OFFSET_BITS } from "@/simulation/cache-mapping/engine";

const SEGMENT_STYLE = {
  tag: { bg: "bg-neon-purple/20", text: "text-neon-purple", border: "border-neon-purple/50" },
  index: { bg: "bg-neon-blue/20", text: "text-neon-blue", border: "border-neon-blue/50" },
  offset: { bg: "bg-neon-orange/20", text: "text-neon-orange", border: "border-neon-orange/50" },
};

export function AddressBreakdown({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<CacheMappingSnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current || current.address === null) return null;

  const { config, address, tag, setIndex } = current;
  const bits = address.toString(2).padStart(ADDRESS_BITS, "0").split("");
  const tagBits = bits.slice(0, config.tagBits);
  const indexBits = bits.slice(config.tagBits, config.tagBits + config.indexBits);
  const offsetBits = bits.slice(config.tagBits + config.indexBits);

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Address Breakdown
        </h3>
        <span className="font-mono text-xs text-foreground-muted">
          address {address} = 0b{bits.join("")}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        {tagBits.map((b, i) => (
          <Bit key={`t${i}`} value={b} kind="tag" />
        ))}
        {indexBits.map((b, i) => (
          <Bit key={`i${i}`} value={b} kind="index" />
        ))}
        {offsetBits.map((b, i) => (
          <Bit key={`o${i}`} value={b} kind="offset" />
        ))}
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <Legend kind="tag" label={`Tag (${config.tagBits}b)`} value={String(tag)} />
        {config.indexBits > 0 && (
          <Legend kind="index" label={`Index (${config.indexBits}b)`} value={String(setIndex)} />
        )}
        <Legend kind="offset" label={`Offset (${OFFSET_BITS}b)`} value="—" />
      </div>
    </div>
  );
}

function Bit({ value, kind }: { value: string; kind: keyof typeof SEGMENT_STYLE }) {
  const s = SEGMENT_STYLE[kind];
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded border font-mono text-sm ${s.bg} ${s.text} ${s.border}`}
    >
      {value}
    </div>
  );
}

function Legend({ kind, label, value }: { kind: keyof typeof SEGMENT_STYLE; label: string; value: string }) {
  const s = SEGMENT_STYLE[kind];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${s.bg} border ${s.border}`} />
      <span className="text-foreground-muted">{label}:</span>
      <span className={`font-mono ${s.text}`}>{value}</span>
    </div>
  );
}
