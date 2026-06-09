import type { ImportJobStatus } from "./types";

/** Statuses where the chunk loop has automatic work (not awaiting the user). */
export const PENDING_WORK_STATUSES: ImportJobStatus[] = [
  "parsing",
  "importing",
  "series_backfill",
];

export function isPendingWorkStatus(status: ImportJobStatus): boolean {
  return PENDING_WORK_STATUSES.includes(status);
}

export function isTerminalStatus(status: ImportJobStatus): boolean {
  return status === "done" || status === "failed" || status === "canceled";
}
