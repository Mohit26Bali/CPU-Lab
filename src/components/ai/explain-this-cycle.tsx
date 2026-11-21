"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { ExplainCycleRequest } from "@/lib/ai/explain-cycle";

export function ExplainThisCycle({ request }: { request: ExplainCycleRequest }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleExplain() {
    setLoading(true);
    setError(null);
    setText(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setText(data.text);
      }
    } catch {
      setError("Could not reach the AI Tutor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExplain}
        disabled={loading}
        className="glow-purple flex w-fit items-center gap-2 rounded-md bg-neon-purple/15 px-3 py-1.5 text-xs font-medium text-neon-purple transition hover:bg-neon-purple/25 disabled:opacity-50"
      >
        <Sparkles size={14} />
        {loading ? "Thinking…" : "Explain this cycle"}
      </button>
      {error && <p className="text-xs text-neon-red">{error}</p>}
      {text && (
        <div className="glass-inset rounded-md p-3 text-xs leading-relaxed text-foreground">
          {text}
        </div>
      )}
    </div>
  );
}
