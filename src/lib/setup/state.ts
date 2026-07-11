import type { ImportJobStatus } from "@/lib/imports/types";

import { LIBRARY_SETUP_ENTRY_THRESHOLD } from "./constants";

export type LibrarySetupView =
  | "success"
  | "active_import"
  | "failed_import"
  | "empty";

const ACTIVE_IMPORT_STATUSES: ImportJobStatus[] = [
  "pending",
  "parsing",
  "importing",
  "series_backfill",
  "needs_review",
];

export function resolveLibrarySetupView(
  libraryCount: number,
  jobStatus: ImportJobStatus | null,
): LibrarySetupView {
  if (libraryCount >= LIBRARY_SETUP_ENTRY_THRESHOLD) {
    return "success";
  }

  if (jobStatus && ACTIVE_IMPORT_STATUSES.includes(jobStatus)) {
    return "active_import";
  }

  if (jobStatus === "failed" || jobStatus === "canceled") {
    return "failed_import";
  }

  return "empty";
}

export function isActiveImportStatus(status: ImportJobStatus): boolean {
  return ACTIVE_IMPORT_STATUSES.includes(status);
}
