import { chipColor } from "@/lib/chip-colors";

export function InstructionChip({ raw, index, small }: { raw: string; index: number; small?: boolean }) {
  const color = chipColor(index);
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono ${small ? "text-[9px]" : "text-[10px]"} ${color.chip}`}
    >
      {raw}
    </span>
  );
}
