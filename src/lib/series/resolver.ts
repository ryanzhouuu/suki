import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/types/database";

import { fetchFranchiseCluster, pickPrimaryMedia } from "./graph";
import { displayTitleFromAniList, slugifySeriesTitle } from "./title";

export type ResolvedSeries = {
  series: Tables<"series">;
  mapSource: TablesInsert<"anime_series_map">["source"];
};

async function loadOverride(anilistId: number) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("series_group_overrides")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();
  return data;
}

async function upsertSeriesFromPrimary(
  primaryAnilistId: number,
  canonicalTitle: string,
  coverImageUrl: string | null,
): Promise<Tables<"series">> {
  const admin = createAdminClient();
  const slug = slugifySeriesTitle(canonicalTitle, primaryAnilistId);

  const row: TablesInsert<"series"> = {
    anilist_primary_id: primaryAnilistId,
    canonical_title: canonicalTitle,
    slug,
    cover_image_url: coverImageUrl,
  };

  const { data, error } = await admin
    .from("series")
    .upsert(row, { onConflict: "anilist_primary_id" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upsert series");
  }
  return data;
}

async function resolveSingleton(
  anilistId: number,
  title: string,
  coverImageUrl: string | null,
): Promise<Tables<"series">> {
  return upsertSeriesFromPrimary(anilistId, title, coverImageUrl);
}

async function resolveByTargetSeriesId(
  targetSeriesId: string,
): Promise<Tables<"series">> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("series")
    .select("*")
    .eq("id", targetSeriesId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Override series not found");
  return data;
}

async function resolveByTargetAnilistPrimary(
  targetAnilistPrimaryId: number,
): Promise<Tables<"series">> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("series")
    .select("*")
    .eq("anilist_primary_id", targetAnilistPrimaryId)
    .maybeSingle();

  if (data) return data;

  const cluster = await fetchFranchiseCluster(targetAnilistPrimaryId);
  if (cluster.length === 0) {
    return resolveSingleton(
      targetAnilistPrimaryId,
      `Anime ${targetAnilistPrimaryId}`,
      null,
    );
  }
  const primary = pickPrimaryMedia(cluster);
  const canonicalTitle = displayTitleFromAniList(primary.title);
  return upsertSeriesFromPrimary(
    primary.anilistId,
    canonicalTitle,
    primary.coverImageUrl,
  );
}

/**
 * Resolve franchise grouping for an AniList media id and upsert canonical series.
 */
export async function resolveSeriesForAnilistId(
  anilistId: number,
  options?: {
    /** Title/cover from already-synced anime row */
    fallbackTitle?: string;
    fallbackCoverUrl?: string | null;
  },
): Promise<Tables<"series">> {
  const override = await loadOverride(anilistId);

  if (override?.action === "force_singleton") {
    const title = options?.fallbackTitle ?? `Anime ${anilistId}`;
    return resolveSingleton(anilistId, title, options?.fallbackCoverUrl ?? null);
  }

  if (override?.action === "exclude_from_auto_group") {
    const title = options?.fallbackTitle ?? `Anime ${anilistId}`;
    return resolveSingleton(anilistId, title, options?.fallbackCoverUrl ?? null);
  }

  if (override?.action === "force_series") {
    if (override.target_series_id) {
      return resolveByTargetSeriesId(override.target_series_id);
    }
    if (override.target_anilist_primary_id) {
      return resolveByTargetAnilistPrimary(override.target_anilist_primary_id);
    }
  }

  const title = options?.fallbackTitle ?? `Anime ${anilistId}`;

  try {
    const cluster = await fetchFranchiseCluster(anilistId);
    if (cluster.length === 0) {
      return resolveSingleton(anilistId, title, options?.fallbackCoverUrl ?? null);
    }

    const primary = pickPrimaryMedia(cluster);
    const canonicalTitle = displayTitleFromAniList(primary.title);
    return upsertSeriesFromPrimary(
      primary.anilistId,
      canonicalTitle,
      primary.coverImageUrl ?? options?.fallbackCoverUrl ?? null,
    );
  } catch {
    return resolveSingleton(anilistId, title, options?.fallbackCoverUrl ?? null);
  }
}

export async function ensureAnimeSeriesMapping(
  anime: Tables<"anime">,
): Promise<ResolvedSeries> {
  const admin = createAdminClient();

  const { data: existingMap } = await admin
    .from("anime_series_map")
    .select("*, series(*)")
    .eq("anime_id", anime.id)
    .maybeSingle();

  const override = await loadOverride(anime.anilist_id);
  const forceRemap =
    override?.action === "force_series" ||
    override?.action === "force_singleton" ||
    override?.action === "exclude_from_auto_group";

  if (existingMap?.series && !forceRemap) {
    return {
      series: existingMap.series as Tables<"series">,
      mapSource: existingMap.source,
    };
  }

  const title =
    anime.english_title || anime.romaji_title || `Anime ${anime.anilist_id}`;
  const series = await resolveSeriesForAnilistId(anime.anilist_id, {
    fallbackTitle: title,
    fallbackCoverUrl: anime.cover_image_url,
  });

  let source: TablesInsert<"anime_series_map">["source"] = "anilist_auto";
  if (override) source = "manual_override";
  if (
    override?.action === "force_singleton" ||
    override?.action === "exclude_from_auto_group"
  ) {
    source = "singleton";
  }

  const { error } = await admin.from("anime_series_map").upsert(
    {
      anime_id: anime.id,
      series_id: series.id,
      source,
      confidence: override ? 1 : 0.85,
    },
    { onConflict: "anime_id" },
  );

  if (error) throw new Error(error.message);

  return { series, mapSource: source };
}
