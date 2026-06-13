import { createClient } from "@/lib/supabase/server";
import type { AnimeEntryStatus } from "@/lib/constants";
import type { SeriesRef } from "@/lib/library/group";
import type { Tables } from "@/types/database";

export type LibraryEntry = Tables<"user_anime_entries"> & {
  anime: Tables<"anime">;
};

export async function getUserLibraryEntries(
  userId: string,
  status?: AnimeEntryStatus,
): Promise<LibraryEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("user_anime_entries")
    .select("*, anime(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LibraryEntry[];
}

/**
 * Resolve each anime id to its mapped series (canonical title/cover) for the
 * "group by show" view. Anime with no mapping are simply absent from the map.
 */
export async function getSeriesRefsByAnimeIds(
  animeIds: string[],
): Promise<Map<string, SeriesRef>> {
  const result = new Map<string, SeriesRef>();
  if (animeIds.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anime_series_map")
    .select("anime_id, series(id, canonical_title, cover_image_url, slug)")
    .in("anime_id", animeIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const series = row.series as SeriesRef | null;
    if (series) {
      result.set(row.anime_id, series);
    }
  }

  return result;
}

export async function getUserEntryForAnime(
  userId: string,
  animeId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_anime_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();

  return data;
}
