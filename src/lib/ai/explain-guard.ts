// Input validation and rate limiting for the optional "Explain this cycle" AI route.
// Pure functions (no Next.js imports) so they are easy to test.

import type { ExplainCycleRequest } from "./explain-cycle";

export const LIMITS = {
  body: 8 * 1024,
  module: 80,
  instruction: 80,
  explanation: 800,
} as const;

export type ParseResult = { ok: true; value: ExplainCycleRequest } | { ok: false; error: string };

const STAGES = new Set(["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"]);
const REGISTER = /^R[0-7]$/;

// strips control characters so nothing can disturb the prompt layout
function clean(v: string, max: number): string {
  return v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function text(v: unknown, max: number, field: string): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof v !== "string") return { ok: false, error: `${field} must be text` };
  const t = clean(v, max);
  if (!t) return { ok: false, error: `${field} must not be empty` };
  return { ok: true, value: t };
}

export function parseExplainRequest(body: unknown): ParseResult {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object" };

  const moduleName = text(body.module, LIMITS.module, "module");
  if (!moduleName.ok) return moduleName;
  const explanation = text(body.explanation, LIMITS.explanation, "explanation");
  if (!explanation.ok) return explanation;

  const cycle = body.cycle;
  if (typeof cycle !== "number" || !Number.isInteger(cycle) || cycle < 1 || cycle > 100_000) {
    return { ok: false, error: "cycle must be a whole number" };
  }

  let instruction: string | null = null;
  if (body.instruction !== null && body.instruction !== undefined) {
    const t = text(body.instruction, LIMITS.instruction, "instruction");
    if (!t.ok) return t;
    instruction = t.value;
  }

  let stage: string | null = null;
  if (body.stage !== null && body.stage !== undefined) {
    if (typeof body.stage !== "string" || !STAGES.has(body.stage)) return { ok: false, error: "stage is not a pipeline stage" };
    stage = body.stage;
  }

  if (!Array.isArray(body.registersChanged) || body.registersChanged.length > 8) {
    return { ok: false, error: "registersChanged must be a short list" };
  }
  const registersChanged: string[] = [];
  for (const r of body.registersChanged) {
    if (typeof r !== "string" || !REGISTER.test(r)) return { ok: false, error: "registersChanged holds registers R0 to R7" };
    registersChanged.push(r);
  }

  if (!isObject(body.registers)) return { ok: false, error: "registers must be an object" };
  const registers: Record<string, number> = {};
  const entries = Object.entries(body.registers);
  if (entries.length > 8) return { ok: false, error: "too many registers" };
  for (const [name, value] of entries) {
    if (!REGISTER.test(name) || typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1e12) {
      return { ok: false, error: "registers must map R0 to R7 to numbers" };
    }
    registers[name] = value;
  }

  let previousExplanation: string | null = null;
  if (body.previousExplanation !== null && body.previousExplanation !== undefined) {
    const t = text(body.previousExplanation, LIMITS.explanation, "previousExplanation");
    if (!t.ok) return t;
    previousExplanation = t.value;
  }

  return {
    ok: true,
    value: { module: moduleName.value, cycle, instruction, stage, explanation: explanation.value, registersChanged, registers, previousExplanation },
  };
}

/** Fixed-window counter per key. Memory is bounded: old windows are swept. */
export class RateLimiter {
  private hits = new Map<string, { start: number; count: number }>();
  constructor(
    private max: number,
    private windowMs: number,
    private maxKeys = 5000,
  ) {}

  /** Returns 0 when allowed, otherwise the seconds to wait. */
  check(key: string, now = Date.now()): number {
    if (this.hits.size >= this.maxKeys) {
      for (const [k, v] of this.hits) if (now - v.start >= this.windowMs) this.hits.delete(k);
      if (this.hits.size >= this.maxKeys) this.hits.clear();
    }
    const cur = this.hits.get(key);
    if (!cur || now - cur.start >= this.windowMs) {
      this.hits.set(key, { start: now, count: 1 });
      return 0;
    }
    if (cur.count >= this.max) return Math.max(1, Math.ceil((cur.start + this.windowMs - now) / 1000));
    cur.count += 1;
    return 0;
  }
}

/**
 * Client address from X-Forwarded-For, trusting only `hops` proxies in front of the app
 * (0 = ignore the header entirely, as when the server is exposed directly).
 */
export function clientKey(forwardedFor: string | null, hops: number): string {
  if (hops <= 0 || !forwardedFor) return "direct";
  const parts = forwardedFor
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "direct";
  const idx = Math.max(0, parts.length - hops);
  return parts[idx].slice(0, 64);
}
