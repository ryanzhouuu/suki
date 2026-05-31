import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

/**
 * Ensure every anime referenced by the user's completed entries has a series mapping.
 */
export async function repairSeriesMappingsForUser(userId: string): Promise<number> {
  const admin = createAdminClient();

  const { data: entries, error } = await admin
    .from("user_anime_entries")
    .select("anime_id, anime(*)")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) throw new Error(error.message);

  let repaired = 0;

  for (const row of entries ?? []) {
    const anime = row.anime as Tables<"anime"> | Tables<"anime">[] | null;
    const record = Array.isArray(anime) ? anime[0] : anime;
    if (!record) continue;

    await ensureAnimeSeriesMapping(record);
    repaired += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  return repaired;
}

/** Backfill mappings for all anime rows missing a series link. */
export async function repairAllMissingSeriesMappings(): Promise<{
  mapped: number;
  failed: number;
}> {
  const admin = createAdminClient();
  const { data: allAnime } = await admin.from("anime").select("*");
  const rows = (allAnime ?? []) as Tables<"anime">[];

  let mapped = 0;
  let failed = 0;

  for (const anime of rows) {
    const { data: existing } = await admin
      .from("anime_series_map")
      .select("anime_id")
      .eq("anime_id", anime.id)
      .maybeSingle();
    if (existing) continue;

    try {
      await ensureAnimeSeriesMapping(anime);
      mapped += 1;
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      failed += 1;
    }
  }

  return { mapped, failed };
}
