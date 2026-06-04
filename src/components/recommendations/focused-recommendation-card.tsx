"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  dismissRecommendation,
  logRecommendationAdded,
  logRecommendationClicked,
} from "@/actions/recommendations";
import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { RecommendationBannerBackdrop } from "@/components/recommendations/recommendation-banner-backdrop";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/constants";
import type { RecommendationExplanationBadge, RecommendationRow } from "@/lib/recommendations/types";

const BADGE_LABELS: Record<RecommendationExplanationBadge, string> = {
  strong_match: "Strong match",
  genre_match: "Genre match",
  request_match: "Matches request",
  community_score: "Well rated",
  popular: "Popular",
  diverse_pick: "Varied pick",
  wildcard_pick: "Wildcard",
};

type FocusedRecommendationCardProps = {
  row: RecommendationRow;
  index: number;
  total: number;
  onDismissed: () => void;
};

export function FocusedRecommendationCard({
  row,
  index,
  total,
  onDismissed,
}: FocusedRecommendationCardProps) {
  const [pending, startTransition] = useTransition();
  const [libraryStatus, setLibraryStatus] = useState(row.libraryEntry?.status ?? null);
  const anime = row.anime;
  const title = anime.english_title || anime.romaji_title || "Unknown";
  const details = row.parsedExplanationDetails;
  const explanation = details?.primaryReason ?? row.explanation;
  const secondarySignals = details?.secondarySignals ?? [];
  const badges = details?.badges ?? [];

  const meta = [anime.format, anime.season_year, anime.episodes ? `${anime.episodes} eps` : null]
    .filter(Boolean)
    .map(String);

  function addStatus(status: "plan_to_watch" | "watching") {
    startTransition(async () => {
      await addAnimeEntry(anime.anilist_id, status);
      await logRecommendationAdded(anime.id, status);
      setLibraryStatus(status);
    });
  }

  function dismiss() {
    startTransition(async () => {
      await dismissRecommendation(anime.id);
      onDismissed();
    });
  }

  return (
    <div className="relative isolate animate-rise pt-2">
      <RecommendationBannerBackdrop
        bannerUrl={anime.banner_image_url}
        coverUrl={anime.cover_image_url}
      />

      <article className="relative z-10 overflow-hidden rounded-card border border-line/80 bg-surface/95 shadow-[0_18px_50px_-30px_rgb(var(--shadow-color)/0.45)] backdrop-blur-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(220px,280px)_1fr]">
          <div className="relative aspect-3/4 bg-surface-2 lg:aspect-auto lg:min-h-[420px]">
            <AnimePoster
              src={anime.cover_image_url}
              alt={title}
              fill
              className="rounded-none"
            />
          </div>

          <div className="flex flex-col p-5 sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted">
            <span>
              Recommendation {index + 1} of {total}
            </span>
            {libraryStatus ? (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent">
                In library: {STATUS_LABELS[libraryStatus]}
              </span>
            ) : null}
          </div>

          <h2 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
            {title}
          </h2>

          {meta.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meta.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {item}
                </span>
              ))}
              {anime.average_score ? (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  ★ {anime.average_score}
                </span>
              ) : null}
            </div>
          ) : null}

          {anime.genres.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {anime.genres.slice(0, 6).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-line-strong px-2.5 py-1 text-xs font-medium text-muted"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Why this pick
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{explanation}</p>
            </div>

            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink"
                  >
                    {BADGE_LABELS[badge]}
                  </span>
                ))}
              </div>
            ) : null}

            {secondarySignals.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-muted">
                {secondarySignals.map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span aria-hidden className="text-accent">
                      •
                    </span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Button
              type="button"
              disabled={pending || libraryStatus != null}
              onClick={() => addStatus("plan_to_watch")}
            >
              Plan to watch
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending || libraryStatus === "watching"}
              onClick={() => addStatus("watching")}
            >
              Start watching
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={dismiss}>
              Not interested
            </Button>
            <Link
              href={`/anime/${anime.anilist_id}`}
              onClick={() => {
                void logRecommendationClicked(anime.id);
              }}
              className="inline-flex items-center px-3 text-sm font-medium text-accent hover:underline"
            >
              Open details →
            </Link>
          </div>
          </div>
        </div>
      </article>
    </div>
  );
}
