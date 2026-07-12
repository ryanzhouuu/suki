import "server-only";

import { runResilientOperation } from "@/lib/resilience/operation";
import { createClient } from "@/lib/supabase/server";

export async function loadRankingGenres(userId: string, seriesIds: string[]) {
  return runResilientOperation(
    {
      route: "/ranking",
      operation: "load_series_genres",
      dependency: "supabase",
      userId,
    },
    async () => {
      const genresBySeriesId = new Map<string, string[]>();
      if (seriesIds.length === 0) return genresBySeriesId;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("anime_series_map")
        .select("series_id, anime(genres)")
        .in("series_id", seriesIds);

      if (error) throw error;

      for (const row of data ?? []) {
        const anime = row.anime as { genres: string[] } | null;
        if (!anime?.genres.length) continue;
        const genres = genresBySeriesId.get(row.series_id) ?? [];
        genresBySeriesId.set(row.series_id, [
          ...new Set([...genres, ...anime.genres]),
        ]);
      }

      return genresBySeriesId;
    },
  );
}
