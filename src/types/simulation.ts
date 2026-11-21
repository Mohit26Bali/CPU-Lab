/**
 * Shared contracts every simulation engine (and only simulation engines)
 * implement. No React / DOM types allowed in this file or in `src/simulation/**`.
 */

export type Stage = "FETCH" | "DECODE" | "EXECUTE" | "MEMORY" | "WRITEBACK";

export interface SimEvent {
  /** Machine-readable kind, e.g. "register-write", "pc-update", "hazard". */
  kind: string;
  /** Human-readable, one sentence. Answers "what changed this cycle?" */
  message: string;
}

/**
 * Base shape every module's per-cycle snapshot extends. The Playback Engine
 * and CPU Inspector only rely on these fields; module-specific fields live
 * on the extended snapshot type.
 */
export interface BaseCycleSnapshot {
  cycle: number;
  events: SimEvent[];
  explanation: string;
  isFinal: boolean;
}

/**
 * Contract every simulation engine module must expose. Pure TypeScript,
 * no framework dependencies, so it can run and be tested outside React.
 */
export interface SimulationEngine<TState extends BaseCycleSnapshot, TProgram> {
  initialize(program: TProgram): void;
  tick(): TState;
  reset(): void;
  getState(): TState;
  getHistory(): TState[];
  jumpToCycle(cycle: number): TState;
}
