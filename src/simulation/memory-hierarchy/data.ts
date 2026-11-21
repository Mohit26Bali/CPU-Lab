export interface HierarchyTier {
  key: string;
  label: string;
  /** Approximate access latency in nanoseconds. */
  ns: number;
  /** Approximate capacity, for context — not simulated, just displayed. */
  capacity: string;
  note: string;
}

/**
 * Widely-cited order-of-magnitude reference latencies (in the spirit of the
 * "Latency Numbers Every Programmer Should Know" figures popularized by
 * Jeff Dean / Peter Norvig). These are representative approximations, not a
 * benchmark of any specific machine — real hardware varies by generation,
 * and that's exactly why the module frames them as reference points.
 */
export const HIERARCHY: HierarchyTier[] = [
  { key: "register", label: "Register", ns: 0.3, capacity: "~ hundreds of bytes", note: "On-die, part of the ALU's own datapath." },
  { key: "l1", label: "L1 Cache", ns: 1, capacity: "~32-64 KB", note: "Per-core, split into instruction and data caches." },
  { key: "l2", label: "L2 Cache", ns: 4, capacity: "~256 KB-1 MB", note: "Per-core or shared by a couple of cores." },
  { key: "l3", label: "L3 Cache", ns: 15, capacity: "~8-32 MB", note: "Shared across all cores on the chip." },
  { key: "ram", label: "RAM", ns: 100, capacity: "~8-128 GB", note: "Off-die — crosses the memory bus." },
  { key: "ssd", label: "SSD", ns: 16_000, capacity: "~256 GB-4 TB", note: "Flash storage, no moving parts, still ~160x slower than RAM." },
  { key: "disk", label: "Disk (HDD)", ns: 10_000_000, capacity: "~1-16 TB", note: "A physical read head has to seek to the right track." },
];
