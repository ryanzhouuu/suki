"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import { EpisodeTicker } from "@/components/library/episode-ticker";
import { formatAiringCredit, formatTimeUntil, type AiringRow } from "@/lib/anime/airing";

function subscribeToNothing() {
  return () => {};
}

/**
 * The browser's IANA timezone after hydration, or null during SSR.
 * Absolute air times are formatted only with this zone so they match the
 * viewer's clock and don't mismatch the server render.
 */
function useLocalTimeZone() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}

export function AiringRowItem({ row }: { row: AiringRow }) {
  const [now, setNow] = useState(() => Date.now());
  const timeZone = useLocalTimeZone();
  const credit = timeZone ? formatAiringCredit(row.airingAt, now, timeZone) : null;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const secondsUntil = Math.floor((row.airingAt * 1000 - now) / 1000);
  const latestAired = row.nextEpisodeNumber - 1;
  const episodesBehind = Math.max(0, latestAired - row.progressEpisodes);

  return (
    <li className="group flex w-full min-w-0 items-center gap-2.5 rounded-card border border-line bg-surface p-3 transition-all hover:border-accent sm:gap-3">
      <Link
        href={`/anime/${row.anilistId}`}
        className="block shrink-0 overflow-hidden rounded-md"
      >
        <AnimePoster src={row.coverUrl} alt={row.title} size="sm" />
      </Link>

      <div className="min-w-0 flex-1">
        {credit ? (
          <p className="credit-line">
            <span className={credit.soon ? "text-accent" : undefined}>{credit.day}</span>
            {credit.time ? <span className="credit-line__dot"> · {credit.time}</span> : null}
          </p>
        ) : null}
        <Link
          href={`/anime/${row.anilistId}`}
          className="mt-0.5 block truncate font-medium text-ink transition-colors group-hover:text-accent"
        >
          {row.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          Ep {row.nextEpisodeNumber} in {formatTimeUntil(secondsUntil)}
        </p>
        {episodesBehind > 0 ? (
          <span className="mt-1 inline-block rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
            {episodesBehind} behind
          </span>
        ) : null}
      </div>

      <EpisodeTicker
        variant="compact"
        entryId={row.entryId}
        progressEpisodes={row.progressEpisodes}
        totalEpisodes={row.totalEpisodes}
        title={row.title}
      />
    </li>
  );
}
