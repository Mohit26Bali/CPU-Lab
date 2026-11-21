import Link from "next/link";
import { Cpu } from "lucide-react";
import { HERO_PHOTOS } from "@/lib/hero-photos";

export function SiteFooter() {
  const photographers = Array.from(new Map(HERO_PHOTOS.map((p) => [p.photographer, p.page])));
  return (
    <footer className="w-full border-t border-glass-border bg-background-elevated/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" className="flex items-center gap-2 text-sm text-foreground-muted">
          <Cpu size={14} aria-hidden="true" />
          CPU Lab
        </Link>
        <p className="text-xs text-foreground-muted">
          14 modules, simulation engines checked against independent models, zero canned animations.
        </p>
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-6 text-[11px] leading-relaxed text-foreground-muted">
        Photos from{" "}
        <a href="https://www.pexels.com" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
          Pexels
        </a>
        :{" "}
        {photographers.map(([name, page], i) => (
          <span key={name}>
            <a href={page} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
              {name}
            </a>
            {i < photographers.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>
    </footer>
  );
}
