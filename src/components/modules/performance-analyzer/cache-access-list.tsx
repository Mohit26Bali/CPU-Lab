import { Check, X } from "lucide-react";
import type { PerformanceReport } from "@/simulation/performance-analyzer/analyze";

export function CacheAccessList({ report }: { report: PerformanceReport }) {
  return (
    <div className="glass flex h-full flex-col gap-2 overflow-y-auto p-4">
      <h3 className="text-xs font-semibold tracking-wider text-foreground-muted uppercase">
        Memory Accesses ({report.memoryAccesses.length})
      </h3>
      {report.memoryAccesses.length === 0 ? (
        <p className="text-xs text-foreground-muted">No LOAD/STORE instructions executed.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {report.memoryAccesses.map((a, i) => (
            <div key={i} className="glass-inset flex items-center gap-2 rounded-md px-2 py-1.5">
              {a.hit ? (
                <Check size={12} className="shrink-0 text-neon-green" />
              ) : (
                <X size={12} className="shrink-0 text-neon-red" />
              )}
              <span className="font-mono text-[10px] text-foreground-muted">C{a.cycle}</span>
              <span className="flex-1 truncate font-mono text-[11px]">{a.raw}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  a.hit ? "bg-neon-green/15 text-neon-green" : "bg-neon-red/15 text-neon-red"
                }`}
              >
                {a.hitLevel}
              </span>
              <span className="font-mono text-[10px] text-foreground-muted">{a.latency}c</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
