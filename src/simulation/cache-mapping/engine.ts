import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";

export type MappingScheme = "direct" | "set-associative" | "full";

export const ADDRESS_BITS = 8; // addresses 0-255
export const BLOCK_SIZE = 4; // bytes per block
export const OFFSET_BITS = 2; // log2(BLOCK_SIZE)
export const TOTAL_LINES = 8; // fixed cache budget shared across all three schemes
export const HIT_LATENCY = 1;
export const MISS_LATENCY = 20;

interface SchemeConfig {
  scheme: MappingScheme;
  label: string;
  numSets: number;
  waysPerSet: number;
  indexBits: number;
  tagBits: number;
}

export const SCHEME_CONFIG: Record<MappingScheme, SchemeConfig> = {
  direct: {
    scheme: "direct",
    label: "Direct Mapped",
    numSets: TOTAL_LINES,
    waysPerSet: 1,
    indexBits: 3,
    tagBits: ADDRESS_BITS - 3 - OFFSET_BITS,
  },
  "set-associative": {
    scheme: "set-associative",
    label: "2-Way Set Associative",
    numSets: TOTAL_LINES / 2,
    waysPerSet: 2,
    indexBits: 2,
    tagBits: ADDRESS_BITS - 2 - OFFSET_BITS,
  },
  full: {
    scheme: "full",
    label: "Fully Associative",
    numSets: 1,
    waysPerSet: TOTAL_LINES,
    indexBits: 0,
    tagBits: ADDRESS_BITS - OFFSET_BITS,
  },
};

interface Line {
  tag: number | null;
  lastUsed: number;
}

export interface CacheMappingProgram {
  trace: number[];
  scheme: MappingScheme;
}

export interface WayView {
  tag: number | null;
  justInstalled: boolean;
  isSelected: boolean;
}

export interface SetView {
  index: number;
  ways: WayView[];
}

export interface CacheMappingSnapshot extends BaseCycleSnapshot {
  requestIndex: number;
  address: number | null;
  blockNumber: number | null;
  tag: number | null;
  setIndex: number | null;
  hit: boolean | null;
  evictedTag: number | null;
  latency: number;
  cumulativeLatency: number;
  hits: number;
  misses: number;
  sets: SetView[];
  scheme: MappingScheme;
  config: SchemeConfig;
  isFinal: boolean;
}

/**
 * One cache, three ways of deciding where a block is allowed to live. Same
 * 8-line total budget in every scheme so the comparison is fair: direct
 * mapping gives each block exactly one legal line (fast to check, prone to
 * conflict misses), full associativity gives it all 8 (flexible, needs LRU
 * search), set-associative is the real-world middle ground.
 */
export class CacheMappingEngine implements SimulationEngine<CacheMappingSnapshot, CacheMappingProgram> {
  private trace: number[] = [];
  private config: SchemeConfig = SCHEME_CONFIG.direct;
  private sets: Line[][] = [];
  private clock = 0;
  private requestIndex = 0;
  private cumulativeLatency = 0;
  private hits = 0;
  private misses = 0;
  private cycleCount = 0;
  private history: CacheMappingSnapshot[] = [];

  initialize(program: CacheMappingProgram): void {
    for (const address of program.trace) {
      if (!Number.isInteger(address) || address < 0 || address >= 1 << ADDRESS_BITS) {
        throw new RangeError(`Address ${address} is outside the ${ADDRESS_BITS}-bit address space (0 to ${(1 << ADDRESS_BITS) - 1}).`);
      }
    }
    this.trace = program.trace;
    this.config = SCHEME_CONFIG[program.scheme];
    this.sets = Array.from({ length: this.config.numSets }, () =>
      Array.from({ length: this.config.waysPerSet }, () => ({ tag: null, lastUsed: -1 })),
    );
    this.clock = 0;
    this.requestIndex = 0;
    this.cumulativeLatency = 0;
    this.hits = 0;
    this.misses = 0;
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize({ trace: this.trace, scheme: this.config.scheme });
  }

  getState(): CacheMappingSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): CacheMappingSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): CacheMappingSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private snapshotSets(setIndex: number | null, selectedTag: number | null): SetView[] {
    return this.sets.map((ways, i) => ({
      index: i,
      ways: ways.map((w) => ({
        tag: w.tag,
        justInstalled: i === setIndex && w.tag === selectedTag && w.lastUsed === this.clock,
        isSelected: i === setIndex,
      })),
    }));
  }

  tick(): CacheMappingSnapshot {
    this.cycleCount += 1;
    this.clock += 1;

    if (this.requestIndex >= this.trace.length) {
      const snapshot: CacheMappingSnapshot = {
        cycle: this.cycleCount,
        requestIndex: this.requestIndex,
        address: null,
        blockNumber: null,
        tag: null,
        setIndex: null,
        hit: null,
        evictedTag: null,
        latency: 0,
        cumulativeLatency: this.cumulativeLatency,
        hits: this.hits,
        misses: this.misses,
        sets: this.snapshotSets(null, null),
        scheme: this.config.scheme,
        config: this.config,
        events: [{ kind: "trace-complete", message: "All memory requests have been served." }],
        explanation: "Every request in the trace has been resolved.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    const address = this.trace[this.requestIndex];
    const blockNumber = Math.floor(address / BLOCK_SIZE);
    const setIndex = this.config.numSets > 1 ? blockNumber % this.config.numSets : 0;
    const tag = Math.floor(blockNumber / this.config.numSets);

    const set = this.sets[setIndex];
    const existing = set.find((w) => w.tag === tag);
    let hit = false;
    let evictedTag: number | null = null;

    if (existing) {
      hit = true;
      existing.lastUsed = this.clock;
      this.hits += 1;
    } else {
      this.misses += 1;
      const free = set.find((w) => w.tag === null);
      if (free) {
        free.tag = tag;
        free.lastUsed = this.clock;
      } else {
        const lru = set.reduce((min, w) => (w.lastUsed < min.lastUsed ? w : min), set[0]);
        evictedTag = lru.tag;
        lru.tag = tag;
        lru.lastUsed = this.clock;
      }
    }

    const latency = hit ? HIT_LATENCY : MISS_LATENCY;
    this.cumulativeLatency += latency;

    const bits = address.toString(2).padStart(ADDRESS_BITS, "0");
    const explanation = `Address ${address} (0b${bits}) → block ${blockNumber}, set ${setIndex}, tag ${tag}: ${
      hit ? "HIT" : "MISS"
    }${evictedTag !== null ? ` (evicted tag ${evictedTag})` : ""}.`;

    const snapshot: CacheMappingSnapshot = {
      cycle: this.cycleCount,
      requestIndex: this.requestIndex,
      address,
      blockNumber,
      tag,
      setIndex,
      hit,
      evictedTag,
      latency,
      cumulativeLatency: this.cumulativeLatency,
      hits: this.hits,
      misses: this.misses,
      sets: this.snapshotSets(setIndex, tag),
      scheme: this.config.scheme,
      config: this.config,
      events: [{ kind: "cache-request", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);
    this.requestIndex += 1;
    return snapshot;
  }
}
