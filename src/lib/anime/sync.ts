import { anilistQuery } from "@/lib/anilist/client";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { ANIME_DETAIL_QUERY } from "@/lib/anilist/queries";
import type { AniListMediaResult } from "@/lib/anilist/types";
import { syncAnimeEmbedding } from "@/lib/recommendations/sync-anime-embedding";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

/**
 * Writes to the shared `anime` catalog go through the service-role admin client:
 * authenticated users can no longer write `anime` directly (RLS), so a user
 * can't corrupt the global catalog by calling PostgREST with the publishable key.
 * Server-only — never import from a client component.
 */
export async function syncAnimeFromAnilist(
  anilistId: number,
): Promise<Tables<"anime">> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  const staleMs = 7 * 24 * 60 * 60 * 1000;
  if (existing?.metadata_updated_at) {
    const age = Date.now() - new Date(existing.metadata_updated_at).getTime();
    if (age < staleMs) {
      void ensureAnimeSeriesMapping(existing).catch(() => undefined);
      void syncAnimeEmbedding(existing).catch(() => undefined);
      return existing;
    }
  }

  const result = await anilistQuery<AniListMediaResult>(ANIME_DETAIL_QUERY, {
    id: anilistId,
  });

  if (!result.Media) {
    throw new Error("Anime not found on AniList");
  }

  const row = mapAniListMediaToAnimeRow(result.Media);

  const { data, error } = await supabase
    .from("anime")
    .upsert(row, { onConflict: "anilist_id" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cache anime metadata");
  }

  void ensureAnimeSeriesMapping(data).catch(() => undefined);
  void syncAnimeEmbedding(data).catch(() => undefined);

  return data;
}
