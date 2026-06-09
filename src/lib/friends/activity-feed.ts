import { USER_EVENT_TYPES } from "@/lib/constants";

/** A trimmed `user_events` row, as fetched by the feed query. */
export type FeedEventRow = {
  id: string;
  userId: string;
  eventType: string;
  animeId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type FeedActor = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AnimeRef = {
  animeId: string;
  anilistId: number;
  title: string;
  coverImageUrl: string | null;
};

export type SeriesRef = {
  seriesId: string;
  anilistPrimaryId: number;
  title: string;
  coverImageUrl: string | null;
};

/**
 * Resolved lookups the pure builder needs. `actors` is pre-filtered to friends
 * whose visibility + opt-out allow their activity to be shown; events from any
 * other user are dropped. `rankByActorSeries` is keyed `${userId}:${seriesId}`
 * and only contains an actor's currently top-ranked series.
 */
export type FeedLookups = {
  actors: Map<string, FeedActor>;
  anime: Map<string, AnimeRef>;
  series: Map<string, SeriesRef>;
  rankByActorSeries: Map<string, number>;
};

export type FeedItemKind = "completed" | "planned" | "ranked" | "imported";

export type FeedRef = {
  kind: "anime" | "series";
  title: string;
  coverImageUrl: string | null;
  href: string;
};

export type FeedItem = {
  id: string;
  actor: FeedActor;
  kind: FeedItemKind;
  createdAt: string;
  count: number;
  refs: FeedRef[];
  rank?: number;
};

export type FeedBuildOptions = {
  groupWindowMs?: number;
  maxCovers?: number;
};

const DEFAULT_GROUP_WINDOW_MS = 30 * 60_000;
const DEFAULT_MAX_COVERS = 4;

type Atom = {
  eventId: string;
  userId: string;
  kind: FeedItemKind;
  createdAt: string;
  ref: FeedRef;
  /** animeId for anime/import atoms, seriesId for ranked atoms. */
  dedupeId: string;
  rank?: number;
};

function ms(iso: string): number {
  return new Date(iso).getTime();
}

function animeFeedRef(ref: AnimeRef): FeedRef {
  return {
    kind: "anime",
    title: ref.title,
    coverImageUrl: ref.coverImageUrl,
    href: `/anime/${ref.anilistId}`,
  };
}

function seriesFeedRef(ref: SeriesRef): FeedRef {
  return {
    kind: "series",
    title: ref.title,
    coverImageUrl: ref.coverImageUrl,
    href: `/anime/${ref.anilistPrimaryId}`,
  };
}

function classify(row: FeedEventRow, lookups: FeedLookups): Atom | null {
  if (!lookups.actors.has(row.userId)) return null;

  // Import events (added + completed) are flagged with metadata.source; both
  // collapse into a single "imported" burst, deduped by anime later.
  if (row.metadata.source === "import") {
    if (!row.animeId) return null;
    const anime = lookups.anime.get(row.animeId);
    if (!anime) return null;
    return {
      eventId: row.id,
      userId: row.userId,
      kind: "imported",
      createdAt: row.createdAt,
      ref: animeFeedRef(anime),
      dedupeId: anime.animeId,
    };
  }

  switch (row.eventType) {
    case USER_EVENT_TYPES.animeCompleted: {
      if (!row.animeId) return null;
      const anime = lookups.anime.get(row.animeId);
      if (!anime) return null;
      return {
        eventId: row.id,
        userId: row.userId,
        kind: "completed",
        createdAt: row.createdAt,
        ref: animeFeedRef(anime),
        dedupeId: anime.animeId,
      };
    }
    case USER_EVENT_TYPES.animeAdded: {
      if (row.metadata.status !== "plan_to_watch") return null;
      if (!row.animeId) return null;
      const anime = lookups.anime.get(row.animeId);
      if (!anime) return null;
      return {
        eventId: row.id,
        userId: row.userId,
        kind: "planned",
        createdAt: row.createdAt,
        ref: animeFeedRef(anime),
        dedupeId: anime.animeId,
      };
    }
    case USER_EVENT_TYPES.seriesComparisonCreated: {
      const winnerId = row.metadata.winnerSeriesId;
      if (typeof winnerId !== "string") return null;
      const rank = lookups.rankByActorSeries.get(`${row.userId}:${winnerId}`);
      if (rank === undefined) return null;
      const series = lookups.series.get(winnerId);
      if (!series) return null;
      return {
        eventId: row.id,
        userId: row.userId,
        kind: "ranked",
        createdAt: row.createdAt,
        ref: seriesFeedRef(series),
        dedupeId: series.seriesId,
        rank,
      };
    }
    default:
      return null;
  }
}

type Group = { atoms: Atom[]; lastTime: number };

/** Collapse a temporally-adjacent run of same-(actor,kind) atoms into groups. */
function burstGroups(
  atoms: Atom[],
  keyOf: (atom: Atom) => string,
  windowMs: number,
): Group[] {
  const groups: Group[] = [];
  const open = new Map<string, Group>();

  for (const atom of atoms) {
    const key = keyOf(atom);
    const current = open.get(key);
    if (current && current.lastTime - ms(atom.createdAt) <= windowMs) {
      current.atoms.push(atom);
      current.lastTime = ms(atom.createdAt);
    } else {
      const group: Group = { atoms: [atom], lastTime: ms(atom.createdAt) };
      groups.push(group);
      open.set(key, group);
    }
  }

  return groups;
}

function dedupeByDedupeId(atoms: Atom[]): Atom[] {
  const seen = new Set<string>();
  const out: Atom[] = [];
  for (const atom of atoms) {
    if (seen.has(atom.dedupeId)) continue;
    seen.add(atom.dedupeId);
    out.push(atom);
  }
  return out;
}

function groupToItem(
  group: Group,
  lookups: FeedLookups,
  maxCovers: number,
  dedupe: boolean,
): FeedItem {
  const atoms = dedupe ? dedupeByDedupeId(group.atoms) : group.atoms;
  const head = atoms[0];
  const actor = lookups.actors.get(head.userId)!;
  return {
    id: `${head.kind}:${head.userId}:${head.eventId}`,
    actor,
    kind: head.kind,
    createdAt: head.createdAt,
    count: atoms.length,
    refs: atoms.slice(0, maxCovers).map((atom) => atom.ref),
  };
}

/**
 * Pure: maps raw `user_events` rows → grouped, display-ready feed items
 * (reverse-chronological). Bursts of same-actor/same-kind activity collapse;
 * imports become one "imported" item per burst; rankings dedupe per series.
 */
export function buildFeedItems(
  rows: FeedEventRow[],
  lookups: FeedLookups,
  options: FeedBuildOptions = {},
): FeedItem[] {
  const windowMs = options.groupWindowMs ?? DEFAULT_GROUP_WINDOW_MS;
  const maxCovers = options.maxCovers ?? DEFAULT_MAX_COVERS;

  const atoms = [...rows]
    .sort((a, b) => ms(b.createdAt) - ms(a.createdAt))
    .map((row) => classify(row, lookups))
    .filter((atom): atom is Atom => atom !== null);

  const importAtoms = atoms.filter((a) => a.kind === "imported");
  const rankedAtoms = atoms.filter((a) => a.kind === "ranked");
  const burstAtoms = atoms.filter(
    (a) => a.kind === "completed" || a.kind === "planned",
  );

  const items: FeedItem[] = [];

  for (const group of burstGroups(
    burstAtoms,
    (atom) => `${atom.userId}:${atom.kind}`,
    windowMs,
  )) {
    items.push(groupToItem(group, lookups, maxCovers, false));
  }

  for (const group of burstGroups(importAtoms, (atom) => atom.userId, windowMs)) {
    items.push(groupToItem(group, lookups, maxCovers, true));
  }

  // Rankings: one card per (actor, series), keeping the most recent comparison.
  const seenRanked = new Set<string>();
  for (const atom of rankedAtoms) {
    const key = `${atom.userId}:${atom.dedupeId}`;
    if (seenRanked.has(key)) continue;
    seenRanked.add(key);
    const actor = lookups.actors.get(atom.userId)!;
    items.push({
      id: `ranked:${atom.userId}:${atom.dedupeId}`,
      actor,
      kind: "ranked",
      createdAt: atom.createdAt,
      count: 1,
      refs: [atom.ref],
      rank: atom.rank,
    });
  }

  return items.sort((a, b) => {
    const diff = ms(b.createdAt) - ms(a.createdAt);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

/** Human-readable action text for a feed item. */
export function describeActivity(item: FeedItem): string {
  const title = item.refs[0]?.title;
  switch (item.kind) {
    case "completed":
      return item.count === 1 && title
        ? `Completed ${title}`
        : `Completed ${item.count} anime`;
    case "planned":
      return item.count === 1 && title
        ? `Added ${title} to plan-to-watch`
        : `Added ${item.count} to plan-to-watch`;
    case "ranked":
      return `Ranked ${title} #${item.rank}`;
    case "imported":
      return item.count === 1 && title
        ? `Imported ${title}`
        : `Imported ${item.count} titles`;
  }
}
