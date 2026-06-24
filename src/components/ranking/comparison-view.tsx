"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { skipComparison, submitComparison } from "@/actions/ranking";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import type { SeriesComparisonPair } from "@/lib/ranking/prompt";

function seriesSubtitle(entryCount: number) {
  if (entryCount <= 1) return "Series";
  return `Series · ${entryCount} entries in your library`;
}

type ComparisonViewProps = {
  pair: SeriesComparisonPair;
};

export function ComparisonView({ pair }: ComparisonViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function afterAction(result: { error?: string }) {
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    router.refresh();
  }

  function pick(winnerId: string) {
    startTransition(async () => {
      const result = await submitComparison(
        pair.left.id,
        pair.right.id,
        winnerId,
      );
      afterAction(result);
    });
  }

  function skip(reason: string) {
    startTransition(async () => {
      const result = await skipComparison(
        pair.left.id,
        pair.right.id,
        reason,
      );
      afterAction(result);
    });
  }

  return (
    <div className="space-y-4 sm:space-y-7">
      <p className="text-center text-xs text-muted sm:text-sm">
        Rankings are by series — seasons and movies in the same franchise count
        as one title.
      </p>
      <p className="text-center font-display text-lg font-medium sm:text-3xl">
        Which did you enjoy more?
      </p>
      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="relative grid grid-cols-2 gap-2 sm:gap-4">
        {([pair.left, pair.right] as const).map((series) => (
          <div key={series.id} className="contents">
            <button
              type="button"
              disabled={pending}
              onClick={() => pick(series.id)}
              className="flex min-w-0 flex-col items-center gap-2 rounded-card border border-line bg-surface p-3 text-center transition-all hover:-translate-y-1 hover:border-accent hover:shadow-[0_18px_40px_-26px_rgb(var(--shadow-color)/0.5)] disabled:opacity-50 sm:gap-3 sm:p-5"
            >
              <AnimePoster
                src={series.cover_image_url}
                alt={series.canonical_title}
                size="md"
              />
              <span className="line-clamp-2 text-sm font-medium leading-snug text-ink sm:text-base">
                {series.canonical_title}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-faint sm:text-xs">
                {seriesSubtitle(series.entryCount)}
              </span>
            </button>
          </div>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper font-display text-xs font-semibold italic text-accent shadow-sm sm:h-11 sm:w-11 sm:text-sm"
        >
          vs
        </span>
      </div>
      <div className="flex justify-center gap-2 pt-1 sm:pt-0">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => skip("cannot_decide")}
        >
          Can&apos;t decide
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => skip("not_comparable")}
        >
          Not comparable
        </Button>
      </div>
    </div>
  );
}
