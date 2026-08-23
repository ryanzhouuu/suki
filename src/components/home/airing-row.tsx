"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import { EpisodeTicker } from "@/components/library/episode-ticker";
import { formatTimeUntil, type AiringRow } from "@/lib/anime/airing";

export function AiringRowItem({ row }: { row: AiringRow }) {
  const [now, setNow] = useState(() => Date.now());

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
        <Link
          href={`/anime/${row.anilistId}`}
          className="block truncate font-medium text-ink transition-colors group-hover:text-accent"
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
