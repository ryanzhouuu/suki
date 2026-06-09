import { enableAnilistQueryCache } from "@/lib/anilist/client";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { syncAnimeCatalogFromAnilist } from "@/lib/anime/catalog-sync";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { recomputeUserRanking } from "@/lib/ranking/recompute-series";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesUpdate } from "@/types/database";

import { stagedRowFromAniListEntry, stagedRowFromMal, dedupeStagedRows, toImportEntries } from "./staged";
import {
  IMPORT_BACKFILL_CHUNK_SIZE,
  IMPORT_BACKFILL_DELAY_MS,
  IMPORT_MATCH_CHUNK_SIZE,
  IMPORT_MAL_BATCH_SIZE,
  IMPORT_WRITE_CHUNK_SIZE,
} from "./constants";
import {
  fetchAniListUserList,
  resolveMalIdsToMedia,
  searchImportCandidates,
} from "./fetch";
import { matchPlainTextLine } from "./plaintext";
import { isPendingWorkStatus } from "./status";
import type {
  ImportJobProgress,
  ImportSourceInput,
  StagedRow,
} from "./types";

const MAX_RETRIES = 3;

type Admin = ReturnType<typeof createAdminClient>;
type ImportJob = Tables<"anime_import_jobs">;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStagedRows(job: ImportJob): StagedRow[] {
  return (job.staged_rows as unknown as StagedRow[]) ?? [];
}

function readSourceInput(job: ImportJob): ImportSourceInput {
  return job.source_input as unknown as ImportSourceInput;
}

function progressFromJob(job: ImportJob): ImportJobProgress {
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

function countMatchStates(rows: StagedRow[]) {
  let matched = 0;
  let needsReview = 0;
  let unmatched = 0;
  for (const row of rows) {
    if (row.matchState === "matched") matched++;
    else if (row.matchState === "needs_review") needsReview++;
    else unmatched++;
  }
  return { matched, needsReview, unmatched };
}

async function patchJob(
  admin: Admin,
  jobId: string,
  patch: TablesUpdate<"anime_import_jobs">,
): Promise<ImportJob> {
  const { data, error } = await admin
    .from("anime_import_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update import job");
  }
  return data;
}

async function loadJob(admin: Admin, jobId: string): Promise<ImportJob | null> {
  const { data } = await admin
    .from("anime_import_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  return data ?? null;
}

/** Ensure an `anime` row exists for a staged row; returns it (offline when possible). */
async function ensureAnimeRow(
  admin: Admin,
  row: StagedRow,
): Promise<Tables<"anime"> | null> {
  if (row.anilistId == null) return null;

  if (row.media) {
    const { data } = await admin
      .from("anime")
      .upsert(mapAniListMediaToAnimeRow(row.media), { onConflict: "anilist_id" })
      .select("*")
      .single();
    if (data) return data;
  }

  // Fallback (e.g. a manually-picked match with no staged media).
  try {
    return await syncAnimeCatalogFromAnilist(row.anilistId, {
      lightweightSeriesMapping: true,
      skipEmbedding: true,
    });
  } catch {
    return null;
  }
}

// --- Phase: parsing -------------------------------------------------------

async function parseAniListChunk(admin: Admin, job: ImportJob): Promise<ImportJob> {
  const input = readSourceInput(job);
  if (input.kind !== "anilist") throw new Error("Bad source input");

  const list = await fetchAniListUserList(input.username);
  const rows = dedupeStagedRows(
    list.entries.map((entry) => stagedRowFromAniListEntry(entry, list.scoreFormat)),
  );
  const counts = countMatchStates(rows);

  return patchJob(admin, job.id, {
    status: "needs_review",
    total: rows.length,
    processed: rows.length,
    matched: counts.matched,
    needs_review_count: counts.needsReview,
    unmatched: counts.unmatched,
    staged_rows: rows as unknown as Tables<"anime_import_jobs">["staged_rows"],
    heartbeat_at: new Date().toISOString(),
  });
}

async function parseMalChunk(admin: Admin, job: ImportJob): Promise<ImportJob> {
  const input = readSourceInput(job);
  if (input.kind !== "mal_xml") throw new Error("Bad source input");

  const slice = input.entries.slice(
    job.processed,
    job.processed + IMPORT_MAL_BATCH_SIZE,
  );
  const mediaByMal = await resolveMalIdsToMedia(slice.map((e) => e.malId));
  const newRows = slice.map((entry) =>
    stagedRowFromMal(entry, mediaByMal.get(entry.malId) ?? null),
  );

  const rows = [...readStagedRows(job), ...newRows];
  const processed = job.processed + slice.length;
  const done = processed >= input.entries.length;
  const counts = countMatchStates(rows);

  return patchJob(admin, job.id, {
    status: done ? "needs_review" : "parsing",
    processed,
    matched: counts.matched,
    needs_review_count: counts.needsReview,
    unmatched: counts.unmatched,
    staged_rows: rows as unknown as Tables<"anime_import_jobs">["staged_rows"],
    heartbeat_at: new Date().toISOString(),
  });
}

async function parsePlainTextChunk(admin: Admin, job: ImportJob): Promise<ImportJob> {
  const input = readSourceInput(job);
  if (input.kind !== "plain_text") throw new Error("Bad source input");

  const slice = input.lines.slice(
    job.processed,
    job.processed + IMPORT_MATCH_CHUNK_SIZE,
  );

  const newRows: StagedRow[] = [];
  for (const line of slice) {
    const { candidates, media } = await searchImportCandidates(line);
    const row = await matchPlainTextLine(line, async () => candidates);
    if (row.anilistId != null) row.media = media.get(row.anilistId) ?? null;
    newRows.push(row);
  }

  const rows = [...readStagedRows(job), ...newRows];
  const processed = job.processed + slice.length;
  const done = processed >= input.lines.length;
  const counts = countMatchStates(rows);

  return patchJob(admin, job.id, {
    status: done ? "needs_review" : "parsing",
    processed,
    matched: counts.matched,
    needs_review_count: counts.needsReview,
    unmatched: counts.unmatched,
    staged_rows: rows as unknown as Tables<"anime_import_jobs">["staged_rows"],
    heartbeat_at: new Date().toISOString(),
  });
}

// --- Phase: importing -----------------------------------------------------

async function importChunk(admin: Admin, job: ImportJob): Promise<ImportJob> {
  const staged = readStagedRows(job);
  const entries = toImportEntries(staged);
  const byAnilistId = new Map(
    staged.filter((r) => r.anilistId != null).map((r) => [r.anilistId, r]),
  );

  const slice = entries.slice(job.processed, job.processed + IMPORT_WRITE_CHUNK_SIZE);
  const newAnimeIds: string[] = [];
  let imported = job.imported;
  let skipped = job.skipped;

  for (const entry of slice) {
    const row = byAnilistId.get(entry.anilistId);
    if (!row) {
      skipped++;
      continue;
    }
    const anime = await ensureAnimeRow(admin, row);
    if (!anime) {
      skipped++;
      continue;
    }

    const { data: existing } = await admin
      .from("user_anime_entries")
      .select("id")
      .eq("user_id", job.user_id)
      .eq("anime_id", anime.id)
      .maybeSingle();

    if (existing) {
      // Decision: never overwrite an entry the user already curated.
      skipped++;
      continue;
    }

    const isCompleted = entry.status === "completed";
    const { error } = await admin.from("user_anime_entries").insert({
      user_id: job.user_id,
      anime_id: anime.id,
      status: entry.status,
      personal_score: entry.personalScore,
      progress_episodes: entry.progressEpisodes,
      completed_at: isCompleted ? new Date().toISOString().slice(0, 10) : null,
      started_at:
        entry.status === "watching" ? new Date().toISOString().slice(0, 10) : null,
    });
    if (error) {
      skipped++;
      continue;
    }

    imported++;
    newAnimeIds.push(anime.id);
    void logUserEvent(job.user_id, USER_EVENT_TYPES.animeAdded, {
      animeId: anime.id,
      metadata: { source: "import", status: entry.status },
    });
    if (isCompleted) {
      void logUserEvent(job.user_id, USER_EVENT_TYPES.animeCompleted, {
        animeId: anime.id,
        metadata: { source: "import" },
      });
    }
  }

  const processed = job.processed + slice.length;
  const done = processed >= entries.length;
  const backfillIds = [...job.backfill_anime_ids, ...newAnimeIds];

  return patchJob(admin, job.id, {
    status: done ? "series_backfill" : "importing",
    processed: done ? 0 : processed,
    imported,
    skipped,
    backfill_anime_ids: backfillIds,
    heartbeat_at: new Date().toISOString(),
  });
}

// --- Phase: series backfill ----------------------------------------------

async function backfillChunk(admin: Admin, job: ImportJob): Promise<ImportJob> {
  const ids = job.backfill_anime_ids;
  const slice = ids.slice(job.processed, job.processed + IMPORT_BACKFILL_CHUNK_SIZE);

  enableAnilistQueryCache();
  for (const animeId of slice) {
    const { data: anime } = await admin
      .from("anime")
      .select("*")
      .eq("id", animeId)
      .maybeSingle();
    if (anime) {
      try {
        await ensureAnimeSeriesMapping(anime);
      } catch {
        /* leave unmapped; recompute simply omits it */
      }
    }
    await sleep(IMPORT_BACKFILL_DELAY_MS);
  }

  const processed = job.processed + slice.length;
  const done = processed >= ids.length;

  if (done) {
    await recomputeUserRanking(job.user_id);
    return patchJob(admin, job.id, {
      status: "done",
      processed: ids.length,
      heartbeat_at: new Date().toISOString(),
    });
  }

  return patchJob(admin, job.id, {
    status: "series_backfill",
    processed,
    heartbeat_at: new Date().toISOString(),
  });
}

// --- Dispatcher -----------------------------------------------------------

/** True while a chunk-loop has automatic work to do (not waiting on the user). */
export function hasPendingWork(status: ImportJob["status"]): boolean {
  return isPendingWorkStatus(status);
}

/**
 * Advance a job by one bounded chunk. Returns updated progress. No-op for
 * terminal jobs and for `needs_review`/`pending` (which await user input).
 */
export async function processChunk(jobId: string): Promise<ImportJobProgress | null> {
  const admin = createAdminClient();
  const job = await loadJob(admin, jobId);
  if (!job) return null;
  if (!hasPendingWork(job.status)) return progressFromJob(job);

  try {
    let updated: ImportJob;
    if (job.status === "parsing") {
      updated =
        job.source === "anilist"
          ? await parseAniListChunk(admin, job)
          : job.source === "mal_xml"
            ? await parseMalChunk(admin, job)
            : await parsePlainTextChunk(admin, job);
    } else if (job.status === "importing") {
      updated = await importChunk(admin, job);
    } else {
      updated = await backfillChunk(admin, job);
    }
    return progressFromJob(updated);
  } catch (e) {
    const retryCount = job.retry_count + 1;
    const failed = retryCount > MAX_RETRIES;
    const updated = await patchJob(admin, job.id, {
      retry_count: retryCount,
      status: failed ? "failed" : job.status,
      error: e instanceof Error ? e.message : "Import chunk failed",
      heartbeat_at: new Date().toISOString(),
    });
    return progressFromJob(updated);
  }
}
