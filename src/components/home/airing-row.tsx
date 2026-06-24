"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { updateAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { formatTimeUntil, type AiringRow } from "@/lib/anime/airing";

export function AiringRowItem({ row }: { row: AiringRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [progress, setProgress] = useState(row.progressEpisodes);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const secondsUntil = Math.floor((row.airingAt * 1000 - now) / 1000);
  const latestAired = row.nextEpisodeNumber - 1;
  const episodesBehind = Math.max(0, latestAired - progress);

  function bump() {
    const previous = progress;
    const next = previous + 1;
    const willComplete = row.totalEpisodes != null && next >= row.totalEpisodes;
    setProgress(next); // optimistic
    startTransition(async () => {
      const result = await updateAnimeEntry(
        row.entryId,
        willComplete
          ? { progressEpisodes: next, status: "completed" }
          : { progressEpisodes: next },
      );
      if (result.error) {
        setProgress(previous); // revert
      } else {
        router.refresh();
      }
    });
  }

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

      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        className="shrink-0 px-2.5 text-[11px] sm:px-3 sm:text-xs"
        onClick={bump}
      >
        +1 ep
      </Button>
    </li>
  );
}
