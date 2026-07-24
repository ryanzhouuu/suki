import { buildDigestSummary, parseDigestSummary } from "@/lib/digest/aggregate";
import {
  getLatestCompletedWeek,
  isDigestWindowEligible,
  type DigestWindow,
} from "@/lib/digest/window";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";

export type DigestSnapshot = Omit<Tables<"weekly_digests">, "summary"> & {
  summary: NonNullable<ReturnType<typeof parseDigestSummary>>;
};

function eventMetadata(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

async function loadSnapshot(
  userId: string,
  weekStart: string,
): Promise<DigestSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_digests")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const summary = parseDigestSummary(data.summary);
  if (!summary) throw new Error("Unsupported weekly digest content");
  return { ...data, summary };
}

async function generateSnapshot(
  userId: string,
  window: DigestWindow,
): Promise<DigestSnapshot> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("user_events")
    .select("id, event_type, anime_id, metadata, created_at")
    .eq("user_id", userId)
    .gte("created_at", window.startUtc)
    .lt("created_at", window.endUtc)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const summary = buildDigestSummary(
    (rows ?? []).map((row) => ({
      id: row.id,
      eventType: row.event_type,
      animeId: row.anime_id,
      metadata: eventMetadata(row.metadata),
      createdAt: row.created_at,
    })),
  );
  const { error: insertError } = await supabase.from("weekly_digests").upsert(
    {
      user_id: userId,
      week_start: window.weekStart,
      week_end: window.weekEnd,
      timezone: window.timezone,
      content_version: summary.version,
      summary: summary as unknown as Json,
    },
    { onConflict: "user_id,week_start", ignoreDuplicates: true },
  );
  if (insertError) throw insertError;

  const snapshot = await loadSnapshot(userId, window.weekStart);
  if (!snapshot) throw new Error("Weekly digest snapshot was not persisted");
  return snapshot;
}

export async function getOrCreateLatestDigest(
  userId: string,
  timezone: string | null,
  now = new Date(),
): Promise<DigestSnapshot | null> {
  const window = getLatestCompletedWeek(now, timezone);
  if (!isDigestWindowEligible(window)) return null;
  return (
    (await loadSnapshot(userId, window.weekStart)) ??
    generateSnapshot(userId, window)
  );
}

export async function resolveDigestHighlights(snapshot: DigestSnapshot) {
  const ids = snapshot.summary.highlights.map((highlight) => highlight.animeId);
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anime")
    .select("id, anilist_id, english_title, romaji_title, cover_image_url")
    .in("id", ids);
  if (error) throw error;
  const anime = new Map((data ?? []).map((row) => [row.id, row]));
  return snapshot.summary.highlights.flatMap((highlight) => {
    const row = anime.get(highlight.animeId);
    return row ? [{ ...highlight, anime: row }] : [];
  });
}
