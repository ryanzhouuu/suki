import { createClient } from "@/lib/supabase/server";

/** Union of genres across all anime mapped to each series. */
export async function getGenresBySeriesIds(
  seriesIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (seriesIds.length === 0) return result;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anime_series_map")
    .select("series_id, anime(genres)")
    .in("series_id", seriesIds);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const seriesId = row.series_id;
    const anime = row.anime as { genres: string[] } | null;
    if (!anime?.genres?.length) continue;

    const existing = result.get(seriesId) ?? [];
    const merged = new Set([...existing, ...anime.genres]);
    result.set(seriesId, [...merged]);
  }

  return result;
}
