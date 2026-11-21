"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

const MODULES = [
  { href: "/playground/instruction-cycle", label: "1. Instruction Cycle" },
  { href: "/playground/pipeline", label: "2. Pipeline" },
  { href: "/playground/pipeline-hazards", label: "3. Hazards" },
  { href: "/playground/forwarding", label: "4. Forwarding" },
  { href: "/playground/branch-prediction", label: "5. Branch Prediction" },
  { href: "/playground/cache-hierarchy", label: "6. Cache Hierarchy" },
  { href: "/playground/cache-mapping", label: "7. Cache Mapping" },
  { href: "/playground/replacement-policy", label: "8. Replacement Policies" },
  { href: "/playground/memory-hierarchy", label: "9. Memory Hierarchy" },
  { href: "/playground/virtual-memory", label: "10. Virtual Memory" },
  { href: "/playground/out-of-order", label: "11. Out-of-Order" },
  { href: "/playground/superscalar", label: "12. Superscalar" },
  { href: "/playground/simd", label: "13. SIMD" },
  { href: "/playground/performance-analyzer", label: "14. Performance Analyzer" },
];

export function ModuleNav({ title, rightSlot }: { title: string; rightSlot?: ReactNode }) {
  const pathname = usePathname();
  const currentIndex = MODULES.findIndex((m) => m.href === pathname);
  const prevModule = currentIndex > 0 ? MODULES[currentIndex - 1] : null;
  const nextModule =
    currentIndex !== -1 && currentIndex < MODULES.length - 1 ? MODULES[currentIndex + 1] : null;

  return (
    <div className="flex flex-col gap-2">
      <header className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-foreground-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Home
        </Link>
        <div className="h-4 w-px bg-glass-border" />
        <h1 className="text-sm font-medium">{title}</h1>
        <div className="ml-auto flex min-w-0 max-w-full items-center gap-3">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-glass-border p-1">
            {MODULES.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition ${
                  pathname === m.href
                    ? "bg-neon-blue/15 text-neon-blue"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {m.label}
              </Link>
            ))}
          </div>
          {rightSlot}
        </div>
      </header>

      {currentIndex !== -1 && (
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          {prevModule ? (
            <Link
              href={prevModule.href}
              className="flex items-center gap-1 transition hover:text-foreground"
            >
              <ChevronLeft size={13} />
              {prevModule.label}
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-[11px]">
            Module {currentIndex + 1} of {MODULES.length}
          </span>
          {nextModule ? (
            <Link
              href={nextModule.href}
              className="flex items-center gap-1 transition hover:text-foreground"
            >
              {nextModule.label}
              <ChevronRight size={13} />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
