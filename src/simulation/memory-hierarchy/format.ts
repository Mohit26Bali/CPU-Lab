/** Formats a raw nanosecond value into a human-readable duration string. */
export function formatNs(ns: number): string {
  if (ns < 1000) return `${trim(ns)} ns`;
  if (ns < 1_000_000) return `${trim(ns / 1000)} µs`;
  if (ns < 1_000_000_000) return `${trim(ns / 1_000_000)} ms`;
  return `${trim(ns / 1_000_000_000)} s`;
}

/** Formats a scaled-up duration (seconds) using calendar-relatable units. */
export function formatHumanScale(seconds: number): string {
  if (seconds < 1) return `${trim(seconds * 1000)} ms`;
  if (seconds < 60) return `${trim(seconds)} sec`;
  if (seconds < 3600) return `${trim(seconds / 60)} min`;
  if (seconds < 86_400) return `${trim(seconds / 3600)} hours`;
  if (seconds < 31_536_000) return `${trim(seconds / 86_400)} days`;
  return `${trim(seconds / 31_536_000)} years`;
}

function trim(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

/** log10-based bar height fraction (0-1) for visualizing values spanning 8 orders of magnitude. */
export function logScale(ns: number, minNs: number, maxNs: number): number {
  const logMin = Math.log10(minNs);
  const logMax = Math.log10(maxNs);
  return (Math.log10(ns) - logMin) / (logMax - logMin);
}
