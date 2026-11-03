/**
 * AniList-to-TMDB artwork helpers. The public Fribb list supplies the id map;
 * TMDB supplies a 16:9 backdrop. Callers keep the AniList banner when either
 * step has nothing.
 */

export type TmdbTarget = {
  mediaType: "tv" | "movie";
  id: number;
};

export type AnilistTmdbRecord = {
  anilist_id?: number;
  themoviedb_id?: {
    tv?: number;
    movie?: number[];
  };
};

const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

/** TV id when present, otherwise the first movie id. */
export function tmdbTargetFromRecord(record: AnilistTmdbRecord): TmdbTarget | null {
  const tmdb = record.themoviedb_id;
  if (!tmdb) return null;
  if (typeof tmdb.tv === "number") return { mediaType: "tv", id: tmdb.tv };
  const movie = tmdb.movie?.find((id) => typeof id === "number");
  if (typeof movie === "number") return { mediaType: "movie", id: movie };
  return null;
}

/** AniList id to TMDB target, skipping records that cannot be fetched. */
export function indexAnilistTmdb(records: AnilistTmdbRecord[]): Map<number, TmdbTarget> {
  const index = new Map<number, TmdbTarget>();
  for (const record of records) {
    if (typeof record?.anilist_id !== "number") continue;
    const target = tmdbTargetFromRecord(record);
    if (target) index.set(record.anilist_id, target);
  }
  return index;
}

/** Original-size backdrop URL. `backdrop_path` includes its leading slash. */
export function backdropImageUrl(backdropPath: string | null | undefined): string | null {
  if (!backdropPath) return null;
  return `${BACKDROP_BASE}${backdropPath}`;
}

/**
 * Primary backdrop for one TMDB title. Returns null when the title has no
 * backdrop or the request fails. The API key stays in the request, not the
 * image URL.
 */
export async function fetchTmdbBackdrop(
  target: TmdbTarget,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const endpoint = new URL(
    `https://api.themoviedb.org/3/${target.mediaType}/${target.id}`,
  );
  endpoint.searchParams.set("api_key", apiKey);
  const response = await fetchImpl(endpoint, {
    next: { revalidate: 60 * 60 * 24 },
  } as RequestInit);
  if (!response.ok) return null;
  const body = (await response.json()) as { backdrop_path?: string | null };
  return backdropImageUrl(body.backdrop_path);
}

type HeroArt = { anilistId: number; bannerUrl: string | null };

/**
 * Swap in a TMDB backdrop per item. A missing or failed lookup leaves the
 * existing banner in place.
 */
export async function preferTmdbBackdrops<T extends HeroArt>(
  items: T[],
  lookup: (anilistId: number) => Promise<string | null>,
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const backdrop = await lookup(item.anilistId).catch(() => null);
      if (!backdrop) return item;
      return { ...item, bannerUrl: backdrop };
    }),
  );
}
