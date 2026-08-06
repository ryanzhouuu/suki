import type { AnimeEntryStatus } from "@/lib/constants";
import type { SeriesRef } from "@/lib/library/group";

import type { FingerprintEntry } from "./types";
import type {
  FingerprintStatusCounts,
  NormalizedFranchise,
  NormalizedRanking,
} from "./normalize-types";
import {
  compareStrings,
  displayTitle,
  safeFormat,
  safeGenreNames,
  safeNonNegativeInteger,
  safePersonalScore,
  safePositiveInteger,
  safeTagNames,
} from "./normalize-metadata";

const STATUS_ORDER: AnimeEntryStatus[] = [
  "watching",
  "completed",
  "paused",
  "dropped",
  "plan_to_watch",
];

function emptyStatusCounts(): FingerprintStatusCounts {
  return STATUS_ORDER.reduce(
    (counts, status) => {
      counts[status] = 0;
      return counts;
    },
    {} as FingerprintStatusCounts,
  );
}

function compareEntries(a: FingerprintEntry, b: FingerprintEntry): number {
  return compareStrings(a.anime_id, b.anime_id) || compareStrings(a.id, b.id);
}

export function normalizeFranchise(
  key: string,
  series: SeriesRef | null,
  entries: FingerprintEntry[],
  ranking: NormalizedRanking | null,
): NormalizedFranchise {
  const orderedEntries = [...entries].sort(compareEntries);
  const statusCounts = emptyStatusCounts();
  const genres = new Set<string>();
  const tags = new Set<string>();
  const formats = new Set<string>();
  const completedFormats = new Set<string>();
  const scores: number[] = [];
  const animeIds: string[] = [];
  let popularity: number | null = null;
  let totalRewatchCount = 0;
  let hasCompletedEpisodeGap = false;
  let completedEpisodeTotal = 0;
  let completedEntryCount = 0;

  for (const entry of orderedEntries) {
    animeIds.push(entry.anime_id);
    statusCounts[entry.status] += 1;

    for (const genre of safeGenreNames(entry.anime.genres)) genres.add(genre);
    for (const tag of safeTagNames(entry.anime.tags)) tags.add(tag);

    const format = safeFormat(entry.anime.format);
    if (format) formats.add(format);
    if (entry.status === "completed") {
      completedEntryCount += 1;
      if (format) completedFormats.add(format);
      const episodes = safePositiveInteger(entry.anime.episodes);
      if (episodes === null) hasCompletedEpisodeGap = true;
      else completedEpisodeTotal += episodes;
    }

    if (entry.status !== "plan_to_watch") {
      const score = safePersonalScore(entry.personal_score);
      if (score !== null) scores.push(score);
    }

    const entryPopularity = safeNonNegativeInteger(entry.anime.popularity);
    if (entryPopularity !== null) {
      popularity = Math.max(popularity ?? 0, entryPopularity);
    }

    if (entry.status !== "plan_to_watch") {
      const rewatchCount = safeNonNegativeInteger(entry.rewatch_count);
      if (rewatchCount !== null) totalRewatchCount += rewatchCount;
    }
  }

  const hasCompleted = statusCounts.completed > 0;
  const hasWatching = statusCounts.watching > 0;
  const hasPaused = statusCounts.paused > 0;
  const hasDropped = statusCounts.dropped > 0;
  const hasPlanToWatch = statusCounts.plan_to_watch > 0;
  const isStarted = hasCompleted || hasWatching || hasPaused || hasDropped;
  const isSettled = isStarted && !hasWatching;
  const isPositiveEngagement = hasCompleted || hasWatching;
  const meanPersonalScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

  return {
    id: key,
    title: series?.canonical_title?.trim() || displayTitle(orderedEntries[0]),
    animeIds,
    series,
    statusCounts,
    hasCompleted,
    hasWatching,
    hasPaused,
    hasDropped,
    hasPlanToWatch,
    isStarted,
    isPositiveEngagement,
    isSettled,
    genres: [...genres].sort(compareStrings),
    tags: [...tags].sort(compareStrings),
    formats: [...formats].sort(compareStrings),
    completedFormats: [...completedFormats].sort(compareStrings),
    popularity,
    completedEpisodeTotal:
      completedEntryCount > 0 && !hasCompletedEpisodeGap
        ? completedEpisodeTotal
        : null,
    completedEpisodeMetadataComplete:
      completedEntryCount > 0 && !hasCompletedEpisodeGap,
    personalScores: scores.sort((a, b) => a - b),
    meanPersonalScore,
    totalRewatchCount,
    hasRewatch: totalRewatchCount > 0,
    ranking,
  };
}
