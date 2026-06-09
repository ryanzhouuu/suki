"use client";

import { useRouter } from "next/navigation";

import type { ImportJobProgress } from "@/lib/imports/types";

import { ChunkRunner } from "./chunk-runner";

/**
 * Shown on the ranking page while an import's series-mapping backfill finishes.
 * Advances the backfill (lazy resume) and reloads the ranking once it's done.
 */
export function ImportPreparingPanel({ job }: { job: ImportJobProgress }) {
  const router = useRouter();

  return (
    <div className="space-y-4 rounded-card border border-dashed border-line-strong p-6">
      <div>
        <p className="text-sm font-semibold text-ink">Preparing your rankings…</p>
        <p className="mt-1 text-sm text-muted">
          We&apos;re grouping your imported titles into series. Your library is
          ready to use in the meantime — this page will unlock automatically.
        </p>
      </div>
      <ChunkRunner initialJob={job} onStop={() => router.refresh()} />
    </div>
  );
}
