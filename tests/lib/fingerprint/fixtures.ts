import type {
  FingerprintAnime,
  FingerprintEntry,
  FingerprintRanking,
} from "@/lib/fingerprint/types";
import type { SeriesRef } from "@/lib/library/group";

let nextEntryId = 1;

export type EntryOverrides =
  Partial<Omit<FingerprintEntry, "anime">> & {
    anime?: Partial<FingerprintAnime>;
  };

export function anime(
  id: string,
  overrides: Partial<FingerprintAnime> = {},
): FingerprintAnime {
  return {
    id,
    romaji_title: `Anime ${id}`,
    english_title: `Anime ${id}`,
    native_title: null,
    format: "TV",
    episodes: 12,
    genres: ["Action"],
    popularity: 50_000,
    tags: [],
    ...overrides,
  };
}

export function entry(
  animeId: string,
  overrides: EntryOverrides = {},
): FingerprintEntry {
  const { anime: animeOverrides, ...entryOverrides } = overrides;
  return {
    id: `entry-${nextEntryId++}`,
    anime_id: animeId,
    status: "completed",
    rewatch_count: 0,
    personal_score: null,
    anime: anime(animeId, animeOverrides),
    ...entryOverrides,
  };
}

export function series(id: string, title = `Series ${id}`): SeriesRef {
  return {
    id,
    canonical_title: title,
    cover_image_url: null,
    slug: id,
  };
}

export function ranking(
  seriesId: string,
  rank: number,
  overrides: Partial<FingerprintRanking> = {},
): FingerprintRanking {
  return {
    series_id: seriesId,
    rank,
    score: 1500 - rank,
    confidence: "high",
    comparison_count: 10,
    uncertainty: 0.1,
    algorithm_version: "bt_series_v1",
    series: series(seriesId),
    ...overrides,
  };
}

export function mapping(
  pairs: readonly (readonly [string, SeriesRef])[],
): Map<string, SeriesRef> {
  return new Map(pairs);
}

export function completedFranchise(
  seriesId: string,
  index: number,
  overrides: EntryOverrides = {},
): FingerprintEntry {
  return entry(`${seriesId}-anime`, {
    anime: {
      id: `${seriesId}-anime`,
      english_title: `${seriesId} title`,
      romaji_title: `${seriesId} title`,
      ...overrides.anime,
    },
    personal_score: 8,
    ...overrides,
    id: overrides.id ?? `fixture-entry-${index}`,
    anime_id: `${seriesId}-anime`,
    status: "completed",
  });
}

export function rankedProfile(options: {
  count?: number;
  genre?: string;
  score?: number | null;
  popularity?: number;
  format?: string;
  episodes?: number | null;
  tags?: unknown;
  statuses?: readonly FingerprintEntry["status"][];
} = {}) {
  const count = options.count ?? 12;
  const genre = options.genre ?? "Action";
  const statuses = options.statuses ?? [];
  const entries: FingerprintEntry[] = [];
  const rankings: FingerprintRanking[] = [];
  const pairs: Array<[string, SeriesRef]> = [];

  for (let index = 0; index < count; index += 1) {
    const seriesId = `series-${String(index + 1).padStart(2, "0")}`;
    const animeId = `${seriesId}-anime`;
    const status = statuses[index] ?? "completed";
    entries.push(
      entry(animeId, {
        id: `fixture-entry-${index}`,
        status,
        personal_score: options.score === undefined ? 8 : options.score,
        anime: {
          id: animeId,
          english_title: `${seriesId} title`,
          genres: [genre],
          popularity:
            options.popularity === undefined ? 50_000 : options.popularity,
          format: options.format === undefined ? "TV" : options.format,
          episodes: options.episodes === undefined ? 12 : options.episodes,
          tags: options.tags ?? [],
        },
      }),
    );
    pairs.push([animeId, series(seriesId, `${seriesId} title`)]);
    rankings.push(ranking(seriesId, index + 1));
  }

  return { entries, rankings, seriesByAnimeId: mapping(pairs) };
}
