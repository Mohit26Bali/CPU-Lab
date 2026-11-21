import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";

export type CacheLevelName = "L1" | "L2" | "L3";

export interface CacheLevelConfig {
  name: CacheLevelName;
  lines: number;
  latency: number;
}

export const RAM_LATENCY = 40;

export const DEFAULT_LEVELS: CacheLevelConfig[] = [
  { name: "L1", lines: 4, latency: 1 },
  { name: "L2", lines: 8, latency: 4 },
  { name: "L3", lines: 16, latency: 12 },
];

interface Line {
  block: number | null;
  lastUsed: number;
}

export interface LevelStepResult {
  level: CacheLevelName | "RAM";
  hit: boolean;
}

export interface CacheLevelView {
  name: CacheLevelName;
  latency: number;
  lines: { block: number | null; justInstalled: boolean }[];
}

export interface EvictionRecord {
  level: CacheLevelName;
  evictedBlock: number;
}

export interface CacheRequestRecord {
  requestIndex: number;
  block: number;
  path: LevelStepResult[];
  hitLevel: CacheLevelName | "RAM";
  latency: number;
  evictions: EvictionRecord[];
}

export interface CacheHierarchySnapshot extends BaseCycleSnapshot {
  requestIndex: number;
  block: number | null;
  path: LevelStepResult[];
  hitLevel: CacheLevelName | "RAM" | null;
  requestLatency: number;
  cumulativeLatency: number;
  evictions: EvictionRecord[];
  levels: CacheLevelView[];
  levelStats: { name: CacheLevelName | "RAM"; hits: number; misses: number }[];
  requestLog: CacheRequestRecord[];
  trace: number[];
  isFinal: boolean;
}

/**
 * A real, fully-associative, LRU-managed cache hierarchy (mapping schemes
 * and replacement-policy comparisons are Module 7/8's job — this module
 * keeps "where does the block go" simple so the hierarchy cascade and hit
 * cost are the whole story). Each tick resolves one memory request through
 * L1 → L2 → L3 → RAM, installing the block into every level it missed at
 * (standard inclusive fill-on-access), evicting via LRU when a level is full.
 */
export class CacheHierarchyEngine implements SimulationEngine<CacheHierarchySnapshot, number[]> {
  private trace: number[] = [];
  private levels: Record<CacheLevelName, Line[]> = { L1: [], L2: [], L3: [] };
  private clock = 0;
  private requestIndex = 0;
  private cumulativeLatency = 0;
  private cycleCount = 0;
  private history: CacheHierarchySnapshot[] = [];
  private requestLog: CacheRequestRecord[] = [];
  private levelStats: Record<CacheLevelName | "RAM", { hits: number; misses: number }> = {
    L1: { hits: 0, misses: 0 },
    L2: { hits: 0, misses: 0 },
    L3: { hits: 0, misses: 0 },
    RAM: { hits: 0, misses: 0 },
  };

  initialize(trace: number[]): void {
    this.trace = trace;
    this.levels = Object.fromEntries(
      DEFAULT_LEVELS.map((l) => [l.name, new Array(l.lines).fill(null).map(() => ({ block: null, lastUsed: -1 }))]),
    ) as Record<CacheLevelName, Line[]>;
    this.clock = 0;
    this.requestIndex = 0;
    this.cumulativeLatency = 0;
    this.cycleCount = 0;
    this.history = [];
    this.requestLog = [];
    this.levelStats = {
      L1: { hits: 0, misses: 0 },
      L2: { hits: 0, misses: 0 },
      L3: { hits: 0, misses: 0 },
      RAM: { hits: 0, misses: 0 },
    };
  }

  reset(): void {
    this.initialize(this.trace);
  }

  getState(): CacheHierarchySnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): CacheHierarchySnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): CacheHierarchySnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private lookup(levelName: CacheLevelName, block: number): boolean {
    return this.levels[levelName].some((l) => l.block === block);
  }

  /** Installs `block` into a level, evicting the LRU line if full. Returns the evicted block, if any. */
  private install(levelName: CacheLevelName, block: number): number | null {
    const lines = this.levels[levelName];
    const existing = lines.find((l) => l.block === block);
    if (existing) {
      existing.lastUsed = this.clock;
      return null;
    }
    const free = lines.find((l) => l.block === null);
    if (free) {
      free.block = block;
      free.lastUsed = this.clock;
      return null;
    }
    const lru = lines.reduce((min, l) => (l.lastUsed < min.lastUsed ? l : min), lines[0]);
    const evicted = lru.block;
    lru.block = block;
    lru.lastUsed = this.clock;
    return evicted;
  }

  private touch(levelName: CacheLevelName, block: number): void {
    const line = this.levels[levelName].find((l) => l.block === block);
    if (line) line.lastUsed = this.clock;
  }

  private snapshotLevels(installedInto: Set<CacheLevelName>): CacheLevelView[] {
    return DEFAULT_LEVELS.map((cfg) => ({
      name: cfg.name,
      latency: cfg.latency,
      lines: this.levels[cfg.name].map((l) => ({
        block: l.block,
        justInstalled: installedInto.has(cfg.name) && l.lastUsed === this.clock,
      })),
    }));
  }

  tick(): CacheHierarchySnapshot {
    this.cycleCount += 1;
    this.clock += 1;

    if (this.requestIndex >= this.trace.length) {
      const snapshot: CacheHierarchySnapshot = {
        cycle: this.cycleCount,
        requestIndex: this.requestIndex,
        block: null,
        path: [],
        hitLevel: null,
        requestLatency: 0,
        cumulativeLatency: this.cumulativeLatency,
        evictions: [],
        levels: this.snapshotLevels(new Set()),
        levelStats: (["L1", "L2", "L3", "RAM"] as const).map((name) => ({ name, ...this.levelStats[name] })),
        requestLog: [...this.requestLog],
        trace: this.trace,
        events: [{ kind: "trace-complete", message: "All memory requests have been served." }],
        explanation: "Every request in the trace has been resolved.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    const block = this.trace[this.requestIndex];
    const path: LevelStepResult[] = [];
    let hitLevel: CacheLevelName | "RAM" = "RAM";
    let latency = 0;
    const installedInto = new Set<CacheLevelName>();
    const evictions: EvictionRecord[] = [];

    for (const cfg of DEFAULT_LEVELS) {
      const hit = this.lookup(cfg.name, block);
      path.push({ level: cfg.name, hit });
      latency += cfg.latency;
      this.levelStats[cfg.name][hit ? "hits" : "misses"] += 1;
      if (hit) {
        this.touch(cfg.name, block);
        hitLevel = cfg.name;
        break;
      }
    }

    const hitInCache = path.some((p) => p.hit);
    if (!hitInCache) {
      path.push({ level: "RAM", hit: true });
      latency += RAM_LATENCY;
      this.levelStats.RAM.hits += 1;
      hitLevel = "RAM";
    }

    // Fill every level that missed, from the hit point up to L1 (inclusive fill-on-access).
    const missedLevels = path.filter((p) => !p.hit).map((p) => p.level as CacheLevelName);
    for (const levelName of missedLevels) {
      const evicted = this.install(levelName, block);
      installedInto.add(levelName);
      if (evicted !== null) evictions.push({ level: levelName, evictedBlock: evicted });
    }

    this.cumulativeLatency += latency;
    const record: CacheRequestRecord = {
      requestIndex: this.requestIndex,
      block,
      path,
      hitLevel,
      latency,
      evictions,
    };
    this.requestLog.push(record);

    const explanation = `Request for block ${block}: ${path
      .map((p) => `${p.level} ${p.hit ? "HIT" : "MISS"}`)
      .join(" → ")} — resolved at ${hitLevel}, ${latency} cycles.`;

    const snapshot: CacheHierarchySnapshot = {
      cycle: this.cycleCount,
      requestIndex: this.requestIndex,
      block,
      path,
      hitLevel,
      requestLatency: latency,
      cumulativeLatency: this.cumulativeLatency,
      evictions,
      levels: this.snapshotLevels(installedInto),
      levelStats: (["L1", "L2", "L3", "RAM"] as const).map((name) => ({ name, ...this.levelStats[name] })),
      requestLog: [...this.requestLog],
      trace: this.trace,
      events: [{ kind: "cache-request", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);
    this.requestIndex += 1;
    return snapshot;
  }
}
