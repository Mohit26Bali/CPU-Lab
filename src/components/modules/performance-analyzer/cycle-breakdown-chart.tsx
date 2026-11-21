import { BarChart3 } from "lucide-react";
import type { PerformanceReport } from "@/simulation/performance-analyzer/analyze";

export function CycleBreakdownChart({ report }: { report: PerformanceReport }) {
  const useful = Math.max(
    0,
    report.totalCycles - report.dataHazardCycles - report.controlHazardCycles - report.structuralHazardCycles - report.cacheMissPenaltyCycles,
  );
  const segments = [
    { label: "Useful execution", value: useful, cls: "bg-neon-green" },
    { label: "Data hazard stalls", value: report.dataHazardCycles, cls: "bg-neon-orange" },
    { label: "Control hazard flushes", value: report.controlHazardCycles, cls: "bg-neon-red" },
    { label: "Structural stalls", value: report.structuralHazardCycles, cls: "bg-neon-purple" },
    { label: "Cache miss penalty", value: report.cacheMissPenaltyCycles, cls: "bg-neon-blue" },
  ].filter((s) => s.value > 0);

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-neon-blue" />
        <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
          Where the cycles went
        </h3>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-ink/6">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.cls}
            style={{ width: `${(s.value / report.totalCycles) * 100}%` }}
            title={`${s.label}: ${s.value} cycles`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-foreground-muted">
              <span className={`h-2 w-2 rounded-full ${s.cls}`} />
              {s.label}
            </span>
            <span className="font-mono text-foreground">
              {s.value}c ({Math.round((s.value / report.totalCycles) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
