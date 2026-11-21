"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { HelpCircle, X } from "lucide-react";
import type { ReactNode } from "react";

export function TheoryDialog({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Module theory and explanation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border text-foreground-muted transition hover:border-neon-purple/50 hover:text-neon-purple"
        >
          <HelpCircle size={16} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/45" />
        <Dialog.Content className="glass fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="text-sm font-semibold text-foreground">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="shrink-0 text-foreground-muted hover:text-foreground">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
