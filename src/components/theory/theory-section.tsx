"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function TheorySection({
  heading,
  children,
  watchCycle,
  onWatch,
}: {
  heading: string;
  children: ReactNode;
  /** If set, shows a "Watch cycle N" button that jumps the live simulator there. */
  watchCycle?: number;
  onWatch?: (cycle: number) => void;
}) {
  return (
    <div className="mb-5 border-b border-glass-border pb-5 last:mb-0 last:border-0 last:pb-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium text-neon-blue">{heading}</h4>
        {watchCycle !== undefined && onWatch && (
          <Dialog.Close asChild>
            <button
              onClick={() => onWatch(watchCycle)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-neon-blue/10 px-2.5 py-1 text-[11px] whitespace-nowrap text-neon-blue transition hover:bg-neon-blue/20"
            >
              Watch cycle {watchCycle}
              <ArrowRight size={11} />
            </button>
          </Dialog.Close>
        )}
      </div>
      <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground-muted">
        {children}
      </div>
    </div>
  );
}
