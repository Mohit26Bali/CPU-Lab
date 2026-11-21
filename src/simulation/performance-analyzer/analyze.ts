import type { Instruction, Operand } from "@/simulation/pipeline-hazards/isa";
import type { HazardSnapshot } from "@/simulation/pipeline-hazards/engine";
import { CacheHierarchyEngine } from "@/simulation/cache-hierarchy/engine";
import type { CacheLevelName } from "@/simulation/cache-hierarchy/engine";

export interface MemoryAccess {
  cycle: number;
  instrIndex: number;
  raw: string;
  address: number;
  hitLevel: CacheLevelName | "RAM";
  hit: boolean;
  latency: number;
}

export interface PerformanceReport {
  totalCycles: number;
  instructionsCommitted: number;
  ipc: number;
  cpi: number;
  dataHazardCycles: number;
  controlHazardCycles: number;
  structuralHazardCycles: number;
  cacheMissPenaltyCycles: number;
  baselineCycles: number;
  memoryAccesses: MemoryAccess[];
  cacheHitRate: number;
  branchCount: number;
  branchMispredictions: number;
  branchAccuracy: number | null;
  /** True when the program never finished within the cycle limit (for example an endless loop). */
  truncated: boolean;
}

function literalAddress(instr: Instruction): number | undefined {
  const opAddr = (op: Operand | undefined) => (op?.kind === "address" ? op.value : undefined);
  return opAddr(instr.dest) ?? opAddr(instr.src1);
}

/**
 * Combines two already-verified engines rather than building a third,
 * unified one: the real pipeline (Module 3) gives cycle count and hazard
 * costs; the real cache hierarchy (Module 6) gives per-access hit/miss for
 * every LOAD/STORE the pipeline *actually executed* (not just each static
 * instruction once — a looping LOAD is scanned once per dynamic iteration).
 */
export function analyzeProgram(instructions: Instruction[], history: HazardSnapshot[]): PerformanceReport {
  const realCycles = history.filter((h) => !h.isFinal);
  const last = realCycles[realCycles.length - 1];
  const truncated = history.length > 0 && !history[history.length - 1].isFinal;
  const baselineCycles = last?.cycle ?? 0;
  const hazardLog = last?.hazardLog ?? [];

  const dataHazardCycles = hazardLog.filter((h) => h.type === "data").reduce((s, h) => s + h.cyclesLost, 0);
  const controlHazardCycles = hazardLog.filter((h) => h.type === "control").reduce((s, h) => s + h.cyclesLost, 0);
  const structuralHazardCycles = hazardLog
    .filter((h) => h.type === "structural")
    .reduce((s, h) => s + h.cyclesLost, 0);

  const dynamicMemoryOps: { cycle: number; instrIndex: number; raw: string; address: number }[] = [];
  let branchCount = 0;
  for (const snap of realCycles) {
    const mem = snap.occupancy.MEMORY;
    if (mem) {
      const instr = instructions[mem.instructionIndex];
      if (instr.opcode === "LOAD" || instr.opcode === "STORE") {
        const address = literalAddress(instr) ?? 0;
        dynamicMemoryOps.push({ cycle: snap.cycle, instrIndex: mem.instructionIndex, raw: mem.raw, address });
      }
    }
    const ex = snap.occupancy.EXECUTE;
    if (ex && instructions[ex.instructionIndex].opcode === "BEQ") branchCount += 1;
  }

  const cacheEngine = new CacheHierarchyEngine();
  cacheEngine.initialize(dynamicMemoryOps.map((op) => op.address));
  const memoryAccesses: MemoryAccess[] = [];
  let cacheMissPenaltyCycles = 0;
  for (const op of dynamicMemoryOps) {
    const snap = cacheEngine.tick();
    const hit = snap.hitLevel === "L1";
    memoryAccesses.push({
      cycle: op.cycle,
      instrIndex: op.instrIndex,
      raw: op.raw,
      address: op.address,
      hitLevel: snap.hitLevel!,
      hit,
      latency: snap.requestLatency,
    });
    // The pipeline already charged 1 cycle for this Memory stage; only the extra cost counts.
    cacheMissPenaltyCycles += Math.max(0, snap.requestLatency - 1);
  }

  const totalCycles = baselineCycles + cacheMissPenaltyCycles;
  // Instructions that actually ran, counting every pass through a loop (not the number of lines in the program).
  const instructionsCommitted = last?.instructionsCompleted ?? 0;
  const ipc = totalCycles > 0 ? instructionsCommitted / totalCycles : 0;
  const cpi = instructionsCommitted > 0 ? totalCycles / instructionsCommitted : 0;
  const cacheHits = memoryAccesses.filter((a) => a.hit).length;
  const cacheHitRate = memoryAccesses.length > 0 ? cacheHits / memoryAccesses.length : 0;
  const branchMispredictions = hazardLog.filter((h) => h.type === "control").length;
  const branchAccuracy = branchCount > 0 ? 1 - branchMispredictions / branchCount : null;

  return {
    totalCycles,
    instructionsCommitted,
    ipc,
    cpi,
    dataHazardCycles,
    controlHazardCycles,
    structuralHazardCycles,
    cacheMissPenaltyCycles,
    baselineCycles,
    memoryAccesses,
    cacheHitRate,
    branchCount,
    branchMispredictions,
    branchAccuracy,
    truncated,
  };
}
