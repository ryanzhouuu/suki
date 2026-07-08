import type { AnimeEntryStatus } from "@/lib/constants";
import type { ValidatedLibraryEntryPatch } from "@/lib/library/validate";

const COMPLETES_AT_TOTAL_STATUSES = new Set<AnimeEntryStatus>([
  "watching",
  "paused",
]);

type LibraryTransitionInput = {
  existingStatus: AnimeEntryStatus;
  existingProgressEpisodes: number;
  patch: ValidatedLibraryEntryPatch;
  totalEpisodes?: number | null;
};

function hasKnownEpisodeTotal(
  totalEpisodes: number | null | undefined,
): totalEpisodes is number {
  return totalEpisodes != null && totalEpisodes > 0;
}

export function applyLibraryStateTransitions({
  existingStatus,
  existingProgressEpisodes,
  patch,
  totalEpisodes,
}: LibraryTransitionInput): ValidatedLibraryEntryPatch {
  const next: ValidatedLibraryEntryPatch = { ...patch };
  let status = next.status ?? existingStatus;
  let progress = next.progressEpisodes ?? existingProgressEpisodes;

  if (status === "plan_to_watch" && progress > 0) {
    status = "watching";
    next.status = status;
  }

  if (
    hasKnownEpisodeTotal(totalEpisodes) &&
    progress >= totalEpisodes &&
    COMPLETES_AT_TOTAL_STATUSES.has(status)
  ) {
    status = "completed";
    next.status = status;
  }

  if (status === "completed" && hasKnownEpisodeTotal(totalEpisodes)) {
    progress = totalEpisodes;
    next.progressEpisodes = progress;
  }

  return next;
}
