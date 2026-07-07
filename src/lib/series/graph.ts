import { cachedAnilistFetch } from "@/lib/anilist/cache";
import { anilistQuery } from "@/lib/anilist/client";
import { ANIME_RELATIONS_QUERY } from "@/lib/anilist/queries";
import type {
  AniListMediaRelationsOnly,
  AniListMediaTitle,
  AniListRelationsResult,
} from "@/lib/anilist/types";

import {
  FRANCHISE_RELATION_TYPES,
  SERIES_GRAPH_MAX_DEPTH,
  SERIES_GRAPH_MAX_NODES,
} from "./constants";

/** Relations rarely change, so cache them for a day. */
const RELATIONS_CACHE_TTL_SECONDS = 24 * 60 * 60;

function fetchRelationsUncached(id: number): Promise<AniListRelationsResult> {
  return anilistQuery<AniListRelationsResult>(
    ANIME_RELATIONS_QUERY,
    { id },
    { cache: "no-store" },
  );
}

/**
 * Cross-request-cached relations fetch for one AniList id. Caps the
 * up-to-64-calls-per-anime franchise crawl: overlapping crawls and re-syncs
 * reuse cached relation nodes instead of re-hitting AniList.
 */
const fetchRelations = cachedAnilistFetch(
  ["anilist-relations"],
  fetchRelationsUncached,
  { revalidate: RELATIONS_CACHE_TTL_SECONDS, tags: ["anilist-relations"] },
);

export type FranchiseMediaNode = {
  anilistId: number;
  format: string | null;
  seasonYear: number | null;
  title: AniListMediaRelationsOnly["title"];
  coverImageUrl: string | null;
};

// Format / grammatical words that don't identify a franchise, so two unrelated
// works sharing only these (e.g. crossover "… Movie"/"… Special") must not link.
const TOKEN_STOPWORDS: ReadonlySet<string> = new Set([
  "the", "a", "an", "of", "to", "and", "in", "on", "for", "with",
  "no", "wa", "ga", "wo", "ni", "he", "ya", "wai",
  "movie", "film", "gekijouban", "season", "part", "cour", "chapter",
  "ova", "ona", "oad", "special", "specials", "episode", "episodes",
  "tv", "short", "edition", "anime", "story", "the movie",
  "festival", "anniversary", "th", "nd", "rd", "st",
]);

/**
 * Distinctive lowercase tokens across a title's languages, used to keep the
 * franchise crawl from drifting into a different franchise via crossovers.
 */
export function franchiseTitleTokens(title: AniListMediaTitle): Set<string> {
  const tokens = new Set<string>();
  for (const raw of [title.english, title.romaji, title.native]) {
    if (!raw) continue;
    const normalized = raw
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "");
    for (const part of normalized.split(/[^a-z0-9]+/)) {
      if (part.length < 2) continue; // drops lone letters/digits ("z", "2")
      if (/^\d+$/.test(part)) continue; // drops pure numbers
      if (TOKEN_STOPWORDS.has(part)) continue;
      tokens.add(part);
    }
  }
  return tokens;
}

/** True when two titles share at least one distinctive franchise token. */
export function sharesFranchiseToken(a: Set<string>, b: Set<string>): boolean {
  for (const token of a) {
    if (b.has(token)) return true;
  }
  return false;
}

function mediaToNode(media: AniListMediaRelationsOnly): FranchiseMediaNode {
  return {
    anilistId: media.id,
    format: media.format,
    seasonYear: media.seasonYear,
    title: media.title,
    coverImageUrl: media.coverImage?.large ?? null,
  };
}

function relatedNodes(
  media: AniListMediaRelationsOnly,
): { id: number; title: AniListMediaTitle }[] {
  const related: { id: number; title: AniListMediaTitle }[] = [];
  for (const edge of media.relations?.edges ?? []) {
    if (!edge.node || edge.node.type !== "ANIME") continue;
    if (!FRANCHISE_RELATION_TYPES.has(edge.relationType)) continue;
    related.push({ id: edge.node.id, title: edge.node.title });
  }
  return related;
}

export async function fetchFranchiseCluster(
  rootAnilistId: number,
  options?: { cache?: boolean },
): Promise<FranchiseMediaNode[]> {
  const visited = new Map<number, FranchiseMediaNode>();
  const queue: { id: number; depth: number }[] = [{ id: rootAnilistId, depth: 0 }];
  const loadRelations =
    options?.cache === false ? fetchRelationsUncached : fetchRelations;

  // Tokens of the originating media. Every traversed neighbor must share one, so
  // a crossover/festival edge into another franchise can't drag it in even if a
  // loose relation type slips through.
  let seedTokens: Set<string> | null = null;

  while (queue.length > 0 && visited.size < SERIES_GRAPH_MAX_NODES) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    if (current.depth > SERIES_GRAPH_MAX_DEPTH) continue;

    const result = await loadRelations(current.id);

    const media = result.Media;
    if (!media) continue;
    // Opening/ending singles share relations but are not part of the narrative franchise.
    if (media.format === "MUSIC") continue;

    visited.set(media.id, mediaToNode(media));
    seedTokens ??= franchiseTitleTokens(media.title);

    if (current.depth >= SERIES_GRAPH_MAX_DEPTH) continue;

    for (const next of relatedNodes(media)) {
      if (visited.has(next.id)) continue;
      if (
        seedTokens &&
        !sharesFranchiseToken(seedTokens, franchiseTitleTokens(next.title))
      ) {
        continue;
      }
      queue.push({ id: next.id, depth: current.depth + 1 });
    }
  }

  return [...visited.values()];
}

const FORMAT_PRIORITY: Record<string, number> = {
  TV: 0,
  TV_SHORT: 1,
  SPECIAL: 2,
  OVA: 3,
  ONA: 4,
  MOVIE: 5,
  MUSIC: 6,
};

export function pickPrimaryMedia(
  nodes: FranchiseMediaNode[],
): FranchiseMediaNode {
  const sorted = [...nodes].sort((a, b) => {
    const fmtA = FORMAT_PRIORITY[a.format ?? ""] ?? 99;
    const fmtB = FORMAT_PRIORITY[b.format ?? ""] ?? 99;
    if (fmtA !== fmtB) return fmtA - fmtB;

    const yearA = a.seasonYear ?? 9999;
    const yearB = b.seasonYear ?? 9999;
    if (yearA !== yearB) return yearA - yearB;

    return a.anilistId - b.anilistId;
  });
  return sorted[0] ?? nodes[0];
}
