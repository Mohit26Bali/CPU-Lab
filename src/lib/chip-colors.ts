const PALETTE = [
  {
    name: "blue",
    chip: "border-neon-blue/50 bg-neon-blue/15 text-neon-blue",
    glow: "glow-blue",
    dot: "bg-neon-blue",
  },
  {
    name: "purple",
    chip: "border-neon-purple/50 bg-neon-purple/15 text-neon-purple",
    glow: "glow-purple",
    dot: "bg-neon-purple",
  },
  {
    name: "orange",
    chip: "border-neon-orange/50 bg-neon-orange/15 text-neon-orange",
    glow: "glow-orange",
    dot: "bg-neon-orange",
  },
  {
    name: "green",
    chip: "border-neon-green/50 bg-neon-green/15 text-neon-green",
    glow: "glow-green",
    dot: "bg-neon-green",
  },
  {
    name: "red",
    chip: "border-neon-red/50 bg-neon-red/15 text-neon-red",
    glow: "glow-red",
    dot: "bg-neon-red",
  },
] as const;

export function chipColor(instructionIndex: number) {
  return PALETTE[instructionIndex % PALETTE.length];
}
