import { anilistQuery } from "@/lib/anilist/client";
import { ANIME_RELATIONS_QUERY } from "@/lib/anilist/queries";
import type {
  AniListMediaRelationsOnly,
  AniListRelationsResult,
} from "@/lib/anilist/types";

import {
  FRANCHISE_RELATION_TYPES,
  SERIES_GRAPH_MAX_DEPTH,
  SERIES_GRAPH_MAX_NODES,
} from "./constants";

export type FranchiseMediaNode = {
  anilistId: number;
  format: string | null;
  seasonYear: number | null;
  title: AniListMediaRelationsOnly["title"];
  coverImageUrl: string | null;
};

function mediaToNode(media: AniListMediaRelationsOnly): FranchiseMediaNode {
  return {
    anilistId: media.id,
    format: media.format,
    seasonYear: media.seasonYear,
    title: media.title,
    coverImageUrl: media.coverImage?.large ?? null,
  };
}

function relatedIds(media: AniListMediaRelationsOnly): number[] {
  const ids: number[] = [];
  for (const edge of media.relations?.edges ?? []) {
    if (!edge.node || edge.node.type !== "ANIME") continue;
    if (!FRANCHISE_RELATION_TYPES.has(edge.relationType)) continue;
    ids.push(edge.node.id);
  }
  return ids;
}

export async function fetchFranchiseCluster(
  rootAnilistId: number,
): Promise<FranchiseMediaNode[]> {
  const visited = new Map<number, FranchiseMediaNode>();
  const queue: { id: number; depth: number }[] = [{ id: rootAnilistId, depth: 0 }];

  while (queue.length > 0 && visited.size < SERIES_GRAPH_MAX_NODES) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    if (current.depth > SERIES_GRAPH_MAX_DEPTH) continue;

    const result = await anilistQuery<AniListRelationsResult>(ANIME_RELATIONS_QUERY, {
      id: current.id,
    });

    const media = result.Media;
    if (!media) continue;

    visited.set(media.id, mediaToNode(media));

    if (current.depth >= SERIES_GRAPH_MAX_DEPTH) continue;

    for (const nextId of relatedIds(media)) {
      if (!visited.has(nextId)) {
        queue.push({ id: nextId, depth: current.depth + 1 });
      }
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
