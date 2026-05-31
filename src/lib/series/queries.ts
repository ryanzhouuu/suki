import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type SeriesWithEntryCount = Tables<"series"> & {
  entryCount: number;
};

/** Distinct series the user has at least one completed entry for. */
export async function getCompletedSeriesForUser(
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
}

export async function userHasCompletedSeries(
  userId: string,
  seriesIds: string[],
): Promise<boolean> {
  if (seriesIds.length === 0) return false;
  const completed = await getCompletedSeriesForUser(userId);
  const found = new Set(completed.map((s) => s.id));
  return seriesIds.every((id) => found.has(id));
}
