import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Database,
  Binary,
  Sigma,
  MemoryStick,
  CheckCircle2,
  Hourglass,
  Check,
  X,
  Cpu,
} from "lucide-react";

const STAGE_ICONS = [Database, Binary, Sigma, MemoryStick, CheckCircle2];

function InstructionCyclePreview() {
  return (
    <div className="flex items-center gap-1.5">
      {STAGE_ICONS.map((Icon, i) => (
        <div
          key={i}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-blue/30 bg-neon-blue/10"
        >
          <Icon size={14} className="text-neon-blue" />
        </div>
      ))}
    </div>
  );
}

const PIPELINE_ROWS = [
  [0],
  [1, 0],
  [2, 1, 0],
  [3, 2, 1],
  [4, 3, 2],
];
const CHIP_COLOR = ["bg-neon-blue", "bg-neon-purple", "bg-neon-orange", "bg-neon-green", "bg-neon-red"];

function PipelinePreview() {
  return (
    <div className="flex flex-col gap-1">
      {PIPELINE_ROWS.map((row, r) => (
        <div key={r} className="flex gap-1.5">
          {Array.from({ length: 5 }, (_, col) => {
            const instr = row[col];
            return (
              <div
                key={col}
                className={`h-3 w-3 rounded-sm ${
                  instr !== undefined ? CHIP_COLOR[instr % CHIP_COLOR.length] : "bg-ink/[0.07]"
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HazardsPreview() {
  return (
    <div className="flex items-center gap-1.5">
      {["bg-neon-blue", "bg-neon-purple", null, "bg-neon-green", "bg-neon-red"].map((cls, i) =>
        cls ? (
          <div key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
        ) : (
          <div
            key={i}
            className="flex h-4 w-4 -translate-y-0.5 items-center justify-center rounded-full border border-neon-orange/50 bg-neon-orange/15"
          >
            <Hourglass size={9} className="text-neon-orange" />
          </div>
        ),
      )}
    </div>
  );
}

function ForwardingPreview() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-4 w-4 rounded-sm bg-neon-blue" />
      <div className="h-4 w-4 rounded-sm bg-neon-purple" />
      <div className="glow-purple flex items-center gap-0.5 rounded-full border border-neon-purple/50 bg-neon-purple/15 px-1.5 py-0.5">
        <ArrowLeft size={9} className="text-neon-purple" />
      </div>
      <div className="h-4 w-4 rounded-sm bg-ink/6" />
      <div className="h-4 w-4 rounded-sm bg-ink/6" />
    </div>
  );
}

function BranchPredictionPreview() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 rounded-full border border-neon-green/50 bg-neon-green/15 px-1.5 py-0.5">
        <Check size={9} className="text-neon-green" />
      </div>
      <div className="flex items-center gap-0.5 rounded-full border border-neon-red/50 bg-neon-red/15 px-1.5 py-0.5">
        <X size={9} className="text-neon-red" />
      </div>
      <div className="glow-green flex items-center gap-0.5 rounded-full border border-neon-green/50 bg-neon-green/15 px-1.5 py-0.5">
        <Check size={9} className="text-neon-green" />
      </div>
      <div className="glow-green flex items-center gap-0.5 rounded-full border border-neon-green/50 bg-neon-green/15 px-1.5 py-0.5">
        <Check size={9} className="text-neon-green" />
      </div>
    </div>
  );
}

function CacheHierarchyPreview() {
  return (
    <div className="flex items-center gap-1">
      <Cpu size={14} className="text-neon-purple" />
      <div className="h-px w-2 bg-neon-blue" />
      {[
        { label: "L1", cls: "border-neon-green/50 bg-neon-green/15 text-neon-green" },
        { label: "L2", cls: "border-glass-border bg-ink/[0.05] text-foreground-muted" },
        { label: "L3", cls: "border-glass-border bg-ink/[0.05] text-foreground-muted" },
        { label: "RAM", cls: "border-neon-red/50 bg-neon-red/15 text-neon-red" },
      ].map((n, i) => (
        <div key={i} className={`rounded border px-1.5 py-0.5 text-[8px] font-medium ${n.cls}`}>
          {n.label}
        </div>
      ))}
    </div>
  );
}

function CacheMappingPreview() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-0.5">
        <div className="h-2 w-2 rounded-sm bg-neon-purple" />
        <div className="h-2 w-2 rounded-sm bg-neon-blue" />
        <div className="h-2 w-2 rounded-sm bg-neon-orange" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-2 w-8 rounded-sm bg-neon-red/40" />
        <div className="h-2 w-8 rounded-sm bg-neon-green/40" />
      </div>
    </div>
  );
}

function ReplacementPolicyPreview() {
  return (
    <div className="flex items-center gap-1.5">
      {[
        { cls: "bg-neon-blue" },
        { cls: "bg-neon-purple" },
        { cls: "bg-ink/10", fading: true },
        { cls: "bg-neon-green" },
      ].map((n, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-sm ${n.cls} ${n.fading ? "border border-dashed border-neon-red/50" : ""}`}
        />
      ))}
    </div>
  );
}

function MemoryHierarchyPreview() {
  const heights = [3, 5, 7, 9, 12, 18, 24];
  return (
    <div className="flex h-6 items-end gap-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-t-sm ${["bg-neon-blue", "bg-neon-purple", "bg-neon-orange", "bg-neon-green", "bg-neon-red"][i % 5]}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function VirtualMemoryPreview() {
  return (
    <div className="flex items-center gap-1 font-mono text-[8px]">
      <span className="rounded border border-neon-purple/50 bg-neon-purple/15 px-1 py-0.5 text-neon-purple">
        VPN
      </span>
      <ArrowRight size={9} className="text-foreground-muted" />
      <span className="rounded border border-neon-green/50 bg-neon-green/15 px-1 py-0.5 text-neon-green">
        TLB
      </span>
      <ArrowRight size={9} className="text-foreground-muted" />
      <span className="rounded border border-neon-blue/50 bg-neon-blue/15 px-1 py-0.5 text-neon-blue">
        PFN
      </span>
    </div>
  );
}

function OutOfOrderPreview() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-col gap-0.5">
        <div className="h-2 w-3 rounded-sm bg-neon-green" />
        <div className="h-2 w-3 rounded-sm bg-neon-blue" />
      </div>
      <div className="h-4 w-px bg-glass-border" />
      <div className="flex flex-col gap-0.5">
        <div className="h-2 w-3 rounded-sm bg-neon-blue" />
        <div className="h-2 w-3 rounded-sm border border-dashed border-neon-orange/50" />
      </div>
    </div>
  );
}

function SimdPreview() {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-2 w-4 rounded-sm bg-neon-blue" />
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2 w-2 rounded-sm bg-neon-green" />
        ))}
      </div>
    </div>
  );
}

function SuperscalarPreview() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <div className="h-2 w-4 rounded-sm bg-neon-green" />
        <div className="h-2 w-4 rounded-sm bg-neon-green" />
      </div>
      <div className="flex gap-1">
        <div className="h-2 w-4 rounded-sm bg-neon-orange" />
        <div className="h-2 w-4 rounded-sm border border-dashed border-neon-orange/50" />
      </div>
    </div>
  );
}

function PerformanceAnalyzerPreview() {
  return (
    <div className="flex items-end gap-1">
      {[6, 10, 4, 14, 8].map((h, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-t-sm ${["bg-neon-green", "bg-neon-orange", "bg-neon-red", "bg-neon-blue", "bg-neon-purple"][i]}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export function ModuleCard({
  href,
  number,
  title,
  body,
  preview,
}: {
  href: string;
  number: number;
  title: string;
  body: string;
  preview:
    | "instruction-cycle"
    | "pipeline"
    | "hazards"
    | "forwarding"
    | "branch-prediction"
    | "cache-hierarchy"
    | "cache-mapping"
    | "replacement-policy"
    | "memory-hierarchy"
    | "virtual-memory"
    | "out-of-order"
    | "superscalar"
    | "simd"
    | "performance-analyzer";
}) {
  return (
    <Link
      href={href}
      className="glass group flex flex-col gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-neon-blue/40 hover:shadow-[0_8px_30px_rgba(62,166,255,0.12)]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-foreground-muted">Module {number}</span>
        <ArrowRight
          size={16}
          className="text-foreground-muted transition group-hover:translate-x-0.5 group-hover:text-neon-blue"
        />
      </div>
      {preview === "instruction-cycle" && <InstructionCyclePreview />}
      {preview === "pipeline" && <PipelinePreview />}
      {preview === "hazards" && <HazardsPreview />}
      {preview === "forwarding" && <ForwardingPreview />}
      {preview === "branch-prediction" && <BranchPredictionPreview />}
      {preview === "cache-hierarchy" && <CacheHierarchyPreview />}
      {preview === "cache-mapping" && <CacheMappingPreview />}
      {preview === "replacement-policy" && <ReplacementPolicyPreview />}
      {preview === "memory-hierarchy" && <MemoryHierarchyPreview />}
      {preview === "virtual-memory" && <VirtualMemoryPreview />}
      {preview === "out-of-order" && <OutOfOrderPreview />}
      {preview === "superscalar" && <SuperscalarPreview />}
      {preview === "simd" && <SimdPreview />}
      {preview === "performance-analyzer" && <PerformanceAnalyzerPreview />}
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{body}</p>
      </div>
    </Link>
  );
}
