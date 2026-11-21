/**
 * Branch predictors, keyed by branch instruction index (equivalent to
 * indexing by PC — this ISA has no function calls, so each branch site has
 * exactly one static index). Each predictor is a pure strategy object with
 * no knowledge of the pipeline; the engine calls predict() before Fetch
 * decides where to go next, and update() once Execute learns the truth.
 */

export type PredictorKind = "always-taken" | "always-not-taken" | "one-bit" | "two-bit";

export interface Predictor {
  kind: PredictorKind;
  predict(branchIndex: number): boolean;
  update(branchIndex: number, actualTaken: boolean): void;
  /** Human-readable current state for a branch site, for the predictor table. */
  describe(branchIndex: number): string;
}

export function createPredictor(kind: PredictorKind): Predictor {
  switch (kind) {
    case "always-taken":
      return {
        kind,
        predict: () => true,
        update: () => {},
        describe: () => "always predicts taken",
      };
    case "always-not-taken":
      return {
        kind,
        predict: () => false,
        update: () => {},
        describe: () => "always predicts not-taken",
      };
    case "one-bit": {
      const state = new Map<number, boolean>();
      return {
        kind,
        predict: (i) => state.get(i) ?? false,
        update: (i, taken) => state.set(i, taken),
        describe: (i) => (state.has(i) ? (state.get(i) ? "last: taken" : "last: not-taken") : "no history yet"),
      };
    }
    case "two-bit": {
      // 0=strongly not-taken, 1=weakly not-taken, 2=weakly taken, 3=strongly taken
      const state = new Map<number, number>();
      const get = (i: number) => state.get(i) ?? 1;
      const labels = ["strongly not-taken", "weakly not-taken", "weakly taken", "strongly taken"];
      return {
        kind,
        predict: (i) => get(i) >= 2,
        update: (i, taken) => {
          const cur = get(i);
          state.set(i, taken ? Math.min(3, cur + 1) : Math.max(0, cur - 1));
        },
        describe: (i) => labels[get(i)],
      };
    }
  }
}

export const PREDICTOR_LABELS: Record<PredictorKind, string> = {
  "always-taken": "Always Taken",
  "always-not-taken": "Always Not Taken",
  "one-bit": "1-Bit",
  "two-bit": "2-Bit Saturating",
};
