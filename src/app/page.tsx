import Link from "next/link";
import {
  Cpu,
  GitBranch,
  Layers,
  MessageCircleQuestion,
  BookOpen,
  Zap,
  Boxes,
  Sparkles,
  Play,
} from "lucide-react";
import { ModulesAccordion } from "@/components/home/modules-accordion";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";
import { BackToTop } from "@/components/home/back-to-top";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { PhotoHero } from "@/components/home/photo-hero";

const MODULES = [
  {
    number: 1,
    href: "/playground/instruction-cycle",
    title: "Instruction Cycle",
    body: "Watch one instruction move through Fetch → Decode → Execute → Memory → Writeback.",
    preview: "instruction-cycle" as const,
  },
  {
    number: 2,
    href: "/playground/pipeline",
    title: "Pipeline",
    body: "Multiple instructions overlap in flight — see the pipeline diagram fill in, cycle by cycle.",
    preview: "pipeline" as const,
  },
  {
    number: 3,
    href: "/playground/pipeline-hazards",
    title: "Pipeline Hazards",
    body: "Structural, data, and control hazards — watch the pipeline stall, bubble, and flush for real.",
    preview: "hazards" as const,
  },
  {
    number: 4,
    href: "/playground/forwarding",
    title: "Forwarding",
    body: "The same stalls from Module 3, eliminated by wiring results straight between stages.",
    preview: "forwarding" as const,
  },
  {
    number: 5,
    href: "/playground/branch-prediction",
    title: "Branch Prediction",
    body: "A real loop, four predictors — watch static guessing lose to one that actually learns.",
    preview: "branch-prediction" as const,
  },
  {
    number: 6,
    href: "/playground/cache-hierarchy",
    title: "Cache Hierarchy",
    body: "CPU → L1 → L2 → L3 → RAM — watch a request cascade through, hit green, miss red.",
    preview: "cache-hierarchy" as const,
  },
  {
    number: 7,
    href: "/playground/cache-mapping",
    title: "Cache Mapping",
    body: "Same 8 lines, same trace — direct mapping thrashes at 100% misses while set-associative hits 6/8.",
    preview: "cache-mapping" as const,
  },
  {
    number: 8,
    href: "/playground/replacement-policy",
    title: "Replacement Policies",
    body: "FIFO, LRU, and Random compete on the same trace — and LRU doesn't always win.",
    preview: "replacement-policy" as const,
  },
  {
    number: 9,
    href: "/playground/memory-hierarchy",
    title: "Memory Hierarchy",
    body: "Registers → L1 → ... → Disk, on a log scale — and what each tier would feel like at human speed.",
    preview: "memory-hierarchy" as const,
  },
  {
    number: 10,
    href: "/playground/virtual-memory",
    title: "Virtual Memory",
    body: "Virtual address → TLB → page table → physical address, with real LRU eviction and TLB thrashing.",
    preview: "virtual-memory" as const,
  },
  {
    number: 11,
    href: "/playground/out-of-order",
    title: "Out-of-Order Execution",
    body: "Reservation stations, a reorder buffer, and a real single-broadcast CDB — execute out of order, commit in order.",
    preview: "out-of-order" as const,
  },
  {
    number: 12,
    href: "/playground/superscalar",
    title: "Superscalar",
    body: "Two lanes, in order — full 2-wide issue when it's free, real structural and in-order stalls when it isn't.",
    preview: "superscalar" as const,
  },
  {
    number: 13,
    href: "/playground/simd",
    title: "SIMD",
    body: "Scalar vs vector, racing on the same data — one ADDPS instruction finishes 16 elements a real 16x faster.",
    preview: "simd" as const,
  },
  {
    number: 14,
    href: "/playground/performance-analyzer",
    title: "Performance Analyzer",
    body: "Paste your own program — real pipeline + real cache, composed into IPC, CPI, and a cycle breakdown.",
    preview: "performance-analyzer" as const,
  },
];

const MODULE_GROUPS = [
  { label: "Instruction Execution", modules: MODULES.slice(0, 5) },
  { label: "Memory & Cache", modules: MODULES.slice(5, 10) },
  { label: "Advanced Execution", modules: MODULES.slice(10, 14) },
];

const FEATURES = [
  {
    icon: Cpu,
    color: "blue" as const,
    title: "Real simulation",
    body: "Every module runs a real TypeScript simulation engine. Nothing is a canned animation.",
  },
  {
    icon: Zap,
    color: "orange" as const,
    title: "Checked, not assumed",
    body: "The engines are tested against independent reference models: sequential execution, textbook pipeline timing and from-scratch caches.",
  },
  {
    icon: Layers,
    color: "purple" as const,
    title: "Scrub the timeline",
    body: "Step cycle by cycle, jump anywhere, replay from scratch, and use the keyboard: space, arrows and Ctrl+R.",
  },
  {
    icon: GitBranch,
    color: "red" as const,
    title: "Compare mode",
    body: "Race two real configurations of the same engine: pipeline against no pipeline, naive against adaptive branch prediction, cache against no cache.",
  },
  {
    icon: BookOpen,
    color: "green" as const,
    title: "Theory beside the run",
    body: "Every module has a walkthrough tied to the program that is running, with buttons that jump the timeline to the cycle it describes.",
  },
  {
    icon: MessageCircleQuestion,
    color: "blue" as const,
    title: "AI tutor in Module 1",
    body: "Ask \"Explain this cycle\" and get an answer about exactly what just changed. It needs an API key and is optional.",
  },
];

const ICON_BG: Record<string, string> = {
  blue: "bg-neon-blue/12 text-neon-blue",
  purple: "bg-neon-purple/12 text-neon-purple",
  orange: "bg-neon-orange/12 text-neon-orange",
  green: "bg-neon-green/12 text-neon-green",
  red: "bg-neon-red/12 text-neon-red",
};

const STATS = [
  { icon: Boxes, label: "14 modules" },
  { icon: Cpu, label: "Real simulation engines" },
  { icon: Sparkles, label: "Open the Compare page" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 flex-col py-10">
        <div className="mx-auto w-full max-w-6xl px-6">
          <PhotoHero>
            <div className="hero-text flex max-w-xl flex-col gap-5">
              <span className="datasheet-label w-fit rounded-sm border border-neon-blue bg-neon-blue/10 px-3 py-1 text-neon-blue">
                Computer architecture, visually
              </span>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">CPU Lab</h1>
              <p className="text-balance text-base text-foreground sm:text-lg">
                Step inside a modern processor. Watch instructions flow through pipelines, caches, branch predictors
                and execution units, one clock cycle at a time.
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link
                  href="/playground/instruction-cycle"
                  className="flex items-center gap-2 rounded-md bg-neon-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Play size={15} fill="currentColor" />
                  Start the first simulation
                </Link>
                <a
                  href="#modules"
                  className="flex items-center gap-2 rounded-md border border-ink/50 bg-background/70 px-5 py-2.5 text-sm font-medium transition hover:border-ink"
                >
                  Explore the 14 modules
                </a>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2">
                {STATS.map(({ icon: Icon, label }) => (
                  <span key={label} className="datasheet-label flex items-center gap-1.5 text-foreground">
                    <Icon size={13} className="text-neon-blue" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </PhotoHero>
        </div>

        <div
          id="modules"
          className="mx-auto mt-28 w-full max-w-6xl scroll-mt-20 border-t border-glass-border px-6 pt-16 sm:mt-32"
        >
          <ScrollReveal className="mb-6 flex flex-col gap-2">
            <h2 className="datasheet-label text-neon-blue">1 · Modules</h2>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Fourteen modules, each one a real simulator — the instruction cycle up through
              out-of-order execution, superscalar issue, SIMD, and a performance analyzer that
              runs your own code through them.
            </p>
          </ScrollReveal>
          <ModulesAccordion groups={MODULE_GROUPS} />
        </div>

        <div
          id="features"
          className="mx-auto mt-24 w-full max-w-6xl scroll-mt-20 border-t border-glass-border px-6 pt-16"
        >
          <ScrollReveal className="mb-6 flex flex-col gap-2">
            <h2 className="datasheet-label text-neon-blue">2 · Why CPU Lab</h2>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Built like an engineering tool, not a slideshow, because the CPU underneath is a real model.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, color }, i) => (
              <ScrollReveal key={title} delay={Math.min(i, 6) * 0.04}>
                <div className="glass flex h-full flex-col gap-3 p-5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ICON_BG[color]}`}>
                    <Icon size={18} />
                  </span>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-foreground-muted">{body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
