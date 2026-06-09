"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import {
  MAL_XML_MAX_BYTES,
  MAX_IMPORT_ROWS,
} from "@/lib/imports/constants";
import { processChunk } from "@/lib/imports/jobs";
import { parseMalXml } from "@/lib/imports/mal";
import { parsePlainText } from "@/lib/imports/plaintext";
import {
  applyCorrections,
  dedupeStagedRows,
  toImportEntries,
} from "@/lib/imports/staged";
import type {
  ImportJobProgress,
  ImportSource,
  ImportSourceInput,
  StagedRow,
  StagedRowCorrection,
} from "@/lib/imports/types";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type StartImportState = {
  error?: string;
  jobId?: string;
};

export type ImportActionState = {
  error?: string;
  message?: string;
};

const ACTIVE_STATUSES = [
  "pending",
  "parsing",
  "needs_review",
  "importing",
  "series_backfill",
] as const;

type StagedJson = TablesInsert<"anime_import_jobs">["staged_rows"];
type SourceInputJson = TablesInsert<"anime_import_jobs">["source_input"];

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

/** Parse the form, create a job row, and return its id for the chunk loop. */
export async function startImport(
  _prev: StartImportState,
  formData: FormData,
): Promise<StartImportState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: active } = await supabase
    .from("anime_import_jobs")
    .select("id")
    .eq("user_id", user.id)
    .in("status", [...ACTIVE_STATUSES])
    .maybeSingle();
  if (active) {
    return {
      error: "You already have an import in progress. Finish or cancel it first.",
    };
  }

  const source = formData.get("source") as ImportSource | null;

  let sourceInput: ImportSourceInput;
  let total: number;

  if (source === "anilist") {
    const username = (formData.get("username") as string | null)?.trim();
    if (!username) return { error: "Enter an AniList username." };
    sourceInput = { kind: "anilist", username };
    total = 0; // discovered during parsing
  } else if (source === "mal_xml") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose your MyAnimeList XML export." };
    }
    if (file.size > MAL_XML_MAX_BYTES) {
      return { error: "That export is too large to import." };
    }
    const entries = parseMalXml(await file.text());
    if (entries.length === 0) {
      return { error: "No anime found in that file." };
    }
    if (entries.length > MAX_IMPORT_ROWS) {
      return { error: `Imports are capped at ${MAX_IMPORT_ROWS} titles.` };
    }
    sourceInput = { kind: "mal_xml", entries };
    total = entries.length;
  } else if (source === "plain_text") {
    const lines = parsePlainText((formData.get("text") as string | null) ?? "");
    if (lines.length === 0) return { error: "Paste at least one title." };
    if (lines.length > MAX_IMPORT_ROWS) {
      return { error: `Imports are capped at ${MAX_IMPORT_ROWS} titles.` };
    }
    sourceInput = { kind: "plain_text", lines };
    total = lines.length;
  } else {
    return { error: "Choose an import source." };
  }

  const { data, error } = await supabase
    .from("anime_import_jobs")
    .insert({
      user_id: user.id,
      source,
      status: "parsing",
      total,
      source_input: sourceInput as unknown as SourceInputJson,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Couldn't start the import." };
  }
  return { jobId: data.id };
}

/** Advance the job one chunk (ownership enforced by RLS read). */
export async function processImportChunk(
  jobId: string,
): Promise<ImportJobProgress | null> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("anime_import_jobs")
    .select("id, user_id, status")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.user_id !== user.id) return null;

  const progress = await processChunk(jobId);

  revalidatePath("/library");
  if (progress?.status === "done") revalidatePath("/ranking");
  return progress;
}

/** Read-only progress poll for the client loop. */
export async function getImportJobState(
  jobId: string,
): Promise<ImportJobProgress | null> {
  const user = await requireAuthUser();
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("anime_import_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.user_id !== user.id) return null;
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

/** Apply review corrections and move the job into the commit phase. */
export async function confirmImport(
  jobId: string,
  corrections: StagedRowCorrection[],
): Promise<ImportActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("anime_import_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.user_id !== user.id) return { error: "Import not found." };
  if (job.status !== "needs_review") {
    return { error: "This import can't be confirmed right now." };
  }

  const staged = (job.staged_rows as unknown as StagedRow[]) ?? [];
  const corrected = dedupeStagedRows(applyCorrections(staged, corrections));
  const counts = countMatchStates(corrected);
  const importable = toImportEntries(corrected).length;

  if (importable === 0) {
    return { error: "Nothing selected to import." };
  }

  const { error } = await supabase
    .from("anime_import_jobs")
    .update({
      status: "importing",
      processed: 0,
      matched: counts.matched,
      needs_review_count: counts.needsReview,
      unmatched: counts.unmatched,
      staged_rows: corrected as unknown as StagedJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) return { error: error.message };
  return { message: `Importing ${importable} titles…` };
}

export async function cancelImport(jobId: string): Promise<ImportActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("anime_import_jobs")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return { message: "Import canceled." };
}
