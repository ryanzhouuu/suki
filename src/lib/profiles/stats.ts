import type { AnimeEntryStatus } from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";
import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings">;

export type LibraryStatusStats = Record<AnimeEntryStatus, number>;

export type ProfileLibraryStats = LibraryStatusStats & {
  total: number;
};

export type ProfileRankingStats = {
  totalRanked: number;
  confidence: { low: number; medium: number; high: number };
};

export type ProfileTasteSummary = {
  topGenres: { genre: string; count: number }[];
  averagePersonalScore: number | null;
  completedCount: number;
};

export type ProfileWatchStyle = {
  topFormats: { format: string; count: number }[];
  totalEpisodesWatched: number;
  shortSeriesShare: number | null;
  genreCompletionRates: { genre: string; rate: number; started: number }[];
};

export type ProfileActivity = {
  recentlyCompleted: LibraryEntry[];
  recentlyAdded: LibraryEntry[];
  recentComparisonCount: number | null;
};

const SHORT_SERIES_EPISODE_MAX = 13;

function countByStatus(entries: LibraryEntry[]): ProfileLibraryStats {
  const stats: LibraryStatusStats = {
    watching: 0,
    completed: 0,
    paused: 0,
    dropped: 0,
    plan_to_watch: 0,
  };

  for (const entry of entries) {
    stats[entry.status] += 1;
  }

  return { ...stats, total: entries.length };
}

function genreCountsFromEntries(
  entries: LibraryEntry[],
  limit: number,
): { genre: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const genre of entry.anime.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([genre, count]) => ({ genre, count }));
}

function averagePersonalScore(entries: LibraryEntry[]): number | null {
  const scored = entries.filter(
    (e) => e.personal_score !== null && e.personal_score !== undefined,
  );
  if (scored.length === 0) return null;

  const sum = scored.reduce(
    (acc, e) => acc + Number(e.personal_score),
    0,
  );
  return Math.round((sum / scored.length) * 10) / 10;
}

function rankingConfidenceStats(
  rankings: RankedSeriesRow[],
): ProfileRankingStats["confidence"] {
  const confidence = { low: 0, medium: 0, high: 0 };
  for (const row of rankings) {
    confidence[row.confidence] += 1;
  }
  return confidence;
}

function formatCounts(entries: LibraryEntry[]): ProfileWatchStyle["topFormats"] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const format = entry.anime.format?.trim();
    if (!format) continue;
    counts.set(format, (counts.get(format) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([format, count]) => ({ format, count }));
}

function shortSeriesShare(entries: LibraryEntry[]): number | null {
  const withEpisodeCount = entries.filter(
    (e) => e.anime.episodes !== null && e.anime.episodes !== undefined,
  );
  if (withEpisodeCount.length === 0) return null;

  const shortCount = withEpisodeCount.filter(
    (e) => (e.anime.episodes ?? 0) <= SHORT_SERIES_EPISODE_MAX,
  ).length;

  return Math.round((shortCount / withEpisodeCount.length) * 100);
}

function totalEpisodesWatched(entries: LibraryEntry[]): number {
  return entries
    .filter((entry) => entry.status !== "plan_to_watch")
    .reduce((sum, entry) => sum + Math.max(0, entry.progress_episodes), 0);
}

function genreCompletionRates(
  entries: LibraryEntry[],
  topGenres: string[],
): ProfileWatchStyle["genreCompletionRates"] {
  const startedStatuses: AnimeEntryStatus[] = [
    "watching",
    "completed",
    "paused",
    "dropped",
  ];

  return topGenres.map((genre) => {
    const relevant = entries.filter(
      (e) =>
        startedStatuses.includes(e.status) &&
        (e.anime.genres ?? []).includes(genre),
    );
    const completed = relevant.filter((e) => e.status === "completed").length;
    const rate =
      relevant.length === 0
        ? 0
        : Math.round((completed / relevant.length) * 100);

    return { genre, rate, started: relevant.length };
  });
}

function sortByDateDesc(
  entries: LibraryEntry[],
  field: "completed_at" | "created_at",
): LibraryEntry[] {
  return [...entries].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (!aVal && !bVal) return 0;
    if (!aVal) return 1;
    if (!bVal) return -1;
    return bVal.localeCompare(aVal);
  });
}

export function computeProfileStats(
  entries: LibraryEntry[],
  rankings: RankedSeriesRow[],
  recentComparisonCount: number | null,
) {
  const completedEntries = entries.filter((e) => e.status === "completed");
  const tasteSource = entries.filter((e) =>
    ["completed", "watching"].includes(e.status),
  );
  const topGenres = genreCountsFromEntries(tasteSource, 5).map((g) => g.genre);

  const library = countByStatus(entries);
  const taste: ProfileTasteSummary = {
    topGenres: genreCountsFromEntries(tasteSource, 6),
    averagePersonalScore: averagePersonalScore(completedEntries),
    completedCount: library.completed,
  };
  const ranking: ProfileRankingStats = {
    totalRanked: rankings.length,
    confidence: rankingConfidenceStats(rankings),
  };
  const watchStyle: ProfileWatchStyle = {
    topFormats: formatCounts(entries),
    totalEpisodesWatched: totalEpisodesWatched(entries),
    shortSeriesShare: shortSeriesShare(completedEntries),
    genreCompletionRates: genreCompletionRates(entries, topGenres.slice(0, 4)),
  };
  const activity: ProfileActivity = {
    recentlyCompleted: sortByDateDesc(completedEntries, "completed_at").slice(
      0,
      4,
    ),
    recentlyAdded: sortByDateDesc(entries, "created_at").slice(0, 4),
    recentComparisonCount,
  };

  return { library, taste, ranking, watchStyle, activity };
}
