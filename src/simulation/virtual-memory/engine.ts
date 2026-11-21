import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";

export const VIRTUAL_ADDRESS_BITS = 16;
export const PHYSICAL_ADDRESS_BITS = 12;
export const OFFSET_BITS = 8; // 256-byte pages
export const VPN_BITS = VIRTUAL_ADDRESS_BITS - OFFSET_BITS;
export const PFN_BITS = PHYSICAL_ADDRESS_BITS - OFFSET_BITS;
export const TLB_SIZE = 4;
export const TLB_HIT_LATENCY = 1;
export const PAGE_TABLE_WALK_LATENCY = 30;

/**
 * A static page table: every VPN this module's trace touches already has a
 * valid mapping. Real OSes populate this lazily and can page to disk on a
 * fault — that's a different, bigger topic than "how does translation
 * work," which is this module's whole focus.
 */
export const PAGE_TABLE: Record<number, number> = { 0: 5, 1: 2, 2: 9, 3: 1, 4: 7 };

interface TlbEntry {
  vpn: number | null;
  pfn: number | null;
  lastUsed: number;
}

export interface TlbEntryView {
  index: number;
  vpn: number | null;
  pfn: number | null;
  justInstalled: boolean;
}

export interface VirtualMemorySnapshot extends BaseCycleSnapshot {
  requestIndex: number;
  virtualAddress: number | null;
  vpn: number | null;
  offset: number | null;
  pfn: number | null;
  physicalAddress: number | null;
  tlbHit: boolean | null;
  evictedVpn: number | null;
  latency: number;
  cumulativeLatency: number;
  hits: number;
  misses: number;
  tlb: TlbEntryView[];
  isFinal: boolean;
}

/**
 * Virtual → physical address translation. Every request first checks the
 * TLB (a small, fully-associative, LRU-managed cache of recent VPN→PFN
 * translations — same eviction mechanics as Module 6/8, applied here to
 * translations instead of data). A TLB miss means walking the page table
 * in memory, which is why it costs far more than a hit, and the result is
 * cached back into the TLB for next time.
 */
export class VirtualMemoryEngine implements SimulationEngine<VirtualMemorySnapshot, number[]> {
  private trace: number[] = [];
  private tlb: TlbEntry[] = [];
  private clock = 0;
  private requestIndex = 0;
  private cumulativeLatency = 0;
  private hits = 0;
  private misses = 0;
  private cycleCount = 0;
  private history: VirtualMemorySnapshot[] = [];

  initialize(trace: number[]): void {
    for (const va of trace) {
      if (!Number.isInteger(va) || va < 0 || va >= 1 << VIRTUAL_ADDRESS_BITS) {
        throw new RangeError(`Virtual address ${va} is outside the ${VIRTUAL_ADDRESS_BITS}-bit address space.`);
      }
      if (PAGE_TABLE[va >> OFFSET_BITS] === undefined) {
        throw new RangeError(`Virtual address ${va} is on page ${va >> OFFSET_BITS}, which has no mapping in the page table.`);
      }
    }
    this.trace = trace;
    this.tlb = Array.from({ length: TLB_SIZE }, () => ({ vpn: null, pfn: null, lastUsed: -1 }));
    this.clock = 0;
    this.requestIndex = 0;
    this.cumulativeLatency = 0;
    this.hits = 0;
    this.misses = 0;
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize(this.trace);
  }

  getState(): VirtualMemorySnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): VirtualMemorySnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): VirtualMemorySnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private snapshotTlb(justInstalledIndex: number | null): TlbEntryView[] {
    return this.tlb.map((e, i) => ({
      index: i,
      vpn: e.vpn,
      pfn: e.pfn,
      justInstalled: i === justInstalledIndex,
    }));
  }

  tick(): VirtualMemorySnapshot {
    this.cycleCount += 1;
    this.clock += 1;

    if (this.requestIndex >= this.trace.length) {
      const snapshot: VirtualMemorySnapshot = {
        cycle: this.cycleCount,
        requestIndex: this.requestIndex,
        virtualAddress: null,
        vpn: null,
        offset: null,
        pfn: null,
        physicalAddress: null,
        tlbHit: null,
        evictedVpn: null,
        latency: 0,
        cumulativeLatency: this.cumulativeLatency,
        hits: this.hits,
        misses: this.misses,
        tlb: this.snapshotTlb(null),
        events: [{ kind: "trace-complete", message: "All virtual addresses have been translated." }],
        explanation: "Every request in the trace has been translated.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    const virtualAddress = this.trace[this.requestIndex];
    const vpn = virtualAddress >> OFFSET_BITS;
    const offset = virtualAddress & ((1 << OFFSET_BITS) - 1);

    const existingIndex = this.tlb.findIndex((e) => e.vpn === vpn);
    let pfn: number;
    let tlbHit: boolean;
    let evictedVpn: number | null = null;
    let installedIndex: number;

    if (existingIndex !== -1) {
      tlbHit = true;
      this.hits += 1;
      this.tlb[existingIndex].lastUsed = this.clock;
      pfn = this.tlb[existingIndex].pfn!;
      installedIndex = existingIndex;
    } else {
      tlbHit = false;
      this.misses += 1;
      pfn = PAGE_TABLE[vpn];
      const freeIndex = this.tlb.findIndex((e) => e.vpn === null);
      const targetIndex =
        freeIndex !== -1
          ? freeIndex
          : this.tlb.reduce((min, e, i, arr) => (e.lastUsed < arr[min].lastUsed ? i : min), 0);
      if (freeIndex === -1) evictedVpn = this.tlb[targetIndex].vpn;
      this.tlb[targetIndex] = { vpn, pfn, lastUsed: this.clock };
      installedIndex = targetIndex;
    }

    const physicalAddress = (pfn << OFFSET_BITS) | offset;
    const latency = tlbHit ? TLB_HIT_LATENCY : PAGE_TABLE_WALK_LATENCY;
    this.cumulativeLatency += latency;

    const explanation = tlbHit
      ? `VPN ${vpn} is in the TLB (line ${installedIndex}) → PFN ${pfn}. TLB HIT, ${latency} cycle.`
      : `VPN ${vpn} misses the TLB. Walking the page table finds PFN ${pfn}${
          evictedVpn !== null ? ` (evicting VPN ${evictedVpn} from the TLB to cache it)` : ""
        }. ${latency} cycles.`;

    const snapshot: VirtualMemorySnapshot = {
      cycle: this.cycleCount,
      requestIndex: this.requestIndex,
      virtualAddress,
      vpn,
      offset,
      pfn,
      physicalAddress,
      tlbHit,
      evictedVpn,
      latency,
      cumulativeLatency: this.cumulativeLatency,
      hits: this.hits,
      misses: this.misses,
      tlb: this.snapshotTlb(installedIndex),
      events: [{ kind: "translation", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);
    this.requestIndex += 1;
    return snapshot;
  }
}
