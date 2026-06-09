"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelImport, confirmImport } from "@/actions/imports";
import { Button } from "@/components/ui/button";
import { ANIME_ENTRY_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { AnimeEntryStatus } from "@/lib/constants";
import type {
  ImportJobProgress,
  StagedRow,
  StagedRowCorrection,
} from "@/lib/imports/types";

type Override = {
  skip?: boolean;
  status?: AnimeEntryStatus;
  anilistId?: number | null;
};

function StatusSelect({
  value,
  onChange,
}: {
  value: AnimeEntryStatus;
  onChange: (status: AnimeEntryStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AnimeEntryStatus)}
      className="rounded-lg border border-line-strong bg-surface px-2 py-1 text-xs text-ink"
    >
      {ANIME_ENTRY_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

export function ImportReview({
  job,
  stagedRows,
}: {
  job: ImportJobProgress;
  stagedRows: StagedRow[];
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { matched, needsReview, unmatched } = useMemo(() => {
    return {
      matched: stagedRows.filter((r) => r.matchState === "matched"),
      needsReview: stagedRows.filter((r) => r.matchState === "needs_review"),
      unmatched: stagedRows.filter((r) => r.matchState === "unmatched"),
    };
  }, [stagedRows]);

  function setOverride(rowId: string, patch: Override) {
    setOverrides((prev) => ({ ...prev, [rowId]: { ...prev[rowId], ...patch } }));
  }

  function buildCorrections(): StagedRowCorrection[] {
    return Object.entries(overrides).map(([rowId, o]) => ({
      rowId,
      skip: o.skip,
      status: o.status,
      anilistId: o.anilistId,
    }));
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmImport(job.id, buildCorrections());
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelImport(job.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        {matched.length} matched · {needsReview.length} need review ·{" "}
        {unmatched.length} couldn&apos;t be matched. Adjust anything below, then
        confirm.
      </p>

      {needsReview.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Needs your review</h2>
          <ul className="space-y-3">
            {needsReview.map((row) => {
              const chosen =
                overrides[row.rowId]?.anilistId ?? row.anilistId ?? null;
              return (
                <li
                  key={row.rowId}
                  className="rounded-card border border-line-strong p-4"
                >
                  <p className="text-sm font-medium text-ink">{row.sourceTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(row.candidates ?? []).map((candidate) => {
                      const active = chosen === candidate.anilistId;
                      return (
                        <button
                          key={candidate.anilistId}
                          type="button"
                          onClick={() =>
                            setOverride(row.rowId, {
                              anilistId: candidate.anilistId,
                              skip: false,
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            active
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-line-strong text-muted hover:border-accent"
                          }`}
                        >
                          {candidate.title}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setOverride(row.rowId, { skip: true, anilistId: null })}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        overrides[row.rowId]?.skip
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-line-strong text-muted hover:border-accent"
                      }`}
                    >
                      Skip
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {matched.length > 0 ? (
        <details className="rounded-card border border-line-strong p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            {matched.length} matched titles
          </summary>
          <ul className="mt-3 space-y-2">
            {matched.map((row) => {
              const skipped = overrides[row.rowId]?.skip ?? false;
              return (
                <li
                  key={row.rowId}
                  className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-t-0"
                >
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${skipped ? "text-faint line-through" : "text-ink"}`}
                  >
                    {row.sourceTitle}
                  </span>
                  <StatusSelect
                    value={overrides[row.rowId]?.status ?? row.status}
                    onChange={(status) => setOverride(row.rowId, { status })}
                  />
                  <button
                    type="button"
                    onClick={() => setOverride(row.rowId, { skip: !skipped })}
                    className="text-xs text-muted hover:text-accent"
                  >
                    {skipped ? "Include" : "Skip"}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      {unmatched.length > 0 ? (
        <details className="rounded-card border border-line p-4">
          <summary className="cursor-pointer text-sm font-semibold text-muted">
            {unmatched.length} couldn&apos;t be matched (skipped)
          </summary>
          <ul className="mt-3 space-y-1">
            {unmatched.map((row) => (
              <li key={row.rowId} className="text-sm text-faint">
                {row.sourceTitle}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {error ? (
        <p
          className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConfirm} disabled={pending} size="lg">
          {pending ? "Working…" : "Confirm import"}
        </Button>
        <Button onClick={handleCancel} disabled={pending} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}
