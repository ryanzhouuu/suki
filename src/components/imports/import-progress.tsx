import type { ImportJobProgress } from "@/lib/imports/types";

const STATUS_COPY: Record<ImportJobProgress["status"], string> = {
  pending: "Getting ready…",
  parsing: "Matching your titles…",
  needs_review: "Ready for review",
  importing: "Adding to your library…",
  series_backfill: "Preparing your rankings…",
  done: "Import complete",
  failed: "Import failed",
  canceled: "Import canceled",
};

export function ImportProgress({ job }: { job: ImportJobProgress }) {
  const pct =
    job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{STATUS_COPY[job.status]}</span>
        {job.total > 0 ? (
          <span className="text-faint">
            {job.processed}/{job.total}
          </span>
        ) : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${job.status === "parsing" || job.status === "importing" || job.status === "series_backfill" ? Math.max(8, pct) : pct}%` }}
        />
      </div>
      <p className="text-xs text-faint">
        {job.matched} matched · {job.needsReview} to review · {job.unmatched}{" "}
        unmatched
        {job.imported > 0 ? ` · ${job.imported} added` : ""}
        {job.skipped > 0 ? ` · ${job.skipped} skipped` : ""}
      </p>
      {job.error ? (
        <p
          className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {job.error}
        </p>
      ) : null}
    </div>
  );
}
