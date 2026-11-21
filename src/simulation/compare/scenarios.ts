import { InstructionCycleEngine } from "@/simulation/instruction-cycle/engine";
import { DEFAULT_PROGRAM as SCALAR_PROGRAM, parseProgram as parseIC } from "@/simulation/instruction-cycle/isa";
import { PipelineEngine } from "@/simulation/pipeline/engine";
import { BranchPredictionEngine } from "@/simulation/branch-prediction/engine";
import { branchPredictionProgram } from "@/simulation/branch-prediction/store";
import { CacheHierarchyEngine, RAM_LATENCY } from "@/simulation/cache-hierarchy/engine";
import { DEFAULT_TRACE as CACHE_TRACE } from "@/simulation/cache-hierarchy/store";

export interface RaceFrame {
  cycle: number;
  progress: number;
  /** One-line "what happened this cycle" for this side, for the live log. */
  note: string;
}

export type Accent = "blue" | "green" | "orange" | "purple" | "red";

export interface RaceSide {
  label: string;
  accent: Accent;
  frames: RaceFrame[];
  finalCycle: number;
  summary: string;
}

export interface CompareScenario {
  key: string;
  label: string;
  question: string;
  unit: string;
  sides: [RaceSide, RaceSide];
  verdict: string;
}

function runToEnd<T extends { isFinal: boolean }>(tick: () => T): T[] {
  const history: T[] = [];
  let guard = 0;
  while (guard < 500) {
    const snap = tick();
    history.push(snap);
    if (snap.isFinal) break;
    guard++;
  }
  return history;
}

// --- Scenario 1: Pipeline vs No Pipeline -----------------------------------

function buildPipelineScenario(): CompareScenario {
  const total = parseIC(SCALAR_PROGRAM).length;

  const ic = new InstructionCycleEngine();
  ic.initialize(parseIC(SCALAR_PROGRAM));
  const icHistory = runToEnd(() => ic.tick()).filter((h) => !h.isFinal);
  let icCompleted = 0;
  const icFrames: RaceFrame[] = icHistory.map((h) => {
    if (h.stage === "WRITEBACK") icCompleted += 1;
    return {
      cycle: h.cycle,
      progress: icCompleted / total,
      note: h.explanation,
    };
  });

  const pipe = new PipelineEngine();
  pipe.initialize(parseIC(SCALAR_PROGRAM));
  const pipeHistory = runToEnd(() => pipe.tick()).filter((h) => !h.isFinal);
  const pipeFrames: RaceFrame[] = pipeHistory.map((h) => {
    // instructionsCompleted only counts instructions *past* Writeback — the
    // one retiring this very cycle isn't added until the next tick. Count it
    // here too so progress reaches 1.0 on the last real cycle, not the one after.
    const retiringNow = h.occupancy.WRITEBACK ? 1 : 0;
    return {
      cycle: h.cycle,
      progress: (h.instructionsCompleted + retiringNow) / total,
      note: h.explanation,
    };
  });

  const icCycles = icFrames.length;
  const pipeCycles = pipeFrames.length;

  return {
    key: "pipeline",
    label: "Pipeline vs No Pipeline",
    question: `Same ${total}-instruction program. One CPU finishes one instruction completely before starting the next; the other overlaps five in flight at once.`,
    unit: "cycle",
    sides: [
      {
        label: "No Pipeline",
        accent: "red",
        frames: icFrames,
        finalCycle: icCycles,
        summary: `${icCycles} cycles for ${total} instructions`,
      },
      {
        label: "Pipeline",
        accent: "green",
        frames: pipeFrames,
        finalCycle: pipeCycles,
        summary: `${pipeCycles} cycles for ${total} instructions`,
      },
    ],
    verdict: `Pipelining finishes ${(icCycles / pipeCycles).toFixed(2)}x faster — ${icCycles} cycles down to ${pipeCycles}, same program, same result.`,
  };
}

// --- Scenario 2: Branch Prediction naive vs adaptive ------------------------

function buildBranchScenario(): CompareScenario {
  const naive = new BranchPredictionEngine();
  naive.initialize(branchPredictionProgram("always-not-taken"));
  const naiveHistory = runToEnd(() => naive.tick()).filter((h) => !h.isFinal);
  const total = naiveHistory[naiveHistory.length - 1].instructionsCompleted;
  const naiveFrames: RaceFrame[] = naiveHistory.map((h) => ({
    cycle: h.cycle,
    progress: h.instructionsCompleted / total,
    note: h.explanation,
  }));

  const adaptive = new BranchPredictionEngine();
  adaptive.initialize(branchPredictionProgram("two-bit"));
  const adaptiveHistory = runToEnd(() => adaptive.tick()).filter((h) => !h.isFinal);
  const adaptiveFrames: RaceFrame[] = adaptiveHistory.map((h) => ({
    cycle: h.cycle,
    progress: h.instructionsCompleted / total,
    note: h.explanation,
  }));

  const naiveLog = naiveHistory[naiveHistory.length - 1].predictionLog;
  const adaptiveLog = adaptiveHistory[adaptiveHistory.length - 1].predictionLog;
  const naiveAcc = Math.round((naiveLog.filter((p) => p.correct).length / naiveLog.length) * 100);
  const adaptiveAcc = Math.round(
    (adaptiveLog.filter((p) => p.correct).length / adaptiveLog.length) * 100,
  );

  const naiveCycles = naiveFrames.length;
  const adaptiveCycles = adaptiveFrames.length;

  return {
    key: "branch-prediction",
    label: "Branch Prediction: Naive vs Adaptive",
    question: "Same real loop (Module 5). One predictor always guesses not-taken; the other learns from what each branch actually did last time.",
    unit: "cycle",
    sides: [
      {
        label: "Always Not-Taken",
        accent: "red",
        frames: naiveFrames,
        finalCycle: naiveCycles,
        summary: `${naiveCycles} cycles, ${naiveAcc}% accuracy`,
      },
      {
        label: "2-Bit Adaptive",
        accent: "green",
        frames: adaptiveFrames,
        finalCycle: adaptiveCycles,
        summary: `${adaptiveCycles} cycles, ${adaptiveAcc}% accuracy`,
      },
    ],
    verdict: `The adaptive predictor finishes in ${adaptiveCycles} cycles versus ${naiveCycles} — fewer mispredictions mean fewer flushed instructions, at ${adaptiveAcc}% accuracy instead of ${naiveAcc}%.`,
  };
}

// --- Scenario 3: Cache vs No Cache ------------------------------------------

function buildCacheScenario(): CompareScenario {
  const total = CACHE_TRACE.length;

  const cache = new CacheHierarchyEngine();
  cache.initialize(CACHE_TRACE);
  const cacheHistory = runToEnd(() => cache.tick()).filter((h) => !h.isFinal);
  const cacheFrames: RaceFrame[] = cacheHistory.map((h) => ({
    cycle: h.cumulativeLatency,
    progress: (h.requestIndex + 1) / total,
    note: h.explanation,
  }));

  // No stateful engine needed here: with no cache, every access is a fixed-cost
  // round trip to RAM — the math is the trace length times one constant.
  const noCacheFrames: RaceFrame[] = CACHE_TRACE.map((block, i) => ({
    cycle: (i + 1) * RAM_LATENCY,
    progress: (i + 1) / total,
    note: `Request for block ${block}: straight to RAM, ${RAM_LATENCY} cycles — no cache to check.`,
  }));

  const cacheCycles = cacheFrames[cacheFrames.length - 1].cycle;
  const noCacheCycles = noCacheFrames[noCacheFrames.length - 1].cycle;

  return {
    key: "cache",
    label: "L1 Cache vs No Cache",
    question: `The same ${total}-request trace from Module 6. One CPU has an L1/L2/L3 hierarchy; the other has to round-trip to RAM on every single access.`,
    unit: "cycle",
    sides: [
      {
        label: "No Cache",
        accent: "red",
        frames: noCacheFrames,
        finalCycle: noCacheCycles,
        summary: `${noCacheCycles} cycles, flat ${RAM_LATENCY}c every access`,
      },
      {
        label: "With L1/L2/L3",
        accent: "green",
        frames: cacheFrames,
        finalCycle: cacheCycles,
        summary: `${cacheCycles} cycles, hits as cheap as 1c`,
      },
    ],
    verdict: `The cache hierarchy finishes ${(noCacheCycles / cacheCycles).toFixed(2)}x faster (${noCacheCycles} → ${cacheCycles} cycles) — modest here because a 10-request trace is mostly compulsory misses; the gap widens fast on longer, more repetitive traces.`,
  };
}

let cached: CompareScenario[] | null = null;

/** Computed once (deterministic, cheap) and reused across the page. */
export function getCompareScenarios(): CompareScenario[] {
  if (!cached) {
    cached = [buildPipelineScenario(), buildBranchScenario(), buildCacheScenario()];
  }
  return cached;
}
