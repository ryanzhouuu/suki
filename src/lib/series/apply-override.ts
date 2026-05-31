import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/types/database";

import {
  consolidateSeriesReferences,
  deleteOrphanSeries,
  recomputeUsersForSeries,
} from "./consolidate";
import { ensureAnimeSeriesMapping, resolveSeriesForAnilistId } from "./resolver";

export type ApplyOverrideResult = {
  seriesId: string | null;
  canonicalTitle: string | null;
  previousSeriesId: string | null;
  orphanSeriesDeleted: boolean;
  consolidate: Awaited<ReturnType<typeof consolidateSeriesReferences>> | null;
  usersRecomputed: number;
};

async function getMappedSeriesId(anilistId: number): Promise<string | null> {
  const admin = createAdminClient();
  const { data: anime } = await admin
    .from("anime")
    .select("id")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (!anime) return null;

  const { data: map } = await admin
    .from("anime_series_map")
    .select("series_id")
    .eq("anime_id", anime.id)
    .maybeSingle();

  return map?.series_id ?? null;
}

/**
 * Re-resolve mapping for one AniList id, merge ranking data off the old series row,
 * delete unused series rows, and recompute affected user rankings.
 */
export async function applySeriesOverrideForAnilistId(
  anilistId: number,
): Promise<ApplyOverrideResult> {
  const admin = createAdminClient();
  const previousSeriesId = await getMappedSeriesId(anilistId);

  const { data: anime } = await admin
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  let series: Tables<"series">;
  if (anime) {
    const resolved = await ensureAnimeSeriesMapping(anime);
    series = resolved.series;
  } else {
    series = await resolveSeriesForAnilistId(anilistId);
  }

  const newSeriesId = series.id;
  let consolidate = null;
  let orphanSeriesDeleted = false;

  if (previousSeriesId && previousSeriesId !== newSeriesId) {
    consolidate = await consolidateSeriesReferences(previousSeriesId, newSeriesId);
    orphanSeriesDeleted = await deleteOrphanSeries(admin, previousSeriesId);
  }

  const usersRecomputed = await recomputeUsersForSeries(
    [previousSeriesId, newSeriesId].filter((id): id is string => Boolean(id)),
  );

  return {
    seriesId: newSeriesId,
    canonicalTitle: series.canonical_title,
    previousSeriesId,
    orphanSeriesDeleted,
    consolidate,
    usersRecomputed,
  };
}

export async function upsertSeriesGroupOverride(
  row: TablesInsert<"series_group_overrides">,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("series_group_overrides").upsert(row, {
    onConflict: "anilist_id",
  });
  if (error) throw new Error(error.message);
}

export async function deleteSeriesGroupOverride(anilistId: number): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("series_group_overrides")
    .delete()
    .eq("anilist_id", anilistId);
  if (error) throw new Error(error.message);
}
