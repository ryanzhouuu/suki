import { USER_EVENT_TYPES } from "@/lib/constants";

export const DIGEST_CONTENT_VERSION = 1;

export type DigestEvent = {
  id: string;
  eventType: string;
  animeId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type DigestHighlight = {
  animeId: string;
  kind: "completed" | "started" | "progress";
  progressDelta: number | null;
  createdAt: string;
};

export type DigestSummary = {
  version: 1;
  totals: {
    episodesWatched: number | null;
    titlesStarted: number;
    titlesCompleted: number;
    comparisons: number;
    recommendationInteractions: number;
  };
  highlights: DigestHighlight[];
  recommendationAnimeIds: string[];
  quiet: boolean;
};

function sourceIsImport(metadata: Record<string, unknown>): boolean {
  return metadata.source === "import" || metadata.mutationSource === "import";
}

function positiveDelta(metadata: Record<string, unknown>): number | null {
  const delta = metadata.delta;
  const previous = metadata.previousProgress;
  const progress = metadata.progress;
  if (
    typeof delta !== "number" ||
    !Number.isInteger(delta) ||
    typeof previous !== "number" ||
    typeof progress !== "number" ||
    progress - previous !== delta
  ) {
    return null;
  }
  return Math.max(0, delta);
}

export function buildDigestSummary(events: DigestEvent[]): DigestSummary {
  const eligible = events.filter((event) => !sourceIsImport(event.metadata));
  const starts = new Map<string, DigestEvent>();
  const completions = new Map<string, DigestEvent>();
  const progress = new Map<string, { event: DigestEvent; delta: number }>();
  const recommendationIds = new Set<string>();
  let comparisons = 0;
  let episodesWatched = 0;
  let episodesAvailable = true;
  const countedProgressFacts = new Set<string>();

  for (const event of eligible) {
    if (
      event.eventType === USER_EVENT_TYPES.progressUpdated ||
      (event.eventType === USER_EVENT_TYPES.animeCompleted &&
        "delta" in event.metadata)
    ) {
      const delta = positiveDelta(event.metadata);
      if (delta === null) {
        episodesAvailable = false;
      } else {
        const factKey = `${event.animeId}:${event.metadata.previousProgress}:${event.metadata.progress}`;
        if (!countedProgressFacts.has(factKey)) {
          episodesWatched += delta;
          countedProgressFacts.add(factKey);
        }
        if (event.animeId && delta > 0) {
          const current = progress.get(event.animeId);
          if (!current || delta > current.delta) {
            progress.set(event.animeId, { event, delta });
          }
        }
      }
    }

    if (
      event.animeId &&
      ((event.eventType === USER_EVENT_TYPES.animeAdded &&
        event.metadata.status === "watching") ||
        (event.eventType === USER_EVENT_TYPES.statusChanged &&
          event.metadata.to === "watching"))
    ) {
      starts.set(event.animeId, event);
    }
    if (event.animeId && event.eventType === USER_EVENT_TYPES.animeCompleted) {
      completions.set(event.animeId, event);
    }
    if (event.eventType === USER_EVENT_TYPES.seriesComparisonCreated) {
      comparisons += 1;
    }
    if (
      event.animeId &&
      (event.eventType === USER_EVENT_TYPES.recommendationClicked ||
        event.eventType === USER_EVENT_TYPES.recommendationAdded)
    ) {
      recommendationIds.add(event.animeId);
    }
  }

  const highlights: DigestHighlight[] = [];
  const highlighted = new Set<string>();
  const append = (
    entries: Array<[string, DigestEvent | { event: DigestEvent; delta: number }]>,
    kind: DigestHighlight["kind"],
  ) => {
    for (const [animeId, value] of entries) {
      if (highlighted.has(animeId) || highlights.length >= 3) continue;
      const event = "event" in value ? value.event : value;
      highlights.push({
        animeId,
        kind,
        progressDelta: "delta" in value ? value.delta : null,
        createdAt: event.createdAt,
      });
      highlighted.add(animeId);
    }
  };
  const newestFirst = ([, left]: [string, DigestEvent], [, right]: [string, DigestEvent]) =>
    right.createdAt.localeCompare(left.createdAt);
  append([...completions].sort(newestFirst), "completed");
  append([...starts].sort(newestFirst), "started");
  append(
    [...progress].sort(
      ([, left], [, right]) =>
        right.delta - left.delta ||
        right.event.createdAt.localeCompare(left.event.createdAt),
    ),
    "progress",
  );

  const totals = {
    episodesWatched: episodesAvailable ? episodesWatched : null,
    titlesStarted: starts.size,
    titlesCompleted: completions.size,
    comparisons,
    recommendationInteractions: recommendationIds.size,
  };
  return {
    version: DIGEST_CONTENT_VERSION,
    totals,
    highlights,
    recommendationAnimeIds: [...recommendationIds],
    quiet:
      (totals.episodesWatched ?? 0) === 0 &&
      totals.titlesStarted === 0 &&
      totals.titlesCompleted === 0 &&
      totals.comparisons === 0 &&
      totals.recommendationInteractions === 0,
  };
}

export function parseDigestSummary(value: unknown): DigestSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<DigestSummary>;
  if (candidate.version !== DIGEST_CONTENT_VERSION) return null;
  if (!candidate.totals || !Array.isArray(candidate.highlights)) return null;
  if (!Array.isArray(candidate.recommendationAnimeIds)) return null;
  if (typeof candidate.quiet !== "boolean") return null;
  return candidate as DigestSummary;
}
