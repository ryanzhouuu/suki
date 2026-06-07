import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { resolvedComparisonsFromRows } from "@/lib/ranking/preference-graph";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { buildTasteProfileText } from "./embedding-text";
import { hashText } from "./hash";
import type { TasteProfile, TasteProfileSignals } from "./types";

function topCounts(
  items: string[],
  limit: number,
): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item) continue;
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function titleOf(anime: Tables<"anime">): string {
  return anime.english_title || anime.romaji_title || anime.native_title || "Unknown";
}

type RankingRow = {
  rank: number;
  series_id: string;
  series: Tables<"series"> | null;
};

type ComparisonRow = {
  left_series_id: string;
  right_series_id: string;
  winner_series_id: string | null;
};

export type TasteProfilePreload = {
  entries?: Awaited<ReturnType<typeof getUserLibraryEntries>>;
  rankings?: RankingRow[];
  comparisons?: ComparisonRow[];
};

export async function buildTasteProfile(
  userId: string,
  preload: TasteProfilePreload = {},
): Promise<TasteProfile> {
  const supabase = await createClient();

  const [entries, rankingsResult, comparisonsResult] = await Promise.all([
    preload.entries
      ? Promise.resolve(preload.entries)
      : getUserLibraryEntries(userId),
    preload.rankings
      ? Promise.resolve({ data: preload.rankings })
      : supabase
          .from("derived_series_rankings")
          .select("rank, series_id, series(*)")
          .eq("user_id", userId)
          .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
          .order("rank", { ascending: true })
          .limit(15),
    preload.comparisons
      ? Promise.resolve({ data: preload.comparisons })
      : supabase
          .from("pairwise_series_comparisons")
          .select("left_series_id, right_series_id, winner_series_id")
          .eq("user_id", userId),
  ]);

  const rankings = rankingsResult.data ?? [];
  const comparisons = resolvedComparisonsFromRows(comparisonsResult.data ?? []);

  const winnerIds = new Set(comparisons.map((c) => c.winnerId));
  const loserIds = new Set(comparisons.map((c) => c.loserId));

  const completed = entries.filter((e) => e.status === "completed");
  const watching = entries.filter((e) => e.status === "watching");
  const dropped = entries.filter((e) => e.status === "dropped");

  const positiveAnime = [...completed, ...watching];
  const positiveGenres = positiveAnime.flatMap((e) => e.anime.genres);
  const positiveFormats = positiveAnime
    .map((e) => e.anime.format)
    .filter((f): f is string => Boolean(f));
  const positiveSources = positiveAnime
    .map((e) => e.anime.source)
    .filter((s): s is string => Boolean(s));

  const signals: TasteProfileSignals = {
    topRankedSeries: rankings
      .map((row) => {
        const series = row.series as Tables<"series"> | null;
        if (!series) return null;
        return {
          id: series.id,
          title: series.canonical_title,
          rank: row.rank,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    comparisonWinners: [...winnerIds],
    comparisonLosers: [...loserIds],
    completedTitles: completed.map((e) => titleOf(e.anime)),
    watchingTitles: watching.map((e) => titleOf(e.anime)),
    droppedTitles: dropped.map((e) => titleOf(e.anime)),
    topGenres: topCounts(positiveGenres, 6),
    topFormats: topCounts(positiveFormats, 4),
    topSources: topCounts(positiveSources, 4),
    avoidGenres: topCounts(
      dropped.flatMap((e) => e.anime.genres),
      4,
    ),
  };

  const profileText = buildTasteProfileText(signals);
  const inputHash = hashText(
    JSON.stringify({
      signals,
      entryCount: entries.length,
      rankingCount: rankings.length,
    }),
  );

  return {
    userId,
    inputHash,
    profileText,
    signals,
  };
}
