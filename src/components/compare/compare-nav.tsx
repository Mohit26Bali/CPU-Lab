import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function CompareNav() {
  return (
    <header className="flex items-center gap-3">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-foreground-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Home
      </Link>
      <div className="h-4 w-px bg-glass-border" />
      <h1 className="text-sm font-medium">Compare Mode</h1>
    </header>
  );
}
