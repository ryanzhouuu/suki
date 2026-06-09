import { createClient } from "@/lib/supabase/server";

import type { ImportJobProgress } from "./types";

/** Job statuses during which a user's ranking must stay gated. */
const PREPARING_STATUSES = ["importing", "series_backfill"] as const;

/**
 * The user's active import job while it is still writing entries or running the
 * series-mapping backfill. The ranking surface should show a "preparing…" state
 * (instead of a half-mapped ranking) whenever this is non-null.
 */
export async function getPreparingImportJob(
  userId: string,
): Promise<ImportJobProgress | null> {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("anime_import_jobs")
    .select("*")
    .eq("user_id", userId)
    .in("status", [...PREPARING_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!job) return null;
  return {
    id: job.id,
    source: job.source,
    status: job.status,
    total: job.total,
    processed: job.processed,
    matched: job.matched,
    needsReview: job.needs_review_count,
    unmatched: job.unmatched,
    imported: job.imported,
    skipped: job.skipped,
    error: job.error,
  };
}

export async function isRankingPreparing(userId: string): Promise<boolean> {
  return (await getPreparingImportJob(userId)) !== null;
}
