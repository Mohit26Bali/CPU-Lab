import type { PerformanceReport } from "@/simulation/performance-analyzer/analyze";

export function MetricsDashboard({ report }: { report: PerformanceReport }) {
  return (
    <div className="glass flex flex-col gap-3 p-4">
      {report.truncated && (
        <p role="status" className="rounded-md border border-neon-red/50 bg-neon-red/10 px-3 py-2 text-xs text-neon-red">
          This program did not finish within 2,000 cycles (it may loop forever), so the numbers below cover only the part
          that ran.
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      <Stat label="Total Cycles" value={String(report.totalCycles)} accent="text-neon-blue" />
      <Stat label="Instructions" value={String(report.instructionsCommitted)} />
      <Stat label="IPC" value={report.ipc.toFixed(2)} accent="text-neon-green" />
      <Stat label="CPI" value={report.cpi.toFixed(2)} accent="text-neon-orange" />
      <Stat
        label="Cache Hit Rate"
        value={report.memoryAccesses.length > 0 ? `${Math.round(report.cacheHitRate * 100)}%` : "—"}
        accent="text-neon-purple"
      />
      <Stat
        label="Branch Accuracy"
        value={report.branchAccuracy !== null ? `${Math.round(report.branchAccuracy * 100)}%` : "—"}
        accent="text-neon-red"
      />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-inset flex flex-col items-center gap-0.5 rounded-lg px-2 py-3 text-center">
      <span className={`font-mono text-lg font-semibold ${accent ?? "text-foreground"}`}>{value}</span>
      <span className="text-[10px] text-foreground-muted">{label}</span>
    </div>
  );
}
