import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type SeriesWithEntryCount = Tables<"series"> & {
  entryCount: number;
};

/**
 * Distinct series the user has at least one completed entry for.
 *
 * Deduped per request — the home page reads this directly and again through
 * getNextComparisonPair within one render, so they share a single fetch.
 */
export const getCompletedSeriesForUser = cache(async function (
  userId: string,
): Promise<SeriesWithEntryCount[]> {
  const supabase = await createClient();

  const { data: completed, error: entriesError } = await supabase
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (entriesError) throw new Error(entriesError.message);
  if (!completed?.length) return [];

  const animeIds = completed.map((row) => row.anime_id);

  const { data: maps, error: mapsError } = await supabase
    .from("anime_series_map")
    .select("anime_id, series_id, series(*)")
    .in("anime_id", animeIds);

  if (mapsError) throw new Error(mapsError.message);

  const bySeries = new Map<string, SeriesWithEntryCount>();

  for (const row of maps ?? []) {
    const series = row.series as Tables<"series"> | null;
    if (!series) continue;

    const existing = bySeries.get(series.id);
    if (existing) {
      existing.entryCount += 1;
    } else {
      bySeries.set(series.id, { ...series, entryCount: 1 });
    }
  }

  return [...bySeries.values()];
});

/**
 * Whether the user has at least one completed anime in *each* of the given
 * series. Scoped to the requested series only — does not load the full
 * completed library the way getCompletedSeriesForUser does.
 */
export async function userHasCompletedSeries(
  userId: string,
  seriesIds: string[],
): Promise<boolean> {
  if (seriesIds.length === 0) return false;

  const supabase = await createClient();

  // The anime that belong to the requested series.
  const { data: maps, error: mapsError } = await supabase
    .from("anime_series_map")
    .select("anime_id, series_id")
    .in("series_id", seriesIds);

  if (mapsError) throw new Error(mapsError.message);
  if (!maps?.length) return false;

  // Of those, the ones the user has completed.
  const { data: completed, error: entriesError } = await supabase
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in(
      "anime_id",
      maps.map((row) => row.anime_id),
    );

  if (entriesError) throw new Error(entriesError.message);

  const completedAnime = new Set((completed ?? []).map((row) => row.anime_id));
  const coveredSeries = new Set(
    maps
      .filter((row) => completedAnime.has(row.anime_id))
      .map((row) => row.series_id),
  );

  return seriesIds.every((id) => coveredSeries.has(id));
}
