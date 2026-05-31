import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

import { EMBEDDING_MODEL } from "./constants";
import { buildAnimeEmbeddingText } from "./embedding-text";
import {
  createEmbeddingProvider,
  formatEmbeddingError,
  isEmbeddingConfigured,
} from "./embedding-provider";
import { hashText } from "./hash";

type AnimeWithSeries = Tables<"anime"> & {
  anime_series_map:
    | { series: { canonical_title: string } | null }
    | { series: { canonical_title: string } | null }[]
    | null;
};

function seriesTitleFromRow(row: AnimeWithSeries): string | null {
  const map = row.anime_series_map;
  if (!map) return null;
  const entry = Array.isArray(map) ? map[0] : map;
  return entry?.series?.canonical_title ?? null;
}

export async function syncAnimeEmbedding(
  anime: Tables<"anime">,
  seriesTitle?: string | null,
): Promise<void> {
  if (!isEmbeddingConfigured()) return;

  const metadataText = buildAnimeEmbeddingText(anime, seriesTitle);
  const metadataHash = hashText(metadataText);

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("anime_embeddings")
    .select("metadata_hash")
    .eq("anime_id", anime.id)
    .maybeSingle();

  if (existing?.metadata_hash === metadataHash) return;

  const provider = createEmbeddingProvider();
  const [embedding] = await provider.embed([metadataText]);

  const { error } = await admin.from("anime_embeddings").upsert(
    {
      anime_id: anime.id,
      embedding_model: EMBEDDING_MODEL,
      embedding,
      metadata_text: metadataText,
      metadata_hash: metadataHash,
    },
    { onConflict: "anime_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export type BackfillEmbeddingsResult = {
  synced: number;
  animeTotal: number;
  embeddedTotal: number;
  missing: number;
};

/** Embed cached anime rows that lack embeddings (up to limit). */
export async function backfillMissingAnimeEmbeddings(
  limit = 100,
): Promise<BackfillEmbeddingsResult> {
  const empty = { synced: 0, animeTotal: 0, embeddedTotal: 0, missing: 0 };
  if (!isEmbeddingConfigured()) return empty;

  const admin = createAdminClient();

  const { count: animeTotal, error: countAnimeError } = await admin
    .from("anime")
    .select("*", { count: "exact", head: true });
  const { count: embeddedTotal, error: countEmbError } = await admin
    .from("anime_embeddings")
    .select("*", { count: "exact", head: true });

  if (countAnimeError || countEmbError) return empty;

  const totals = {
    animeTotal: animeTotal ?? 0,
    embeddedTotal: embeddedTotal ?? 0,
    missing: Math.max(0, (animeTotal ?? 0) - (embeddedTotal ?? 0)),
  };

  const { data: allAnime, error: animeError } = await admin
    .from("anime")
    .select("id")
    .order("metadata_updated_at", { ascending: false })
    .limit(limit * 3);

  if (animeError || !allAnime?.length) {
    return { synced: 0, ...totals };
  }

  const ids = allAnime.map((a) => a.id);
  const { data: embedded } = await admin
    .from("anime_embeddings")
    .select("anime_id")
    .in("anime_id", ids);

  const embeddedSet = new Set((embedded ?? []).map((r) => r.anime_id));
  const missingIds = ids.filter((id) => !embeddedSet.has(id)).slice(0, limit);

  if (missingIds.length === 0) {
    return { synced: 0, ...totals };
  }

  const { data: rows, error } = await admin
    .from("anime")
    .select("*, anime_series_map(series(canonical_title))")
    .in("id", missingIds);

  if (error || !rows?.length) {
    return { synced: 0, ...totals };
  }

  let synced = 0;
  let failed = 0;

  for (const row of rows as AnimeWithSeries[]) {
    try {
      await syncAnimeEmbedding(row, seriesTitleFromRow(row));
      synced += 1;
      if (synced % 5 === 0) {
        console.log(`  ${synced}/${rows.length} embedded`);
      }
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      failed += 1;
      const message = formatEmbeddingError(e);
      console.warn(`  Failed ${row.romaji_title}: ${message}`);
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        (e as { code?: string }).code === "insufficient_quota"
      ) {
        throw new Error(message);
      }
    }
  }

  if (failed > 0 && synced === 0) {
    throw new Error(
      `No embeddings were created (${failed} failed). Check OPENAI_API_KEY and billing.`,
    );
  }

  return { synced, ...totals };
}
