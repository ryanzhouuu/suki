"use server";

import { revalidatePath } from "next/cache";

import { requireSeriesAdmin } from "@/lib/admin/access";
import { searchAniListAnime } from "@/lib/anilist/search";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import {
  applySeriesOverrideForAnilistId,
  deleteSeriesGroupOverride,
  upsertSeriesGroupOverride,
} from "@/lib/series/apply-override";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/types/database";

export type SeriesAdminActionState = {
  error?: string;
  success?: string;
  details?: string;
};

export type OverrideListItem = {
  override: Tables<"series_group_overrides">;
  animeTitle: string | null;
  targetSeriesTitle: string | null;
};

export type AdminAnimeSearchHit = {
  anilistId: number;
  title: string;
  format: string | null;
  source: "cache" | "anilist";
  currentSeriesTitle: string | null;
  currentSeriesId: string | null;
};

export type AdminSeriesSearchHit = {
  id: string;
  canonicalTitle: string;
  anilistPrimaryId: number;
  memberCount: number;
};

export async function listSeriesOverrides(): Promise<OverrideListItem[]> {
  await requireSeriesAdmin();
  const admin = createAdminClient();

  const { data: overrides, error } = await admin
    .from("series_group_overrides")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const items: OverrideListItem[] = [];

  for (const override of overrides ?? []) {
    const { data: anime } = await admin
      .from("anime")
      .select("english_title, romaji_title")
      .eq("anilist_id", override.anilist_id)
      .maybeSingle();

    let targetSeriesTitle: string | null = null;
    if (override.target_series_id) {
      const { data: series } = await admin
        .from("series")
        .select("canonical_title")
        .eq("id", override.target_series_id)
        .maybeSingle();
      targetSeriesTitle = series?.canonical_title ?? null;
    } else if (override.target_anilist_primary_id) {
      const { data: series } = await admin
        .from("series")
        .select("canonical_title")
        .eq("anilist_primary_id", override.target_anilist_primary_id)
        .maybeSingle();
      targetSeriesTitle = series?.canonical_title ?? null;
    }

    items.push({
      override,
      animeTitle:
        anime?.english_title ?? anime?.romaji_title ?? null,
      targetSeriesTitle,
    });
  }

  return items;
}

export async function searchAnimeForSeriesAdmin(
  query: string,
): Promise<AdminAnimeSearchHit[]> {
  await requireSeriesAdmin();
  const admin = createAdminClient();
  const hits: AdminAnimeSearchHit[] = [];
  const seen = new Set<number>();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const numericId = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;

  if (numericId) {
    const { data: byId } = await admin
      .from("anime")
      .select("anilist_id, english_title, romaji_title, format")
      .eq("anilist_id", numericId)
      .maybeSingle();

    if (byId) {
      seen.add(byId.anilist_id);
      const mapping = await loadAnimeSeriesMapping(byId.anilist_id);
      hits.push({
        anilistId: byId.anilist_id,
        title: byId.english_title ?? byId.romaji_title ?? `Anime ${byId.anilist_id}`,
        format: byId.format,
        source: "cache",
        ...mapping,
      });
    }
  }

  const { data: cached } = await admin
    .from("anime")
    .select("anilist_id, english_title, romaji_title, format")
    .or(
      `english_title.ilike.%${escapeIlike(trimmed)}%,romaji_title.ilike.%${escapeIlike(trimmed)}%`,
    )
    .limit(12);

  for (const row of cached ?? []) {
    if (seen.has(row.anilist_id)) continue;
    seen.add(row.anilist_id);
    const mapping = await loadAnimeSeriesMapping(row.anilist_id);
    hits.push({
      anilistId: row.anilist_id,
      title: row.english_title ?? row.romaji_title ?? `Anime ${row.anilist_id}`,
      format: row.format,
      source: "cache",
      ...mapping,
    });
  }

  if (hits.length < 8) {
    const remote = await searchAniListAnime(trimmed, 10);
    for (const media of remote) {
      if (seen.has(media.id)) continue;
      seen.add(media.id);
      const mapping = await loadAnimeSeriesMapping(media.id);
      hits.push({
        anilistId: media.id,
        title: getAniListDisplayTitle(media.title),
        format: media.format,
        source: "anilist",
        ...mapping,
      });
    }
  }

  return hits.slice(0, 16);
}

export async function searchSeriesForSeriesAdmin(
  query: string,
): Promise<AdminSeriesSearchHit[]> {
  await requireSeriesAdmin();
  const admin = createAdminClient();
  const trimmed = query.trim();
  if (!trimmed) return [];

  let builder = admin
    .from("series")
    .select("id, canonical_title, anilist_primary_id")
    .order("canonical_title")
    .limit(16);

  if (/^\d+$/.test(trimmed)) {
    builder = builder.eq("anilist_primary_id", Number.parseInt(trimmed, 10));
  } else {
    builder = builder.ilike("canonical_title", `%${escapeIlike(trimmed)}%`);
  }

  const { data: seriesRows, error } = await builder;
  if (error) throw new Error(error.message);

  const results: AdminSeriesSearchHit[] = [];
  for (const series of seriesRows ?? []) {
    const { count } = await admin
      .from("anime_series_map")
      .select("*", { count: "exact", head: true })
      .eq("series_id", series.id);

    results.push({
      id: series.id,
      canonicalTitle: series.canonical_title,
      anilistPrimaryId: series.anilist_primary_id,
      memberCount: count ?? 0,
    });
  }

  return results;
}

export async function saveSeriesOverride(
  _prev: SeriesAdminActionState,
  formData: FormData,
): Promise<SeriesAdminActionState> {
  await requireSeriesAdmin();

  const anilistId = Number.parseInt(String(formData.get("anilist_id") ?? ""), 10);
  const action = String(formData.get("action") ?? "") as TablesInsert<"series_group_overrides">["action"];
  const targetSeriesId = String(formData.get("target_series_id") ?? "").trim() || null;
  const targetAnilistPrimaryRaw = String(
    formData.get("target_anilist_primary_id") ?? "",
  ).trim();
  const targetAnilistPrimaryId = targetAnilistPrimaryRaw
    ? Number.parseInt(targetAnilistPrimaryRaw, 10)
    : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isFinite(anilistId) || anilistId <= 0) {
    return { error: "Valid AniList ID is required." };
  }

  const validActions = [
    "force_series",
    "force_singleton",
    "exclude_from_auto_group",
  ] as const;

  if (!validActions.includes(action)) {
    return { error: "Invalid override action." };
  }

  if (action === "force_series" && !targetSeriesId && !targetAnilistPrimaryId) {
    return {
      error: "Force series requires a target series or AniList primary ID.",
    };
  }

  if (
    action !== "force_series" &&
    (targetSeriesId || targetAnilistPrimaryId)
  ) {
    return { error: "Target is only used for force series overrides." };
  }

  try {
    await upsertSeriesGroupOverride({
      anilist_id: anilistId,
      action,
      target_series_id: action === "force_series" ? targetSeriesId : null,
      target_anilist_primary_id:
        action === "force_series" ? targetAnilistPrimaryId : null,
      notes,
    });

    const result = await applySeriesOverrideForAnilistId(anilistId);

    revalidatePath("/admin/series");
    revalidatePath("/ranking");

    const detailParts = [
      result.canonicalTitle
        ? `Mapped to “${result.canonicalTitle}”.`
        : null,
      result.orphanSeriesDeleted ? "Removed unused series row." : null,
      result.consolidate
        ? `Merged ${result.consolidate.comparisonsUpserted} comparison(s); removed ${result.consolidate.comparisonsRemoved} stale row(s).`
        : null,
      result.usersRecomputed > 0
        ? `Recomputed rankings for ${result.usersRecomputed} user(s).`
        : null,
    ].filter(Boolean);

    return {
      success: "Override saved and applied.",
      details: detailParts.join(" "),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save override.",
    };
  }
}

export async function removeSeriesOverride(
  anilistId: number,
): Promise<SeriesAdminActionState> {
  await requireSeriesAdmin();

  if (!Number.isFinite(anilistId) || anilistId <= 0) {
    return { error: "Invalid AniList ID." };
  }

  try {
    await deleteSeriesGroupOverride(anilistId);
    const result = await applySeriesOverrideForAnilistId(anilistId);

    revalidatePath("/admin/series");
    revalidatePath("/ranking");

    return {
      success: "Override removed; auto-grouping re-applied.",
      details: [
        result.canonicalTitle
          ? `Now mapped to “${result.canonicalTitle}”.`
          : null,
        result.orphanSeriesDeleted ? "Removed unused series row." : null,
        result.usersRecomputed > 0
          ? `Recomputed rankings for ${result.usersRecomputed} user(s).`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to remove override.",
    };
  }
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function loadAnimeSeriesMapping(anilistId: number): Promise<{
  currentSeriesTitle: string | null;
  currentSeriesId: string | null;
}> {
  const admin = createAdminClient();
  const { data: anime } = await admin
    .from("anime")
    .select("id")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (!anime) {
    return { currentSeriesTitle: null, currentSeriesId: null };
  }

  const { data: map } = await admin
    .from("anime_series_map")
    .select("series_id, series(canonical_title)")
    .eq("anime_id", anime.id)
    .maybeSingle();

  const series = map?.series as { canonical_title: string } | null;
  return {
    currentSeriesId: map?.series_id ?? null,
    currentSeriesTitle: series?.canonical_title ?? null,
  };
}
