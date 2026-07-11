import { ImportReview } from "@/components/imports/import-review";
import { ImportRunner } from "@/components/imports/import-runner";
import { LibrarySetupChooser } from "@/components/setup/library-setup-chooser";
import { LibrarySetupShell } from "@/components/setup/library-setup-shell";
import { LibrarySetupSuccess } from "@/components/setup/library-setup-success";
import { requireProfile } from "@/lib/auth/session";
import type { ImportJobProgress, StagedRow } from "@/lib/imports/types";
import { LIBRARY_SETUP_RANKING_SERIES_THRESHOLD } from "@/lib/setup/constants";
import {
  isActiveImportStatus,
  resolveLibrarySetupView,
} from "@/lib/setup/state";
import { getCompletedSeriesForUser } from "@/lib/series/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

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

export default async function LibrarySetupPage() {
  const { user } = await requireProfile();
  const supabase = await createClient();

  const [{ count: libraryCount }, { data: latestJob }, completedSeries] =
    await Promise.all([
      supabase
        .from("user_anime_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("anime_import_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      getCompletedSeriesForUser(user.id),
    ]);

  const entries = libraryCount ?? 0;
  const job = latestJob ?? null;
  const view = resolveLibrarySetupView(entries, job?.status ?? null);
  const rankingReady =
    completedSeries.length >= LIBRARY_SETUP_RANKING_SERIES_THRESHOLD;

  return (
    <LibrarySetupShell libraryCount={entries}>
      {view === "success" ? (
        <LibrarySetupSuccess
          libraryCount={entries}
          rankingReady={rankingReady}
        />
      ) : null}

      {view === "active_import" && job ? (
        <>
          {job.status === "needs_review" ? (
            <ImportReview
              job={toProgress(job)}
              stagedRows={(job.staged_rows as unknown as StagedRow[]) ?? []}
            />
          ) : isActiveImportStatus(job.status) ? (
            <ImportRunner job={toProgress(job)} />
          ) : null}
        </>
      ) : null}

      {view === "failed_import" ? (
        <div className="space-y-5">
          {job?.error ? (
            <p
              className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {job.error}
            </p>
          ) : null}
          <LibrarySetupChooser showRecoveryHint />
        </div>
      ) : null}

      {view === "empty" ? <LibrarySetupChooser /> : null}
    </LibrarySetupShell>
  );
}
