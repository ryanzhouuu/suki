export const LIBRARY_NOTES_MAX_LENGTH = 2000;

export type LibraryEntryPatchInput = {
  status?: string;
  progressEpisodes?: number;
  personalScore?: number | null;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  priority?: "low" | "medium" | "high" | null;
  rewatchCount?: number;
};

export type ValidatedLibraryEntryPatch = {
  status?: "watching" | "completed" | "paused" | "dropped" | "plan_to_watch";
  progressEpisodes?: number;
  personalScore?: number | null;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  priority?: "low" | "medium" | "high" | null;
  rewatchCount?: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITIES = new Set(["low", "medium", "high"]);
const STATUSES = new Set([
  "watching",
  "completed",
  "paused",
  "dropped",
  "plan_to_watch",
]);

function parseDate(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  const trimmed = value.trim();
  if (!DATE_RE.test(trimmed)) {
    throw new Error("Dates must use YYYY-MM-DD format.");
  }
  const parsed = Date.parse(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid date.");
  }
  return trimmed;
}

function parseNonNegativeInt(
  value: number | undefined,
  label: string,
): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

export function validateLibraryEntryPatch(
  patch: LibraryEntryPatchInput,
  options?: { maxEpisodes?: number | null },
): ValidatedLibraryEntryPatch {
  const result: ValidatedLibraryEntryPatch = {};

  if (patch.status !== undefined) {
    if (!STATUSES.has(patch.status)) {
      throw new Error("Invalid status.");
    }
    result.status = patch.status as ValidatedLibraryEntryPatch["status"];
  }

  if (patch.progressEpisodes !== undefined) {
    const progress = parseNonNegativeInt(
      patch.progressEpisodes,
      "Episode progress",
    );
    if (progress !== undefined) {
      if (
        options?.maxEpisodes != null &&
        options.maxEpisodes > 0 &&
        progress > options.maxEpisodes
      ) {
        throw new Error(
          `Episode progress cannot exceed ${options.maxEpisodes}.`,
        );
      }
      result.progressEpisodes = progress;
    }
  }

  if (patch.rewatchCount !== undefined) {
    result.rewatchCount = parseNonNegativeInt(patch.rewatchCount, "Rewatch count");
  }

  if (patch.personalScore !== undefined) {
    if (patch.personalScore === null) {
      result.personalScore = null;
    } else {
      const score = Number(patch.personalScore);
      if (!Number.isFinite(score) || score < 0 || score > 10) {
        throw new Error("Personal score must be between 0 and 10.");
      }
      result.personalScore = Math.round(score * 10) / 10;
    }
  }

  if (patch.notes !== undefined) {
    if (patch.notes === null) {
      result.notes = null;
    } else {
      const trimmed = patch.notes.trim();
      if (trimmed.length > LIBRARY_NOTES_MAX_LENGTH) {
        throw new Error(
          `Notes cannot exceed ${LIBRARY_NOTES_MAX_LENGTH} characters.`,
        );
      }
      result.notes = trimmed.length > 0 ? trimmed : null;
    }
  }

  const startedAt = parseDate(patch.startedAt);
  if (startedAt !== undefined) result.startedAt = startedAt;

  const completedAt = parseDate(patch.completedAt);
  if (completedAt !== undefined) result.completedAt = completedAt;

  if (
    result.startedAt &&
    result.completedAt &&
    result.completedAt < result.startedAt
  ) {
    throw new Error("Completed date cannot be before started date.");
  }

  if (patch.priority !== undefined) {
    if (patch.priority === null) {
      result.priority = null;
    } else if (!PRIORITIES.has(patch.priority)) {
      throw new Error("Invalid priority.");
    } else {
      result.priority = patch.priority;
    }
  }

  return result;
}

export function changedLibraryFields(
  existing: {
    status: string;
    progress_episodes: number;
    notes: string | null;
    personal_score: number | null;
    started_at: string | null;
    completed_at: string | null;
    priority: string | null;
    rewatch_count: number;
  },
  updates: ValidatedLibraryEntryPatch,
): string[] {
  const fields: string[] = [];
  const map: Array<[keyof ValidatedLibraryEntryPatch, string]> = [
    ["status", "status"],
    ["progressEpisodes", "progress_episodes"],
    ["notes", "notes"],
    ["personalScore", "personal_score"],
    ["startedAt", "started_at"],
    ["completedAt", "completed_at"],
    ["priority", "priority"],
    ["rewatchCount", "rewatch_count"],
  ];

  for (const [patchKey, dbKey] of map) {
    if (updates[patchKey] === undefined) continue;
    const next = updates[patchKey];
    const prev = existing[dbKey as keyof typeof existing];
    if (next !== prev) {
      fields.push(dbKey);
    }
  }

  return fields;
}
