import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { BaseCycleSnapshot, SimulationEngine } from "@/types/simulation";

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

const BASE_MS_PER_CYCLE = 900;
const MAX_CYCLES_SAFEGUARD = 2000;

export interface PlaybackState<TState extends BaseCycleSnapshot> {
  history: TState[];
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  current: TState | null;
  msPerCycle: number;

  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToCycle: (cycle: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  loadProgram: (program: unknown) => void;
}

/**
 * The one Playback Engine every module uses. Given a SimulationEngine, it
 * eagerly runs the simulation to completion (simulators here are cheap and
 * deterministic) so the timeline can be scrubbed freely, then exposes
 * play/pause/step/jump controls over the precomputed cycle history.
 */
export function createPlaybackStore<TState extends BaseCycleSnapshot, TProgram>(
  engine: SimulationEngine<TState, TProgram>,
  initialProgram: TProgram,
): UseBoundStore<StoreApi<PlaybackState<TState>>> {
  function runFullHistory(program: TProgram): TState[] {
    engine.initialize(program);
    const snapshots: TState[] = [];
    let guard = 0;
    while (guard < MAX_CYCLES_SAFEGUARD) {
      const snapshot = engine.tick();
      snapshots.push(snapshot);
      guard += 1;
      if (snapshot.isFinal) break;
    }
    return snapshots;
  }

  const initialHistory = runFullHistory(initialProgram);

  return create<PlaybackState<TState>>((set, get) => ({
    history: initialHistory,
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    current: initialHistory[0] ?? null,
    msPerCycle: BASE_MS_PER_CYCLE,

    play: () => {
      const { currentIndex, history } = get();
      if (currentIndex >= history.length - 1) {
        set({ currentIndex: 0, current: history[0] ?? null });
      }
      set({ isPlaying: true });
    },
    pause: () => set({ isPlaying: false }),
    toggle: () => (get().isPlaying ? get().pause() : get().play()),

    stepForward: () =>
      set((state) => {
        const nextIndex = Math.min(state.currentIndex + 1, state.history.length - 1);
        const atEnd = nextIndex === state.history.length - 1;
        return {
          currentIndex: nextIndex,
          current: state.history[nextIndex] ?? null,
          isPlaying: atEnd ? false : state.isPlaying,
        };
      }),
    stepBackward: () =>
      set((state) => {
        const nextIndex = Math.max(state.currentIndex - 1, 0);
        return { currentIndex: nextIndex, current: state.history[nextIndex] ?? null, isPlaying: false };
      }),

    jumpToCycle: (cycle: number) =>
      set((state) => {
        const nextIndex = Math.min(Math.max(cycle - 1, 0), state.history.length - 1);
        return { currentIndex: nextIndex, current: state.history[nextIndex] ?? null };
      }),

    setSpeed: (speed: PlaybackSpeed) => set({ speed }),

    loadProgram: (program: unknown) => {
      const history = runFullHistory(program as TProgram);
      set({ history, currentIndex: 0, current: history[0] ?? null, isPlaying: false });
    },
  }));
}
