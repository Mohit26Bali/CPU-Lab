"use client";

import { useState } from "react";
import { useCacheMappingPlayback } from "@/simulation/cache-mapping/store";
import type { MappingScheme } from "@/simulation/cache-mapping/engine";
import { PlaybackControls } from "@/components/playback/playback-controls";
import { AddressBreakdown } from "@/components/modules/cache-mapping/address-breakdown";
import { CacheLineGrid } from "@/components/modules/cache-mapping/cache-line-grid";
import { RequestResult } from "@/components/modules/cache-mapping/request-result";
import { SchemeTabs } from "@/components/modules/cache-mapping/scheme-tabs";
import { SchemeComparison } from "@/components/modules/cache-mapping/scheme-comparison";
import { CacheMappingInspector } from "@/components/inspector/cache-mapping-inspector";
import { ModuleNav } from "@/components/shared/module-nav";
import { CacheMappingTheory } from "@/components/modules/cache-mapping/cache-mapping-theory";

export default function CacheMappingPage() {
  const [scheme, setScheme] = useState<MappingScheme>("direct");

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen">
      <ModuleNav
        title="Module 7 — Cache Mapping"
        rightSlot={<CacheMappingTheory usePlayback={useCacheMappingPlayback} activeScheme={scheme} />}
      />

      <SchemeTabs usePlayback={useCacheMappingPlayback} active={scheme} onChange={setScheme} />

      <RequestResult usePlayback={useCacheMappingPlayback} />

      <AddressBreakdown usePlayback={useCacheMappingPlayback} />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:overflow-hidden lg:grid-cols-[1fr_280px_280px]">
        <CacheLineGrid usePlayback={useCacheMappingPlayback} />
        <SchemeComparison active={scheme} />
        <CacheMappingInspector usePlayback={useCacheMappingPlayback} />
      </div>

      <PlaybackControls usePlayback={useCacheMappingPlayback} />
    </main>
  );
}
