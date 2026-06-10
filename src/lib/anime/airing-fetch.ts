import { anilistQuery } from "@/lib/anilist/client";
import { cachedAnilistFetch } from "@/lib/anilist/cache";
import { ANIME_AIRING_QUERY } from "@/lib/anilist/queries";
import type {
  AniListAiringMedia,
  AniListAiringResult,
} from "@/lib/anilist/types";
import { buildAiringRows, type AiringRow } from "@/lib/anime/airing";
import { getUserLibraryEntries } from "@/lib/library/queries";

/** AniList Page.media caps at 50 results per request. */
const AIRING_BATCH_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Cached batched fetch of airing info by AniList id. Pass a sorted id list so
 * the same set of ids maps to a single cache entry regardless of order.
 */
const fetchAiringByIds = cachedAnilistFetch(
  ["anilist-airing"],
  async (ids: number[]): Promise<AniListAiringMedia[]> => {
    const data = await anilistQuery<AniListAiringResult>(
      ANIME_AIRING_QUERY,
      { ids },
      { cache: "no-store" },
    );
    return data.Page?.media ?? [];
  },
  { tags: ["anilist-airing"] },
);

/** Watching entries that are still airing, soonest-airing first. */
export async function getAiringForWatching(
  userId: string,
): Promise<AiringRow[]> {
  const entries = await getUserLibraryEntries(userId, "watching");
  const ids = [...new Set(entries.map((e) => e.anime.anilist_id))];
  if (ids.length === 0) return [];

  const mediaById = new Map<number, AniListAiringMedia>();
  for (const batch of chunk(ids, AIRING_BATCH_SIZE)) {
    const sorted = [...batch].sort((a, b) => a - b);
    const media = await fetchAiringByIds(sorted);
    for (const m of media) {
      mediaById.set(m.id, m);
    }
  }

  return buildAiringRows(entries, mediaById);
}
