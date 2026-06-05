import type { Tables } from "@/types/database";

export type SeriesHighlight = {
  seriesId: string;
  title: string;
  coverImageUrl: string | null;
  viewerRank: number;
  friendRank: number;
  rankDelta: number;
};

export type TasteCompareHighlights = {
  sharedFavorites: SeriesHighlight[];
  biggestDisagreements: SeriesHighlight[];
  sharedCompletedSeriesCount: number;
};

export type RankingCompareRow = {
  rank: number;
  series_id: string;
  series: Tables<"series"> | null;
};

type EntryStatus = Tables<"user_anime_entries">["status"];

type TasteMatchAnime = Pick<
  Tables<"anime">,
  "id" | "english_title" | "romaji_title" | "cover_image_url" | "genres" | "format"
>;

export type TasteMatchLibraryRow = Pick<
  Tables<"user_anime_entries">,
  "anime_id" | "status" | "personal_score" | "priority"
> & {
  anime: TasteMatchAnime;
};

export type SharedGenreStrength = {
  genre: string;
  viewerCount: number;
  friendCount: number;
  combinedCount: number;
};

export type TasteDifference = {
  genre: string;
  viewerCount: number;
  friendCount: number;
  delta: number;
};

export type LovedDiscoveryItem = {
  animeId: string;
  title: string;
  coverImageUrl: string | null;
  personalScore: number | null;
};

export type SharedWatchlistItem = {
  animeId: string;
  title: string;
  coverImageUrl: string | null;
  viewerPriority: Tables<"user_anime_entries">["priority"];
  friendPriority: Tables<"user_anime_entries">["priority"];
};

const TASTE_STATUSES: EntryStatus[] = ["watching", "completed", "paused"];
const DISCOVERY_SCORE_THRESHOLD = 8;

function inTastePool(status: EntryStatus): boolean {
  return TASTE_STATUSES.includes(status);
}

function titleForAnime(anime: TasteMatchAnime): string {
  return anime.english_title || anime.romaji_title || "Unknown title";
}

function genreCounts(entries: TasteMatchLibraryRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!inTastePool(entry.status)) continue;
    for (const genre of entry.anime.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return counts;
}

export function confidenceFromStats(
  viewer: { completed: number; comparisons: number },
  friend: { completed: number; comparisons: number },
): "low" | "medium" | "high" {
  const viewerRich = viewer.completed >= 5 && viewer.comparisons >= 3;
  const friendRich = friend.completed >= 5 && friend.comparisons >= 3;

  if (viewerRich && friendRich) return "high";
  if (viewer.completed >= 2 && friend.completed >= 2) return "medium";
  return "low";
}

export function buildCompareHighlightsFromRankings(
  viewerRows: RankingCompareRow[],
  friendRows: RankingCompareRow[],
  sharedCompletedSeriesCount: number,
  limit = 5,
): TasteCompareHighlights {
  const friendBySeries = new Map(friendRows.map((r) => [r.series_id, r.rank]));

  const shared: SeriesHighlight[] = [];

  for (const row of viewerRows) {
    const friendRank = friendBySeries.get(row.series_id);
    if (friendRank === undefined) continue;

    const series = row.series;
    if (!series) continue;

    shared.push({
      seriesId: series.id,
      title: series.canonical_title,
      coverImageUrl: series.cover_image_url,
      viewerRank: row.rank,
      friendRank,
      rankDelta: Math.abs(row.rank - friendRank),
    });
  }

  shared.sort((a, b) => a.rankDelta - b.rankDelta);

  return {
    sharedFavorites: shared.slice(0, limit),
    biggestDisagreements: [...shared]
      .sort((a, b) => b.rankDelta - a.rankDelta)
      .slice(0, limit),
    sharedCompletedSeriesCount,
  };
}

export const emptyTasteCompareHighlights = (): TasteCompareHighlights => ({
  sharedFavorites: [],
  biggestDisagreements: [],
  sharedCompletedSeriesCount: 0,
});

export function buildSharedGenreStrength(
  viewerEntries: TasteMatchLibraryRow[],
  friendEntries: TasteMatchLibraryRow[],
  limit = 6,
): SharedGenreStrength[] {
  const viewerCounts = genreCounts(viewerEntries);
  const friendCounts = genreCounts(friendEntries);
  const sharedGenres = [...viewerCounts.keys()].filter((genre) =>
    friendCounts.has(genre),
  );

  return sharedGenres
    .map((genre) => {
      const viewerCount = viewerCounts.get(genre) ?? 0;
      const friendCount = friendCounts.get(genre) ?? 0;
      return {
        genre,
        viewerCount,
        friendCount,
        combinedCount: viewerCount + friendCount,
      };
    })
    .sort(
      (a, b) =>
        b.combinedCount - a.combinedCount ||
        Math.min(b.viewerCount, b.friendCount) -
          Math.min(a.viewerCount, a.friendCount) ||
        a.genre.localeCompare(b.genre),
    )
    .slice(0, limit);
}

export function buildTasteDifferences(
  viewerEntries: TasteMatchLibraryRow[],
  friendEntries: TasteMatchLibraryRow[],
  limit = 6,
): TasteDifference[] {
  const viewerCounts = genreCounts(viewerEntries);
  const friendCounts = genreCounts(friendEntries);
  const allGenres = new Set([...viewerCounts.keys(), ...friendCounts.keys()]);

  return [...allGenres]
    .map((genre) => {
      const viewerCount = viewerCounts.get(genre) ?? 0;
      const friendCount = friendCounts.get(genre) ?? 0;
      return {
        genre,
        viewerCount,
        friendCount,
        delta: viewerCount - friendCount,
      };
    })
    .filter((row) => row.delta !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.delta) - Math.abs(a.delta) || a.genre.localeCompare(b.genre),
    )
    .slice(0, limit);
}

function isLovedEntry(entry: TasteMatchLibraryRow): boolean {
  if (!inTastePool(entry.status)) return false;
  if ((entry.personal_score ?? 0) >= DISCOVERY_SCORE_THRESHOLD) return true;
  return entry.status === "completed";
}

export function buildLovedUnwatched(
  sourceEntries: TasteMatchLibraryRow[],
  otherEntries: TasteMatchLibraryRow[],
  limit = 6,
): LovedDiscoveryItem[] {
  const excludedAnimeIds = new Set(otherEntries.map((entry) => entry.anime_id));
  const deduped = new Map<string, LovedDiscoveryItem>();

  for (const entry of sourceEntries) {
    if (!isLovedEntry(entry)) continue;
    if (excludedAnimeIds.has(entry.anime_id)) continue;
    if (deduped.has(entry.anime_id)) continue;

    deduped.set(entry.anime_id, {
      animeId: entry.anime_id,
      title: titleForAnime(entry.anime),
      coverImageUrl: entry.anime.cover_image_url,
      personalScore: entry.personal_score,
    });
  }

  return [...deduped.values()]
    .sort((a, b) => (b.personalScore ?? 0) - (a.personalScore ?? 0))
    .slice(0, limit);
}

export function buildSharedPlanToWatch(
  viewerEntries: TasteMatchLibraryRow[],
  friendEntries: TasteMatchLibraryRow[],
  limit = 6,
): SharedWatchlistItem[] {
  const viewerPlan = viewerEntries.filter((entry) => entry.status === "plan_to_watch");
  const friendPlanByAnimeId = new Map(
    friendEntries
      .filter((entry) => entry.status === "plan_to_watch")
      .map((entry) => [entry.anime_id, entry]),
  );

  const priorityWeight: Record<NonNullable<Tables<"user_anime_entries">["priority"]>, number> =
    {
      high: 3,
      medium: 2,
      low: 1,
    };

  const shared: SharedWatchlistItem[] = [];
  for (const entry of viewerPlan) {
    const friendEntry = friendPlanByAnimeId.get(entry.anime_id);
    if (!friendEntry) continue;

    shared.push({
      animeId: entry.anime_id,
      title: titleForAnime(entry.anime),
      coverImageUrl: entry.anime.cover_image_url,
      viewerPriority: entry.priority,
      friendPriority: friendEntry.priority,
    });
  }

  return shared
    .sort((a, b) => {
      const aScore =
        (a.viewerPriority ? priorityWeight[a.viewerPriority] : 0) +
        (a.friendPriority ? priorityWeight[a.friendPriority] : 0);
      const bScore =
        (b.viewerPriority ? priorityWeight[b.viewerPriority] : 0) +
        (b.friendPriority ? priorityWeight[b.friendPriority] : 0);
      return bScore - aScore || a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
