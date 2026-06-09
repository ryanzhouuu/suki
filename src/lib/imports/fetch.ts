import { anilistQuery } from "@/lib/anilist/client";
import {
  IMPORT_SEARCH_QUERY,
  MEDIA_BY_MAL_IDS_QUERY,
  MEDIA_LIST_COLLECTION_QUERY,
} from "@/lib/anilist/queries";
import type {
  AniListImportSearchResult,
  AniListMediaByMalIdsResult,
  AniListMediaDetail,
  AniListMediaListCollectionResult,
  AniListScoreFormat,
} from "@/lib/anilist/types";

import type { AniListListEntry } from "./anilist-list";
import { IMPORT_MAL_BATCH_SIZE, IMPORT_SEARCH_CANDIDATES } from "./constants";
import type { ImportCandidate } from "./types";

export type AniListUserList = {
  scoreFormat: AniListScoreFormat;
  entries: AniListListEntry[];
};

/** Raised when an AniList username can't be read (missing or private list). */
export class AniListUserListError extends Error {}

/** Fetch a user's full anime list by username via MediaListCollection. */
export async function fetchAniListUserList(
  userName: string,
): Promise<AniListUserList> {
  let data: AniListMediaListCollectionResult;
  try {
    data = await anilistQuery<AniListMediaListCollectionResult>(
      MEDIA_LIST_COLLECTION_QUERY,
      { userName },
    );
  } catch (e) {
    throw new AniListUserListError(
      e instanceof Error && /not found|private/i.test(e.message)
        ? "That AniList user wasn't found, or their list is private."
        : "Couldn't reach AniList. Try again in a moment.",
    );
  }

  if (!data.User || !data.MediaListCollection) {
    throw new AniListUserListError(
      "That AniList user wasn't found, or their list is private.",
    );
  }

  const scoreFormat = data.User.mediaListOptions?.scoreFormat ?? "POINT_10";
  const entries: AniListUserList["entries"] = [];
  for (const list of data.MediaListCollection.lists ?? []) {
    for (const entry of list?.entries ?? []) {
      if (!entry.media) continue;
      entries.push({
        status: entry.status ?? "",
        score: entry.score ?? 0,
        progress: entry.progress ?? 0,
        media: entry.media,
      });
    }
  }

  return { scoreFormat, entries };
}

/**
 * Resolve MAL ids to AniList media in batches. Returns a map keyed by MAL id;
 * ids with no AniList counterpart are simply absent.
 */
export async function resolveMalIdsToMedia(
  malIds: number[],
): Promise<Map<number, AniListMediaDetail>> {
  const result = new Map<number, AniListMediaDetail>();
  for (let i = 0; i < malIds.length; i += IMPORT_MAL_BATCH_SIZE) {
    const batch = malIds.slice(i, i + IMPORT_MAL_BATCH_SIZE);
    const data = await anilistQuery<AniListMediaByMalIdsResult>(
      MEDIA_BY_MAL_IDS_QUERY,
      { malIds: batch },
    );
    for (const media of data.Page?.media ?? []) {
      if (media.idMal != null) result.set(media.idMal, media);
    }
  }
  return result;
}

/** Search AniList for candidate matches for a plain-text title. */
export async function searchImportCandidates(
  query: string,
): Promise<{ candidates: ImportCandidate[]; media: Map<number, AniListMediaDetail> }> {
  const data = await anilistQuery<AniListImportSearchResult>(IMPORT_SEARCH_QUERY, {
    search: query,
    perPage: IMPORT_SEARCH_CANDIDATES,
  });

  const media = new Map<number, AniListMediaDetail>();
  const candidates: ImportCandidate[] = [];
  for (const item of data.Page?.media ?? []) {
    media.set(item.id, item);
    candidates.push({
      anilistId: item.id,
      title:
        item.title.romaji ?? item.title.english ?? item.title.native ?? "Unknown",
      coverImageUrl: item.coverImage?.large ?? null,
    });
  }
  return { candidates, media };
}
