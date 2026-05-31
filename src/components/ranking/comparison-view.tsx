"use client";

import { useTransition } from "react";

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
  const [pending, startTransition] = useTransition();

  function pick(winnerId: string) {
    startTransition(async () => {
      await submitComparison(pair.left.id, pair.right.id, winnerId);
    });
  }

  function skip(reason: string) {
    startTransition(async () => {
      await skipComparison(pair.left.id, pair.right.id, reason);
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-lg font-medium">
        Which did you enjoy more?
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {([pair.left, pair.right] as const).map((anime) => (
          <button
            key={anime.id}
            type="button"
            disabled={pending}
            onClick={() => pick(anime.id)}
            className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <AnimePoster src={anime.cover_image_url} alt={animeTitle(anime)} size="lg" />
            <span className="text-center font-medium">{animeTitle(anime)}</span>
            <span className="text-xs text-zinc-500">
              {[anime.format, anime.season_year].filter(Boolean).join(" · ")}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => skip("cannot_decide")}
        >
          Skip
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
