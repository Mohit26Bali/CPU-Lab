import { createPlaybackStore } from "@/lib/playback/create-playback-store";
import { MemoryHierarchyEngine, type MemoryHierarchySnapshot } from "./engine";
import { HIERARCHY, type HierarchyTier } from "./data";

const engine = new MemoryHierarchyEngine();

export const useMemoryHierarchyPlayback = createPlaybackStore<MemoryHierarchySnapshot, HierarchyTier[]>(
  engine,
  HIERARCHY,
);
