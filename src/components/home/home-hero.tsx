"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AddToListButton } from "@/components/home/add-to-list-button";
import { CreditLine } from "@/components/home/credit-line";
import { heroGhostClass, heroPrimaryClass, HeroFrame } from "@/components/home/hero-frame";
import {
  EpisodeFeedback,
  useEpisodeProgress,
} from "@/components/library/episode-progress";
import type { TrendingFeature } from "@/lib/anilist/discover";
import {
  completedCredit,
  orderHeroShows,
  remainingEpisodes,
  trackingCredit,
  type HeroShow,
} from "@/lib/home/featured";

type HomeHeroProps = {
  shows: HeroShow[];
  trending: TrendingFeature | null;
};

/** Dark placeholder while the empty-library trending fetch is in flight. */
export function HomeHeroFallback() {
  return (
    <HeroFrame src={null} edge="app">
      <div className="max-w-xl">
        <p className="sr-only">Loading featured show</p>
        <div aria-hidden="true">
          <div className="h-3 w-40 rounded-full bg-white/15" />
          <div className="mt-4 h-12 w-72 max-w-full rounded bg-white/10" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-white/10" />
        </div>
      </div>
    </HeroFrame>
  );
}

/**
 * Signed-in hero. The show order and the active pick are frozen for this
 * mount, so logging an episode cannot jump the artwork mid-visit.
 */
export function HomeHero({ shows, trending }: HomeHeroProps) {
  const [frozenIds] = useState(() => shows.map((show) => show.entryId));
  const [activeId, setActiveId] = useState<string | null>(shows[0]?.entryId ?? null);
  const [pinnedDone, setPinnedDone] = useState<HeroShow | null>(null);

  const onCompleted = useCallback((next: HeroShow) => {
    setPinnedDone((current) =>
      current?.entryId === next.entryId && current.progressEpisodes === next.progressEpisodes
        ? current
        : next,
    );
  }, []);

  const onReopened = useCallback((entryId: string) => {
    setPinnedDone((current) => (current?.entryId === entryId ? null : current));
  }, []);

  const ordered = orderHeroShows(frozenIds, shows);
  const inList = shows.find((show) => show.entryId === activeId) ?? null;
  const holding = !inList && pinnedDone?.entryId === activeId ? pinnedDone : null;
  const display = inList ?? holding ?? shows[0] ?? null;

  if (display && !holding && display.entryId !== activeId) {
    setActiveId(display.entryId);
  }

  const art = display?.bannerUrl ?? (shows.length === 0 ? trending?.bannerUrl ?? null : null);

  return (
    <HeroFrame src={art} edge="app">
      <div className="min-w-0 max-w-2xl flex-1">
        {display ? (
          holding ? (
            <FinishedShow show={holding} />
          ) : (
            <TrackingShow
              key={display.entryId}
              show={display}
              onCompleted={onCompleted}
              onReopened={onReopened}
            />
          )
        ) : (
          <TrendingFallback feature={trending} />
        )}
      </div>
      <AlsoTracking shows={ordered} activeId={display?.entryId ?? null} onSelect={setActiveId} />
    </HeroFrame>
  );
}

function TrackingShow({
  show,
  onCompleted,
  onReopened,
}: {
  show: HeroShow;
  onCompleted: (show: HeroShow) => void;
  onReopened: (entryId: string) => void;
}) {
  const { value, hasTotal, atTotal, chip, push, undoLast, retrySave } = useEpisodeProgress({
    entryId: show.entryId,
    progressEpisodes: show.progressEpisodes,
    totalEpisodes: show.totalEpisodes,
  });

  useEffect(() => {
    if (atTotal) onCompleted({ ...show, progressEpisodes: value });
    else onReopened(show.entryId);
  }, [atTotal, onCompleted, onReopened, show, value]);

  const live = { ...show, progressEpisodes: value };
  const left = remainingEpisodes(value, show.totalEpisodes);
  const pct =
    hasTotal && show.totalEpisodes
      ? Math.min(100, Math.round((value / show.totalEpisodes) * 100))
      : null;

  return (
    <div>
      <CreditLine parts={atTotal ? completedCredit(live) : trackingCredit(live)} onArt />
      <h1 className="mt-3 text-balance font-display text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl">
        {show.title}
      </h1>
      {show.description ? (
        <p className="mt-3 line-clamp-3 max-w-xl text-[0.95rem] leading-relaxed text-white/75 sm:text-base">
          {show.description}
        </p>
      ) : null}
      {pct != null ? (
        <div className="mt-5 flex max-w-md items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          {left != null && left > 0 ? (
            <p className="credit-line credit-line--on-art shrink-0">{left} left</p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2.5">
        {atTotal ? (
          <Link href="/ranking" className={heroPrimaryClass}>
            Rank it
          </Link>
        ) : (
          <button
            type="button"
            className={heroPrimaryClass}
            onClick={() => {
              const next = value + 1;
              if (show.totalEpisodes != null && show.totalEpisodes > 0 && next >= show.totalEpisodes) {
                onCompleted({ ...show, progressEpisodes: show.totalEpisodes });
              }
              push(next);
            }}
          >
            ✓ Mark ep. {value + 1} watched
          </button>
        )}
        <Link href={`/anime/${show.anilistId}`} className={heroGhostClass}>
          Details
        </Link>
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-white/80">
        <EpisodeFeedback chip={chip} onRetry={retrySave} onUndo={undoLast} />
      </p>
    </div>
  );
}

function FinishedShow({ show }: { show: HeroShow }) {
  const done = {
    ...show,
    progressEpisodes: show.totalEpisodes ?? show.progressEpisodes,
  };
  return (
    <div>
      <CreditLine parts={completedCredit(done)} onArt />
      <h1 className="mt-3 text-balance font-display text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl">
        {show.title}
      </h1>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href="/ranking" className={heroPrimaryClass}>
          Rank it
        </Link>
        <Link href={`/anime/${show.anilistId}`} className={heroGhostClass}>
          Details
        </Link>
      </div>
    </div>
  );
}

function TrendingFallback({ feature }: { feature: TrendingFeature | null }) {
  if (!feature) {
    return (
      <div>
        <CreditLine parts={[{ text: "Now trending", tone: "accent" }]} onArt />
        <h1 className="mt-3 font-display text-4xl font-medium leading-[1.05] text-white sm:text-5xl">
          Nothing in progress yet
        </h1>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/75">
          Search for a show and start logging episodes.
        </p>
        <div className="mt-5">
          <Link href="/search" className={heroPrimaryClass}>
            Search anime
          </Link>
        </div>
      </div>
    );
  }

  const parts = [
    { text: "Now trending", tone: "accent" as const },
    { text: `#${feature.rank} this week`, tone: "strong" as const },
    ...(feature.studio ? [{ text: feature.studio }] : []),
    ...(feature.seasonYear ? [{ text: String(feature.seasonYear) }] : []),
  ];

  return (
    <div>
      <CreditLine parts={parts} onArt />
      <h1 className="mt-3 text-balance font-display text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl">
        <Link href={`/anime/${feature.anilistId}`} className="transition-colors hover:text-accent">
          {feature.title}
        </Link>
      </h1>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <AddToListButton anilistId={feature.anilistId} />
        <Link href="/search" className={heroGhostClass}>
          Search anime
        </Link>
      </div>
    </div>
  );
}

function AlsoTracking({
  shows,
  activeId,
  onSelect,
}: {
  shows: HeroShow[];
  activeId: string | null;
  onSelect: (entryId: string) => void;
}) {
  if (shows.length < 2) return null;
  return (
    <div className="w-full lg:max-w-md lg:shrink-0">
      <CreditLine
        onArt
        parts={[
          { text: "Also tracking" },
          { text: String(shows.length), tone: "strong" },
        ]}
      />
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shows.map((show) => {
          const active = show.entryId === activeId;
          return (
            <li key={show.entryId} className="shrink-0">
              <button
                type="button"
                aria-label={`Show ${show.title}`}
                aria-pressed={active}
                onClick={() => onSelect(show.entryId)}
                className={`block w-28 overflow-hidden rounded-md transition-opacity sm:w-36 ${
                  active ? "ring-2 ring-accent ring-offset-2 ring-offset-[#0b0a0c]" : "opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={show.bannerUrl} alt="" className="aspect-video w-full object-cover" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
