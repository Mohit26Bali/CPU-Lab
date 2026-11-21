import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";
import { HIERARCHY, type HierarchyTier } from "./data";

export const REFERENCE_TIER_KEY = "l1";
export const REFERENCE_HUMAN_SECONDS = 1;

export interface TierView extends HierarchyTier {
  index: number;
  isCurrent: boolean;
  revealed: boolean;
  /** How long this tier's real latency would feel if L1 access were stretched to 1 second. */
  humanScaleSeconds: number;
}

export interface MemoryHierarchySnapshot extends BaseCycleSnapshot {
  tierIndex: number;
  cumulativeNs: number;
  tiers: TierView[];
  isFinal: boolean;
}

/**
 * Not a cache simulator — Modules 6-8 already own hit/miss/eviction logic.
 * This engine simply walks the full hierarchy tier by tier, one per tick,
 * accumulating real latency, so the shared Playback Engine still drives a
 * genuine state machine instead of a static infographic.
 */
export class MemoryHierarchyEngine implements SimulationEngine<MemoryHierarchySnapshot, HierarchyTier[]> {
  private tiers: HierarchyTier[] = HIERARCHY;
  private tierIndex = -1;
  private cumulativeNs = 0;
  private cycleCount = 0;
  private history: MemoryHierarchySnapshot[] = [];

  initialize(tiers: HierarchyTier[] = HIERARCHY): void {
    this.tiers = tiers;
    this.tierIndex = -1;
    this.cumulativeNs = 0;
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize(this.tiers);
  }

  getState(): MemoryHierarchySnapshot {
    if (this.history.length === 0) throw new Error("Engine has not ticked yet.");
    return this.history[this.history.length - 1];
  }

  getHistory(): MemoryHierarchySnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): MemoryHierarchySnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  private buildTierViews(): TierView[] {
    const reference = this.tiers.find((t) => t.key === REFERENCE_TIER_KEY) ?? this.tiers[0];
    return this.tiers.map((t, i) => ({
      ...t,
      index: i,
      isCurrent: i === this.tierIndex,
      revealed: i <= this.tierIndex,
      humanScaleSeconds: (t.ns / reference.ns) * REFERENCE_HUMAN_SECONDS,
    }));
  }

  tick(): MemoryHierarchySnapshot {
    this.cycleCount += 1;

    if (this.tierIndex >= this.tiers.length - 1) {
      const snapshot: MemoryHierarchySnapshot = {
        cycle: this.cycleCount,
        tierIndex: this.tierIndex,
        cumulativeNs: this.cumulativeNs,
        tiers: this.buildTierViews(),
        events: [{ kind: "hierarchy-complete", message: "Reached the bottom of the hierarchy." }],
        explanation: "Every tier from Register to Disk has been visited.",
        isFinal: true,
      };
      this.history.push(snapshot);
      return snapshot;
    }

    this.tierIndex += 1;
    const tier = this.tiers[this.tierIndex];
    this.cumulativeNs += tier.ns;

    const explanation = `${tier.label}: ${tier.ns.toLocaleString()} ns access latency. ${tier.note}`;

    const snapshot: MemoryHierarchySnapshot = {
      cycle: this.cycleCount,
      tierIndex: this.tierIndex,
      cumulativeNs: this.cumulativeNs,
      tiers: this.buildTierViews(),
      events: [{ kind: "tier-visited", message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);
    return snapshot;
  }
}
