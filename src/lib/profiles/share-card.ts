import { createHash } from "node:crypto";

import { cache } from "react";

import { RANKING_ALGORITHM_VERSION, type ProfileVisibility } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

/** Number of top-ranked series covers featured on the share card. */
export const SHARE_CARD_TOP_COVERS = 6;
/** Number of genres surfaced on the share card. */
export const SHARE_CARD_TOP_GENRES = 3;

export type ShareCardCover = {
  seriesId: string;
  coverUrl: string | null;
  title: string;
};

export type ShareCardData = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  topGenres: string[];
  completedCount: number;
  covers: ShareCardCover[];
  isPublic: boolean;
  /** Cache-busting token; "generic" for non-public cards. */
  rankingHash: string;
};

/** One top-ranked series with the genres of its mapped anime. */
export type ShareRankingRow = {
  seriesId: string;
  computedAt: string;
  coverUrl: string | null;
  title: string;
  genres: string[];
};

/** Pure: only fully public profiles render real data into a public OG card. */
export function isCardPublic(visibility: ProfileVisibility): boolean {
  return visibility === "public";
}

/**
 * Pure, stable token over the ranking state. Changes whenever the ranking is
 * recomputed (`computedAt`) or reordered (`seriesIds`), so it can bust
 * third-party unfurl caches and the CDN cache key.
 */
export function computeRankingHash(input: {
  algorithmVersion: string;
  computedAt: string | null;
  seriesIds: string[];
}): string {
  const payload = [
    input.algorithmVersion,
    input.computedAt ?? "",
    ...input.seriesIds,
  ].join("|");
  return createHash("sha1").update(payload).digest("hex").slice(0, 12);
}

/** Pure: build the public share card from raw ranking rows + profile fields. */
export function mapShareCard(input: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  algorithmVersion: string;
  completedCount: number;
  rankings: ShareRankingRow[];
}): ShareCardData {
  const top = input.rankings.slice(0, SHARE_CARD_TOP_COVERS);

  const covers: ShareCardCover[] = top.map((row) => ({
    seriesId: row.seriesId,
    coverUrl: row.coverUrl,
    title: row.title,
  }));

  const genreCounts = new Map<string, number>();
  for (const row of input.rankings) {
    for (const genre of row.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, SHARE_CARD_TOP_GENRES)
    .map(([genre]) => genre);

  const computedAt = input.rankings.reduce<string | null>((max, row) => {
    if (!max || row.computedAt > max) return row.computedAt;
    return max;
  }, null);

  return {
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    topGenres,
    completedCount: input.completedCount,
    covers,
    isPublic: true,
    rankingHash: computeRankingHash({
      algorithmVersion: input.algorithmVersion,
      computedAt,
      seriesIds: input.rankings.map((r) => r.seriesId),
    }),
  };
}

function nonPublicCard(
  profile: Pick<
    Tables<"profiles">,
    "username" | "display_name" | "avatar_url"
  >,
): ShareCardData {
  return {
    username: profile.username,
    displayName: profile.display_name || profile.username,
    avatarUrl: profile.avatar_url,
    topGenres: [],
    completedCount: 0,
    covers: [],
    isPublic: false,
    rankingHash: "generic",
  };
}

/**
 * Lean data source for the profile share card (OG image + metadata). Avoids the
 * heavy {@link import("./queries").getPublicProfileData} path. Returns `null`
 * when the profile does not exist; for non-public profiles it short-circuits
 * with empty data so nothing private can leak into a public OG image.
 */
/** Union of genres across all anime mapped to each series (cookieless read). */
async function genresBySeriesIds(
  supabase: ReturnType<typeof createAdminClient>,
  seriesIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (seriesIds.length === 0) return result;

  const { data } = await supabase
    .from("anime_series_map")
    .select("series_id, anime(genres)")
    .in("series_id", seriesIds);

  for (const row of data ?? []) {
    const anime = row.anime as { genres: string[] } | null;
    if (!anime?.genres?.length) continue;
    const merged = new Set([...(result.get(row.series_id) ?? []), ...anime.genres]);
    result.set(row.series_id, [...merged]);
  }

  return result;
}

/**
 * Lean data source for the profile share card (OG image + metadata). Uses a
 * cookieless admin client so it works in both request and static-metadata
 * contexts; only ever reads public data (non-public profiles short-circuit
 * before any ranking query, so nothing private can leak).
 */
export const getShareCardData = cache(async function getShareCardData(
  username: string,
): Promise<ShareCardData | null> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, profile_visibility, user_id")
    .ilike("username", username)
    .maybeSingle();
  if (!profile) return null;

  if (!isCardPublic(profile.profile_visibility)) {
    return nonPublicCard(profile);
  }

  const [rankingsResult, completedResult] = await Promise.all([
    supabase
      .from("derived_series_rankings")
      .select("series_id, computed_at, series(cover_image_url, canonical_title)")
      .eq("user_id", profile.user_id)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
      .order("rank", { ascending: true })
      .limit(SHARE_CARD_TOP_COVERS),
    supabase
      .from("user_anime_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("status", "completed"),
  ]);

  const rows = rankingsResult.data ?? [];
  const seriesIds = rows.map((r) => r.series_id);
  const genresMap = await genresBySeriesIds(supabase, seriesIds);

  const rankings: ShareRankingRow[] = rows.map((row) => {
    const series = row.series as {
      cover_image_url: string | null;
      canonical_title: string;
    } | null;
    return {
      seriesId: row.series_id,
      computedAt: row.computed_at,
      coverUrl: series?.cover_image_url ?? null,
      title: series?.canonical_title ?? "",
      genres: genresMap.get(row.series_id) ?? [],
    };
  });

  return mapShareCard({
    username: profile.username,
    displayName: profile.display_name || profile.username,
    avatarUrl: profile.avatar_url,
    algorithmVersion: RANKING_ALGORITHM_VERSION,
    completedCount: completedResult.count ?? 0,
    rankings,
  });
});
