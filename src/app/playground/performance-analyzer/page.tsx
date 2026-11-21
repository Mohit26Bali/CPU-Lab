"use client";

import { useState } from "react";
import { usePerformanceAnalyzerPlayback, DEFAULT_CODE, parseAnalyzerCode } from "@/simulation/performance-analyzer/store";
import { analyzeProgram, type PerformanceReport } from "@/simulation/performance-analyzer/analyze";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { HazardStageStrip } from "@/components/modules/pipeline-hazards/hazard-stage-strip";
import { HazardTimeline } from "@/components/modules/pipeline-hazards/hazard-timeline";
import { Scoreboard } from "@/components/modules/pipeline-hazards/scoreboard";
import { CodeEditor } from "@/components/modules/performance-analyzer/code-editor";
import { MetricsDashboard } from "@/components/modules/performance-analyzer/metrics-dashboard";
import { CycleBreakdownChart } from "@/components/modules/performance-analyzer/cycle-breakdown-chart";
import { CacheAccessList } from "@/components/modules/performance-analyzer/cache-access-list";
import { ModuleNav } from "@/components/shared/module-nav";
import { PerformanceTheory } from "@/components/modules/performance-analyzer/performance-theory";

function runFor(code: string): { instructions: ReturnType<typeof parseAnalyzerCode>["instructions"]; report: PerformanceReport } {
  const program = parseAnalyzerCode(code);
  if (program.instructions.length === 0) {
    throw new Error("Write at least one instruction to analyze, for example MOV R1, #5.");
  }
  usePerformanceAnalyzerPlayback.getState().loadProgram(program);
  const history = usePerformanceAnalyzerPlayback.getState().history;
  return { instructions: program.instructions, report: analyzeProgram(program.instructions, history) };
}

export default function PerformanceAnalyzerPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PerformanceReport>(() => {
    const history = usePerformanceAnalyzerPlayback.getState().history;
    return analyzeProgram(parseAnalyzerCode(DEFAULT_CODE).instructions, history);
  });

  function analyze(sourceCode: string) {
    try {
      const { report: newReport } = runFor(sourceCode);
      setReport(newReport);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse program.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav title="Module 14 — Performance Analyzer" rightSlot={<PerformanceTheory />} />

      <MetricsDashboard report={report} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[300px_1fr_300px]">
        <CodeEditor
          value={code}
          onChange={setCode}
          onRun={() => analyze(code)}
          onReset={() => {
            setCode(DEFAULT_CODE);
            analyze(DEFAULT_CODE);
          }}
          error={error}
        />
        <div className="flex flex-col gap-4 lg:overflow-y-auto">
          <HazardStageStrip usePlayback={usePerformanceAnalyzerPlayback} />
          <HazardTimeline usePlayback={usePerformanceAnalyzerPlayback} />
        </div>
        <div className="flex flex-col gap-4 lg:overflow-y-auto">
          <CycleBreakdownChart report={report} />
          <Scoreboard usePlayback={usePerformanceAnalyzerPlayback} />
          <CacheAccessList report={report} />
        </div>
      </div>

      <PlaybackControls usePlayback={usePerformanceAnalyzerPlayback} />
    </main>
  );
}
