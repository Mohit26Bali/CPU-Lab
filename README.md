# CPU Lab

**Learn how modern processors actually execute code.**

CPU Lab is an interactive, cycle-accurate simulator for computer architecture. It isn't a collection of pre-rendered animations — every module is backed by a real TypeScript simulation engine, and every frame you see corresponds to one real state transition inside that engine. If something moves, glows, stalls, or flushes on screen, it's because the simulator actually computed that it should.

Fourteen modules take you from a single instruction moving through Fetch → Decode → Execute → Memory → Writeback, up through pipelining, hazards, forwarding, branch prediction, the full cache/memory hierarchy, virtual memory, out-of-order execution, superscalar issue, SIMD, and a performance analyzer that runs your own assembly through a composed pipeline + cache model.

---

## Philosophy

> Never animate something that didn't happen.

Every module exposes the same simulation contract — `initialize / tick / reset / getState / getHistory / jumpToCycle` — and every visual is driven directly off the returned state. There is exactly one shared Playback Engine (play / pause / step / scrub / speed), reused by every module, so scrubbing to cycle 7 always shows you *exactly* what the simulator computed cycle 7 to be, not an approximation of it.

## Features

- **14 real simulation engines** — instruction cycle, pipeline, hazards, forwarding, branch prediction, cache hierarchy, cache mapping, replacement policies, memory hierarchy, virtual memory, out-of-order execution, superscalar, SIMD, and a performance analyzer.
- **One shared Playback Engine** — every module scrubs, steps, and replays the same way. Keyboard shortcuts: `Space` play/pause, `←`/`→` step, `Ctrl+R` replay.
- **A persistent CPU Inspector** on every module — registers, memory, cache state, hazard/prediction logs, all reading live off the current cycle.
- **AI Tutor** — "Explain this cycle" sends only the current cycle's diff (not the whole CPU state) to an LLM, so the explanation stays scoped to what actually changed.
- **Compare Mode** (`/compare`) — runs two configurations of the *same* real engine side by side (Pipeline vs No Pipeline, Branch Prediction naive vs adaptive, Cache vs No Cache) so the payoff of each technique is something you watch happen, not a number in a caption.
- **Theory panels** — every module has a "?" that opens a walkthrough tied to the actual program running in the simulator, with "Watch cycle N" buttons that jump the live playback there.
- A "Datasheet" look: warm paper, black ink, a blue-ink accent and hairline rules, with reduced-motion support and a layout that works on phones.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, CSS variables, Radix UI primitives |
| Animation | Framer Motion |
| State | Zustand (one generic Playback Engine store factory, reused per module) |
| Simulation | Pure TypeScript, framework-agnostic — no React inside `src/simulation/**` |
| AI Tutor | Groq (`groq-sdk`), `openai/gpt-oss-120b`, called from a server route |

## Getting Started

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local      # optional: only the AI tutor needs a key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build and server |
| `npm run lint` | ESLint |

### Environment variables

The AI tutor ("Explain this cycle", Module 1) calls Groq from a server route. Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | for the AI tutor | Groq key, read only on the server (never use a `NEXT_PUBLIC_` name for it) |
| `GROQ_MODEL` | no | override the model (default `openai/gpt-oss-120b`) |
| `EXPLAIN_RATE_PER_MIN`, `EXPLAIN_GLOBAL_PER_MIN` | no | per-visitor and global request limits |
| `TRUSTED_PROXY_HOPS` | no | reverse proxies in front of the app (Vercel: `1`), so the limiter sees real visitor addresses |

Without a key the button shows a clear "GROQ_API_KEY is not set" message. Everything else works without any configuration.

## Modules

| # | Module | Route | What it actually shows |
| --- | --- | --- | --- |
| 1 | Instruction Cycle | `/playground/instruction-cycle` | One instruction moving through Fetch → Decode → Execute → Memory → Writeback |
| 2 | Pipeline | `/playground/pipeline` | Multiple instructions overlapping in flight — the pipeline diagram filling in, cycle by cycle |
| 3 | Pipeline Hazards | `/playground/pipeline-hazards` | Structural, data, and control hazards — real stalls, bubbles, and flushes |
| 4 | Forwarding | `/playground/forwarding` | The same stalls from Module 3, eliminated by wiring results straight between stages |
| 5 | Branch Prediction | `/playground/branch-prediction` | A real backward-branching loop, four predictors — static guessing loses to one that learns |
| 6 | Cache Hierarchy | `/playground/cache-hierarchy` | CPU → L1 → L2 → L3 → RAM — a request cascading through, hit green, miss red |
| 7 | Cache Mapping | `/playground/cache-mapping` | Direct-mapped vs set-associative vs fully associative, same trace, same line budget |
| 8 | Replacement Policies | `/playground/replacement-policy` | FIFO, LRU, and Random competing on the same trace — LRU doesn't always win |
| 9 | Memory Hierarchy | `/playground/memory-hierarchy` | Registers → L1 → … → Disk on a log scale, plus what each tier would feel like at human speed |
| 10 | Virtual Memory | `/playground/virtual-memory` | Virtual address → TLB → page table → physical address, with real LRU eviction and TLB thrashing |
| 11 | Out-of-Order Execution | `/playground/out-of-order` | Reservation stations, a reorder buffer, a single-broadcast CDB — execute out of order, commit in order |
| 12 | Superscalar | `/playground/superscalar` | Two lanes, in order — full 2-wide issue when it's free, real structural/in-order stalls when it isn't |
| 13 | SIMD | `/playground/simd` | Scalar vs vector racing on the same data — one `ADDPS` instruction finishing 16 elements at once |
| 14 | Performance Analyzer | `/playground/performance-analyzer` | Paste your own program — real pipeline + real cache, composed into IPC, CPI, and a cycle breakdown |

Every module reuses the same ISA (`MOV / ADD / SUB / LOAD / STORE / BEQ`) where applicable, so programs written for one module's playground can often be reused in another (notably Module 14's code editor).

## Project Structure

```text
src/
  app/                    Next.js routes (App Router)
    playground/<module>/  One route per module
    compare/               Compare Mode
    api/ai/explain/        AI Tutor server route (Groq)
  simulation/             Framework-agnostic simulation engines, one folder per module
    <module>/
      engine.ts            The SimulationEngine implementation
      isa.ts                (where applicable) instruction parsing
      store.ts              Zustand store built from the shared Playback Engine factory
      data.ts / format.ts   (where applicable) reference data + formatting helpers
    compare/                Cross-module comparison data (reuses other modules' engines)
  components/
    modules/<module>/       Module-specific visuals
    inspector/               Per-module CPU Inspector panels
    playback/                 Shared PlaybackControls
    theory/                    Shared TheoryDialog / TheorySection
    home/                       Landing page pieces
    compare/                     Compare Mode UI
  lib/
    playback/                 createPlaybackStore — the one shared Playback Engine factory
    ai/                         AI Tutor prompt construction
    chip-colors.ts              Consistent per-instruction color palette
  hooks/                    usePlaybackClock, usePlaybackShortcuts
  types/                    Shared simulation contracts (SimulationEngine, BaseCycleSnapshot)
```

### The simulation contract

Every engine in `src/simulation/**` implements:

```ts
interface SimulationEngine<TState extends BaseCycleSnapshot, TProgram> {
  initialize(program: TProgram): void;
  tick(): TState;
  reset(): void;
  getState(): TState;
  getHistory(): TState[];
  jumpToCycle(cycle: number): TState;
}
```

No React, no DOM, no framework imports — these are plain classes, testable and runnable in isolation (which is how every engine in this project was verified: with small standalone Node scripts run via `tsx` before any UI was built on top of them).

`createPlaybackStore` (`src/lib/playback/create-playback-store.ts`) wraps any such engine in a Zustand store that eagerly runs the simulation to completion and exposes `play / pause / stepForward / stepBackward / jumpToCycle / setSpeed`. Every module's page just points the shared `PlaybackControls` and `CpuInspector`-style components at its own store instance.

## Quality, security and design

- **Engines are checked against independent models.** The pipeline, hazard, forwarding, branch-prediction, superscalar and out-of-order engines are compared with a plain sequential interpreter on thousands of random programs (same final registers and memory). Pipeline timing is compared with a separate scheduling formula, and the cache, replacement, TLB and hierarchy engines with from-scratch reference caches. This caught and fixed five real bugs: the first module's `STORE` wrote to the wrong address, the 2-wide superscalar engine could let a younger instruction pass an older one, the out-of-order engine could load stale data past an older store to the same address, replacement-policy `reset()` forgot its random seed, and the analyzer's CPI used the static instruction count instead of the instructions that really ran.
- **Typed programs are validated.** The Performance Analyzer's editor rejects bad input with the line number and a plain message (unknown instruction, wrong operand, number out of range, address outside memory, a branch that jumps outside the program), and limits programs to 64 instructions. An endless loop is reported as cut short instead of pretending it finished.
- **AI route hardening.** `/api/ai/explain` checks same-origin, content type and a size cap, validates every field, rate-limits per visitor, caps the model's output and never forwards provider error text to the browser.
- **Security headers.** A Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options: DENY`, Referrer-Policy and Permissions-Policy are set in `next.config.ts`.
- **Accessibility.** Text meets WCAG AA contrast on every page, there are visible focus outlines, controls have accessible names, and reduced-motion is honoured (the hero photo carousel shows one still photo).
- **Design.** The "Datasheet" theme is defined by tokens in `src/app/globals.css`. The home page photos are from [Pexels](https://www.pexels.com) and are credited in the footer.

## Known limitations

- It is a teaching model, not a real CPU: a tiny instruction set (`MOV / ADD / SUB / LOAD / STORE / BEQ`), 16 words of memory, and simplified timing such as a 1-cycle branch penalty. The README's "cycle-accurate" means every cycle of the model is simulated, not that it reproduces a specific commercial processor.
- Only the Performance Analyzer accepts a typed program; the other modules run fixed demonstration programs.
- The "Explain this cycle" tutor is available in Module 1 only.
