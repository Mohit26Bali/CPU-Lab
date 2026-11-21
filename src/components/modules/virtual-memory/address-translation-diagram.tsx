"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { Check, X, BookOpen } from "lucide-react";
import type { PlaybackState } from "@/lib/playback/create-playback-store";
import type { VirtualMemorySnapshot } from "@/simulation/virtual-memory/engine";
import { VPN_BITS, OFFSET_BITS, PFN_BITS } from "@/simulation/virtual-memory/engine";

const VPN_STYLE = { bg: "bg-neon-purple/20", text: "text-neon-purple", border: "border-neon-purple/50" };
const OFFSET_STYLE = { bg: "bg-neon-orange/20", text: "text-neon-orange", border: "border-neon-orange/50" };
const PFN_STYLE = { bg: "bg-neon-blue/20", text: "text-neon-blue", border: "border-neon-blue/50" };

function Bits({ value, bits, style }: { value: number; bits: number; style: typeof VPN_STYLE }) {
  const chars = value.toString(2).padStart(bits, "0").split("");
  return (
    <div className="flex items-center gap-0.5">
      {chars.map((c, i) => (
        <div
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded border font-mono text-xs ${style.bg} ${style.text} ${style.border}`}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

export function AddressTranslationDiagram({
  usePlayback,
}: {
  usePlayback: UseBoundStore<StoreApi<PlaybackState<VirtualMemorySnapshot>>>;
}) {
  const current = usePlayback((s) => s.current);
  if (!current || current.virtualAddress === null) return null;

  const { vpn, offset, pfn, tlbHit, virtualAddress, physicalAddress } = current;

  return (
    <div className="glass flex flex-col gap-4 overflow-x-auto p-6">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Address Translation
      </h3>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-foreground-muted">
          Virtual Address = {virtualAddress}
        </span>
        <div className="flex items-center gap-1">
          <Bits value={vpn!} bits={VPN_BITS} style={VPN_STYLE} />
          <Bits value={offset!} bits={OFFSET_BITS} style={OFFSET_STYLE} />
        </div>
        <div className="flex gap-1 text-[9px] text-foreground-muted">
          <span style={{ width: `${VPN_BITS * 30}px` }} className="text-center text-neon-purple">
            VPN = {vpn}
          </span>
          <span style={{ width: `${OFFSET_BITS * 30}px` }} className="text-center text-neon-orange">
            offset = {offset}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-4 w-px bg-neon-blue" />
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-xs ${
            tlbHit
              ? "glow-green border-neon-green/50 bg-neon-green/10"
              : "glow-red border-neon-red/50 bg-neon-red/10"
          }`}
        >
          <span>TLB Lookup</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={String(tlbHit)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 font-medium ${
                tlbHit ? "text-neon-green" : "text-neon-red"
              }`}
            >
              {tlbHit ? <Check size={12} /> : <X size={12} />}
              {tlbHit ? "HIT" : "MISS"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {!tlbHit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-neon-orange/40 bg-neon-orange/5 px-3 py-2 text-xs text-neon-orange"
          >
            <BookOpen size={13} />
            Walking page table for VPN {vpn} → PFN {pfn}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <div className="h-4 w-px bg-neon-blue" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-foreground-muted">
          Physical Address = {physicalAddress}
        </span>
        <div className="flex items-center gap-1">
          <Bits value={pfn!} bits={PFN_BITS} style={PFN_STYLE} />
          <Bits value={offset!} bits={OFFSET_BITS} style={OFFSET_STYLE} />
        </div>
        <div className="flex gap-1 text-[9px] text-foreground-muted">
          <span style={{ width: `${PFN_BITS * 30}px` }} className="text-center text-neon-blue">
            PFN = {pfn}
          </span>
          <span style={{ width: `${OFFSET_BITS * 30}px` }} className="text-center text-neon-orange">
            offset unchanged
          </span>
        </div>
      </div>
    </div>
  );
}
