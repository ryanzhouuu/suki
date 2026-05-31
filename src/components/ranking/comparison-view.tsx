"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { skipComparison, submitComparison } from "@/actions/ranking";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import type { ComparisonPair } from "@/lib/ranking/prompt";
import type { Tables } from "@/types/database";

function animeTitle(anime: Tables<"anime">) {
  return anime.english_title || anime.romaji_title || "Unknown";
}

type ComparisonViewProps = {
  pair: ComparisonPair;
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
    <div className="space-y-7">
      <p className="text-center font-display text-2xl font-medium sm:text-3xl">
        Which did you enjoy more?
      </p>
      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="relative grid gap-4 sm:grid-cols-2">
        {([pair.left, pair.right] as const).map((anime) => (
          <button
            key={anime.id}
            type="button"
            disabled={pending}
            onClick={() => pick(anime.id)}
            className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-5 text-center transition-all hover:-translate-y-1 hover:border-accent hover:shadow-[0_18px_40px_-26px_rgb(var(--shadow-color)/0.5)] disabled:opacity-50"
          >
            <AnimePoster src={anime.cover_image_url} alt={animeTitle(anime)} size="lg" />
            <span className="font-medium text-ink">{animeTitle(anime)}</span>
            <span className="text-xs uppercase tracking-wide text-faint">
              {[anime.format, anime.season_year].filter(Boolean).join(" · ")}
            </span>
          </button>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper font-display text-sm font-semibold italic text-accent shadow-sm sm:flex"
        >
          vs
        </span>
      </div>
      <div className="flex justify-center gap-2">
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
