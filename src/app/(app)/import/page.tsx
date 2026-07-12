import Link from "next/link";

import { ImportReview } from "@/components/imports/import-review";
import { ImportRunner } from "@/components/imports/import-runner";
import { ImportStart } from "@/components/imports/import-start";
import { Button } from "@/components/ui/button";
import { WidePageFrame } from "@/components/layout/page-frame";
import { requireProfile } from "@/lib/auth/session";
import type { ImportJobProgress, StagedRow } from "@/lib/imports/types";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { importFailureMessage } from "./import-error-copy";

function toProgress(job: Tables<"anime_import_jobs">): ImportJobProgress {
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

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ restart?: string }>;
}) {
  const { user } = await requireProfile();
  const supabase = await createClient();
  const { restart } = await searchParams;

  const { data: latest, error: latestError } = await supabase
    .from("anime_import_jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw latestError;

  // "Import another list" passes ?restart=1 to bypass a finished job's summary.
  const job = restart && latest?.status === "done" ? null : latest;
  const stage = job?.status ?? "none";

  return (
    <WidePageFrame className="max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">Bring your list</p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">Import</h1>
        <p className="mt-2 text-sm text-muted">
          Import from AniList, MyAnimeList, or a plain list of titles.
        </p>
      </div>

      {job && (stage === "parsing" || stage === "importing" || stage === "series_backfill") ? (
        <ImportRunner job={toProgress(job)} />
      ) : null}

      {job && stage === "needs_review" ? (
        <ImportReview
          job={toProgress(job)}
          stagedRows={(job.staged_rows as unknown as StagedRow[]) ?? []}
        />
      ) : null}

      {job && stage === "done" ? (
        <div className="space-y-4 rounded-card border border-line-strong p-6">
          <p className="text-sm font-semibold text-ink">
            Imported {job.imported} titles
            {job.skipped > 0 ? ` · ${job.skipped} skipped` : ""}
            {job.unmatched > 0 ? ` · ${job.unmatched} unmatched` : ""}.
          </p>
          <p className="text-sm text-muted">
            Your library is ready. Rankings unlock once we finish grouping series.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/library">
              <Button>Go to library</Button>
            </Link>
            <Link href="/import?restart=1">
              <Button variant="ghost">Import another list</Button>
            </Link>
          </div>
        </div>
      ) : null}

      {!job || stage === "canceled" || stage === "failed" || stage === "done" ? (
        stage !== "done" ? (
          <div className="space-y-4">
            {stage === "failed" ? (
              <p
                className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
                role="alert"
              >
                {importFailureMessage(job?.error ?? null)}
              </p>
            ) : null}
            <ImportStart />
            <Link
              href="/search"
              className="inline-block text-sm font-medium text-muted hover:text-accent"
            >
              Skip for now →
            </Link>
          </div>
        ) : null
      ) : null}
    </WidePageFrame>
  );
}
