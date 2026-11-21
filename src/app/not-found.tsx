import Link from "next/link";
import { AlertTriangle, ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="glow-red flex h-14 w-14 items-center justify-center rounded-full bg-neon-red/15">
        <AlertTriangle size={24} className="text-neon-red" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">404 — Page Fault</h1>
        <p className="max-w-md text-sm text-foreground-muted">
          This address isn&apos;t mapped to anything. No page table entry, no valid frame —
          just a dangling virtual address (Module 10 has more on how this is supposed to work).
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="glow-blue flex items-center gap-2 rounded-full bg-neon-blue/15 px-5 py-2.5 text-sm font-medium text-neon-blue transition hover:bg-neon-blue/25"
        >
          <Home size={15} />
          Back to Home
        </Link>
        <Link
          href="/playground/instruction-cycle"
          className="flex items-center gap-2 rounded-full border border-glass-border px-5 py-2.5 text-sm text-foreground-muted transition hover:border-neon-blue/30 hover:text-foreground"
        >
          Enter the Playground
          <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}
