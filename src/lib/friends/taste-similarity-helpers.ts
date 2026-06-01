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
