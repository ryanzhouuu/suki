"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import {
  dismissRecommendation,
  logRecommendationAdded,
  logRecommendationClicked,
} from "@/actions/recommendations";
import { addAnimeEntry } from "@/actions/library";
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
  contextLabel?: string;
  whyLabel?: string;
  /** Render the contained banner halo. Off when a page-level backdrop is present. */
  backdrop?: boolean;
};

export function FocusedRecommendationCard({
  row,
  index,
  total,
  onDismissed,
  contextLabel = "Recommendation",
  whyLabel = "Why this pick",
  backdrop = true,
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
      {backdrop ? (
        <RecommendationBannerBackdrop
          bannerUrl={anime.banner_image_url}
          coverUrl={anime.cover_image_url}
        />
      ) : null}

      <article className="relative z-10 overflow-hidden rounded-card border border-line/80 bg-surface/95 shadow-[0_18px_50px_-30px_rgb(var(--shadow-color)/0.45)] backdrop-blur-sm">
        <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-0 sm:grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-[minmax(200px,260px)_1fr]">
          <div className="relative min-h-50 bg-surface-2 sm:min-h-70 lg:min-h-95">
            {anime.cover_image_url ? (
              <Image
                src={anime.cover_image_url}
                alt={title}
                fill
                sizes="(max-width: 640px) 100px, (max-width: 1024px) 144px, 260px"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col p-3 sm:p-5 lg:p-7">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted sm:mb-4 sm:text-xs">
              <span>
                {contextLabel} {index + 1} of {total}
              </span>
              {libraryStatus ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent sm:px-2.5 sm:py-1">
                  In library: {STATUS_LABELS[libraryStatus]}
                </span>
              ) : null}
            </div>

          <h2 className="line-clamp-2 text-lg font-semibold leading-tight sm:text-2xl lg:text-3xl">
            {title}
          </h2>

          {meta.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
              {meta.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted sm:px-2.5 sm:py-1 sm:text-xs"
                >
                  {item}
                </span>
              ))}
              {anime.average_score ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent sm:px-2.5 sm:py-1 sm:text-xs">
                  ★ {anime.average_score}
                </span>
              ) : null}
            </div>
          ) : null}

          {anime.genres.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
              {anime.genres.slice(0, 6).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-medium text-muted sm:px-2.5 sm:py-1 sm:text-xs"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs">
                {whyLabel}
              </p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink sm:mt-1.5 sm:line-clamp-none sm:text-sm">{explanation}</p>
            </div>

            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink sm:px-2.5 sm:py-1 sm:text-xs"
                  >
                    {BADGE_LABELS[badge]}
                  </span>
                ))}
              </div>
            ) : null}

            {secondarySignals.length > 0 ? (
              <ul className="hidden space-y-1.5 text-sm text-muted sm:block">
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

          <div className="mt-auto flex flex-wrap gap-1.5 pt-3 sm:gap-2 sm:pt-6">
            <Button
              type="button"
              disabled={pending || libraryStatus != null}
              size="sm"
              onClick={() => addStatus("plan_to_watch")}
            >
              Plan to watch
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending || libraryStatus === "watching"}
              onClick={() => addStatus("watching")}
            >
              Start watching
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={dismiss}>
              Not interested
            </Button>
            <Link
              href={`/anime/${anime.anilist_id}`}
              onClick={() => {
                void logRecommendationClicked(anime.id);
              }}
              className="inline-flex min-h-10 items-center px-2 text-xs font-medium text-accent hover:underline sm:px-3 sm:text-sm"
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
