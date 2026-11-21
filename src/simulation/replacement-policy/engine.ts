import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";

export type ReplacementPolicy = "fifo" | "lru" | "random";

export const NUM_LINES = 4;
export const HIT_LATENCY = 1;
export const MISS_LATENCY = 20;

interface Line {
  block: number | null;
  insertedAt: number;
  lastUsed: number;
}

/** Seeded PRNG (mulberry32) so "random" is still a reproducible, replayable run. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LineView {
  index: number;
  block: number | null;
  insertedAt: number;
  lastUsed: number;
  justInstalled: boolean;
  isVictim: boolean;
}

export interface ReplacementProgram {
  trace: number[];
  policy: ReplacementPolicy;
  seed?: number;
}

export interface ReplacementSnapshot extends BaseCycleSnapshot {
  requestIndex: number;
  block: number | null;
  hit: boolean | null;
  victimIndex: number | null;
  victimBlock: number | null;
  latency: number;
  cumulativeLatency: number;
  hits: number;
  misses: number;
  lines: LineView[];
  policy: ReplacementPolicy;
  isFinal: boolean;
}

/**
 * A single small fully-associative cache (4 lines — enough choice for
 * eviction policy to matter, small enough to fill fast) so the *only*
 * variable across a run is which line gets evicted on a miss. Mapping
 * mechanics are Module 7's job; this module is purely "which line dies."
 */
export class ReplacementPolicyEngine implements SimulationEngine<ReplacementSnapshot, ReplacementProgram> {
  private trace: number[] = [];
  private policy: ReplacementPolicy = "lru";
  private seed = 1;
  private lines: Line[] = [];
  private rng: () => number = mulberry32(1);
  private clock = 0;
  private requestIndex = 0;
  private cumulativeLatency = 0;
  private hits = 0;
  private misses = 0;
  private cycleCount = 0;
  private history: ReplacementSnapshot[] = [];

  initialize(program: ReplacementProgram): void {
    this.trace = program.trace;
    this.policy = program.policy;
    this.seed = program.seed ?? 1;
    this.rng = mulberry32(this.seed);
    this.lines = Array.from({ length: NUM_LINES }, () => ({ block: null, insertedAt: -1, lastUsed: -1 }));
    this.clock = 0;
    this.requestIndex = 0;
    this.cumulativeLatency = 0;
    this.hits = 0;
    this.misses = 0;
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize({ trace: this.trace, policy: this.policy, seed: this.seed });
  }

  getState(): ReplacementSnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): ReplacementSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): ReplacementSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private chooseVictim(): number {
    const occupied = this.lines.map((l, i) => ({ ...l, i })).filter((l) => l.block !== null);
    if (this.policy === "fifo") {
      return occupied.reduce((min, l) => (l.insertedAt < min.insertedAt ? l : min), occupied[0]).i;
    }
    if (this.policy === "lru") {
      return occupied.reduce((min, l) => (l.lastUsed < min.lastUsed ? l : min), occupied[0]).i;
    }
    return occupied[Math.floor(this.rng() * occupied.length)].i;
  }

  private snapshotLines(justInstalledIndex: number | null, victimIndex: number | null): LineView[] {
    return this.lines.map((l, i) => ({
      index: i,
      block: l.block,
      insertedAt: l.insertedAt,
      lastUsed: l.lastUsed,
      justInstalled: i === justInstalledIndex,
      isVictim: i === victimIndex,
    }));
  }

  tick(): ReplacementSnapshot {
    this.cycleCount += 1;
    this.clock += 1;

    if (this.requestIndex >= this.trace.length) {
      const snapshot: ReplacementSnapshot = {
        cycle: this.cycleCount,
        requestIndex: this.requestIndex,
        block: null,
        hit: null,
        victimIndex: null,
        victimBlock: null,
        latency: 0,
        cumulativeLatency: this.cumulativeLatency,
        hits: this.hits,
        misses: this.misses,
        lines: this.snapshotLines(null, null),
        policy: this.policy,
        events: [{ kind: "trace-complete", message: "All memory requests have been served." }],
        explanation: "Every request in the trace has been resolved.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    const block = this.trace[this.requestIndex];
    const existingIndex = this.lines.findIndex((l) => l.block === block);
    let hit = false;
    let victimIndex: number | null = null;
    let victimBlock: number | null = null;
    let installedIndex: number | null = null;

    if (existingIndex !== -1) {
      hit = true;
      this.lines[existingIndex].lastUsed = this.clock;
      this.hits += 1;
      installedIndex = existingIndex;
    } else {
      this.misses += 1;
      const freeIndex = this.lines.findIndex((l) => l.block === null);
      const targetIndex = freeIndex !== -1 ? freeIndex : this.chooseVictim();
      if (freeIndex === -1) {
        victimIndex = targetIndex;
        victimBlock = this.lines[targetIndex].block;
      }
      this.lines[targetIndex] = { block, insertedAt: this.clock, lastUsed: this.clock };
      installedIndex = targetIndex;
    }

    const latency = hit ? HIT_LATENCY : MISS_LATENCY;
    this.cumulativeLatency += latency;

    const explanation = hit
      ? `Block ${block} is already in line ${installedIndex} — HIT.`
      : victimBlock !== null
        ? `Block ${block} MISSES. Cache is full — ${this.policy.toUpperCase()} evicts block ${victimBlock} from line ${victimIndex} to make room.`
        : `Block ${block} MISSES. Installed into the free line ${installedIndex}.`;

    const snapshot: ReplacementSnapshot = {
      cycle: this.cycleCount,
      requestIndex: this.requestIndex,
      block,
      hit,
      victimIndex,
      victimBlock,
      latency,
      cumulativeLatency: this.cumulativeLatency,
      hits: this.hits,
      misses: this.misses,
      lines: this.snapshotLines(installedIndex, victimIndex),
      policy: this.policy,
      events: [{ kind: "cache-request", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);
    this.requestIndex += 1;
    return snapshot;
  }
}
