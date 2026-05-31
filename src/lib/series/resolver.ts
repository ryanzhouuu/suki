import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/types/database";

import { fetchFranchiseCluster, pickPrimaryMedia, type FranchiseMediaNode } from "./graph";
import {
  findExistingSeriesForFranchise,
  findSeriesByFranchiseRoot,
  franchiseRootForCluster,
} from "./merge";
import { displayTitleFromAniList, franchiseRootFromTitle, slugifySeriesTitle } from "./title";

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
  const root = franchiseRootFromTitle(title);
  const admin = createAdminClient();

  const existing = await findSeriesByFranchiseRoot(admin, root);
  if (existing) return existing;

  return upsertSeriesFromPrimary(anilistId, root, coverImageUrl);
}

async function syncSeriesCanonicalTitle(
  admin: ReturnType<typeof createAdminClient>,
  series: Tables<"series">,
  canonicalTitle: string,
): Promise<Tables<"series">> {
  if (series.canonical_title === canonicalTitle) return series;
  await admin
    .from("series")
    .update({ canonical_title: canonicalTitle })
    .eq("id", series.id);
  return { ...series, canonical_title: canonicalTitle };
}

async function resolveFromCluster(
  cluster: FranchiseMediaNode[],
  fallbackTitle: string,
  fallbackCoverUrl: string | null,
): Promise<Tables<"series">> {
  const admin = createAdminClient();
  const primary = pickPrimaryMedia(cluster);
  const franchiseRoot = franchiseRootForCluster(cluster, fallbackTitle);
  const primaryRoot = franchiseRootFromTitle(
    primary.title.english || primary.title.romaji || fallbackTitle,
  );
  const canonicalTitle =
    franchiseRoot ||
    primaryRoot ||
    displayTitleFromAniList(primary.title);

  const byRoot = await findSeriesByFranchiseRoot(admin, franchiseRoot);
  if (byRoot) {
    return syncSeriesCanonicalTitle(admin, byRoot, canonicalTitle);
  }

  const existing = await findExistingSeriesForFranchise(
    admin,
    cluster,
    franchiseRoot,
  );
  if (existing) {
    return syncSeriesCanonicalTitle(admin, existing, canonicalTitle);
  }

  const { data: byPrimary } = await admin
    .from("series")
    .select("*")
    .eq("anilist_primary_id", primary.anilistId)
    .maybeSingle();

  if (byPrimary) {
    return syncSeriesCanonicalTitle(admin, byPrimary, canonicalTitle);
  }

  return upsertSeriesFromPrimary(
    primary.anilistId,
    canonicalTitle,
    primary.coverImageUrl ?? fallbackCoverUrl,
  );
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
  fallbackTitle: string,
  fallbackCoverUrl: string | null,
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
    return resolveSingleton(targetAnilistPrimaryId, fallbackTitle, fallbackCoverUrl);
  }

  return resolveFromCluster(cluster, fallbackTitle, fallbackCoverUrl);
}

/**
 * Resolve franchise grouping for an AniList media id and upsert canonical series.
 */
export async function resolveSeriesForAnilistId(
  anilistId: number,
  options?: {
    fallbackTitle?: string;
    fallbackCoverUrl?: string | null;
  },
): Promise<Tables<"series">> {
  const title = options?.fallbackTitle ?? `Anime ${anilistId}`;
  const cover = options?.fallbackCoverUrl ?? null;
  const override = await loadOverride(anilistId);

  if (override?.action === "force_singleton") {
    return resolveSingleton(anilistId, title, cover);
  }

  if (override?.action === "exclude_from_auto_group") {
    return resolveSingleton(anilistId, title, cover);
  }

  if (override?.action === "force_series") {
    if (override.target_series_id) {
      return resolveByTargetSeriesId(override.target_series_id);
    }
    if (override.target_anilist_primary_id) {
      return resolveByTargetAnilistPrimary(
        override.target_anilist_primary_id,
        title,
        cover,
      );
    }
  }

  try {
    const cluster = await fetchFranchiseCluster(anilistId);
    if (cluster.length === 0) {
      return resolveSingleton(anilistId, title, cover);
    }

    return resolveFromCluster(cluster, title, cover);
  } catch {
    return resolveSingleton(anilistId, title, cover);
  }
}

export async function ensureAnimeSeriesMapping(
  anime: Tables<"anime">,
): Promise<ResolvedSeries> {
  const admin = createAdminClient();
  const title =
    anime.english_title || anime.romaji_title || `Anime ${anime.anilist_id}`;

  const override = await loadOverride(anime.anilist_id);
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
