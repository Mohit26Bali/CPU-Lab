import Link from "next/link";
import { Cpu } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-neon-blue bg-neon-blue/10">
            <Cpu size={16} className="text-neon-blue" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold leading-none tracking-tight">CPU Lab</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6 text-xs text-foreground-muted">
          <a href="#modules" className="datasheet-label hidden transition hover:text-foreground sm:inline">
            Modules
          </a>
          <a href="#features" className="datasheet-label hidden transition hover:text-foreground sm:inline">
            Why CPU Lab
          </a>
          <Link href="/compare" className="datasheet-label hidden transition hover:text-foreground sm:inline">
            Compare
          </Link>
          <Link
            href="/playground/instruction-cycle"
            className="datasheet-label rounded-md border border-neon-blue px-3 py-1.5 text-neon-blue transition hover:bg-neon-blue/10"
          >
            Enter the lab
          </Link>
        </nav>
      </div>
    </header>
  );
}
