export type StubMedia = {
  id: number;
  idMal: number;
  english: string;
  romaji: string;
  native: string;
  format: "TV" | "MOVIE" | "ONA";
  episodes: number | null;
  duration: number | null;
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL" | null;
  seasonYear: number | null;
  status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED";
  genres: string[];
  averageScore: number;
  popularity: number;
  description: string;
  relationIds: number[];
};

export const STUB_MEDIA: StubMedia[] = [
  {
    id: 1001,
    idMal: 9001,
    english: "Moonlit Couriers",
    romaji: "Tsukiyo no Haitatsu",
    native: "月夜の配達",
    format: "TV",
    episodes: 12,
    duration: 24,
    season: "SPRING",
    seasonYear: 2024,
    status: "FINISHED",
    genres: ["Adventure", "Drama"],
    averageScore: 84,
    popularity: 120_001,
    description: "A courier crosses a changing coast under a moonlit sky.",
    relationIds: [],
  },
  {
    id: 1002,
    idMal: 9002,
    english: "Moonlit Couriers: Winter Route",
    romaji: "Tsukiyo no Haitatsu 2",
    native: "月夜の配達 冬航路",
    format: "TV",
    episodes: 13,
    duration: 24,
    season: "WINTER",
    seasonYear: 2025,
    status: "RELEASING",
    genres: ["Adventure", "Drama"],
    averageScore: 86,
    popularity: 100_002,
    description: "The courier crew takes a dangerous winter route.",
    relationIds: [1001],
  },
  {
    id: 1003,
    idMal: 9003,
    english: "Garden of Small Suns",
    romaji: "Chiisana Taiyou no Niwa",
    native: "小さな太陽の庭",
    format: "TV",
    episodes: 24,
    duration: 24,
    season: "FALL",
    seasonYear: 2022,
    status: "FINISHED",
    genres: ["Drama", "Slice of Life"],
    averageScore: 91,
    popularity: 80_003,
    description: "Neighbors rebuild a garden and their lives together.",
    relationIds: [],
  },
  {
    id: 1004,
    idMal: 9004,
    english: "Signal at Dawn",
    romaji: "Akatsuki no Shingou",
    native: "暁の信号",
    format: "MOVIE",
    episodes: 1,
    duration: 110,
    season: null,
    seasonYear: 2021,
    status: "FINISHED",
    genres: ["Mystery", "Sci-Fi"],
    averageScore: 79,
    popularity: 70_004,
    description: "A radio operator hears a message from tomorrow.",
    relationIds: [],
  },
  {
    id: 1005,
    idMal: 9005,
    english: "Paper Stars Club",
    romaji: "Kami Hoshi Kurabu",
    native: "紙星クラブ",
    format: "ONA",
    episodes: 8,
    duration: 8,
    season: "SUMMER",
    seasonYear: 2023,
    status: "FINISHED",
    genres: ["Comedy", "Slice of Life"],
    averageScore: 76,
    popularity: 60_005,
    description: "A tiny after-school club folds impossible paper stars.",
    relationIds: [],
  },
  {
    id: 1006,
    idMal: 9006,
    english: "The Last Orchard",
    romaji: "Saigo no Kajuen",
    native: "最後の果樹園",
    format: "TV",
    episodes: 10,
    duration: 24,
    season: "FALL",
    seasonYear: 2025,
    status: "NOT_YET_RELEASED",
    genres: ["Fantasy", "Adventure"],
    averageScore: 0,
    popularity: 40_006,
    description: "An apprentice tends the last orchard in a floating city.",
    relationIds: [],
  },
];

type GraphqlRequest = {
  query?: unknown;
  variables?: unknown;
};

export type StubResponse = {
  status: number;
  body: Record<string, unknown>;
};

function operationName(query: unknown): string {
  if (typeof query !== "string") return "unknown";
  return /\b(?:query|mutation)\s+([A-Za-z0-9_]+)/.exec(query)?.[1] ?? "anonymous";
}

function variablesOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function title(media: StubMedia) {
  return {
    romaji: media.romaji,
    english: media.english,
    native: media.native,
  };
}

function coverImage() {
  return { large: null };
}

function summary(media: StubMedia) {
  return {
    id: media.id,
    title: title(media),
    coverImage: coverImage(),
    format: media.format,
    episodes: media.episodes,
    seasonYear: media.seasonYear,
    status: media.status,
    genres: media.genres,
  };
}

function detail(media: StubMedia) {
  const relations = media.relationIds
    .map((id) => STUB_MEDIA.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is StubMedia => Boolean(candidate))
    .map((related) => ({
      relationType: "PREQUEL",
      node: {
        id: related.id,
        type: "ANIME",
        format: related.format,
        seasonYear: related.seasonYear,
        title: title(related),
      },
    }));

  return {
    ...summary(media),
    description: media.description,
    bannerImage: null,
    duration: media.duration,
    season: media.season,
    averageScore: media.averageScore,
    meanScore: media.averageScore,
    popularity: media.popularity,
    trending: media.popularity,
    favourites: 1_000,
    source: "ORIGINAL",
    countryOfOrigin: "JP",
    hashtag: null,
    siteUrl: `http://127.0.0.1:4100/stub/anime/${media.id}`,
    startDate: media.seasonYear
      ? { year: media.seasonYear, month: 1, day: 1 }
      : null,
    endDate: media.status === "FINISHED" && media.seasonYear
      ? { year: media.seasonYear, month: 3, day: 31 }
      : null,
    trailer: null,
    studios: { edges: [] },
    tags: [],
    rankings: [],
    externalLinks: [],
    relations: { edges: relations },
    idMal: media.idMal,
  };
}

function matchesSearch(media: StubMedia, search: string | undefined): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [media.english, media.romaji, media.native]
    .some((value) => value.toLowerCase().includes(needle));
}

function filteredMedia(variables: Record<string, unknown>): StubMedia[] {
  const search = typeof variables.search === "string" ? variables.search : undefined;
  const genres = Array.isArray(variables.genres)
    ? variables.genres.filter((value): value is string => typeof value === "string")
    : [];
  const format = typeof variables.format === "string" ? variables.format : undefined;

  return STUB_MEDIA.filter((media) => {
    if (!matchesSearch(media, search)) return false;
    if (format && media.format !== format) return false;
    if (genres.length && !genres.some((genre) => media.genres.includes(genre))) return false;
    return true;
  });
}

function page(media: StubMedia[]) {
  return {
    Page: {
      pageInfo: { hasNextPage: false, lastPage: 1 },
      media: media.map(summary),
    },
  };
}

export function handleAnilistGraphql(
  request: GraphqlRequest,
): StubResponse {
  const name = operationName(request.query);
  const variables = variablesOf(request.variables);

  switch (name) {
    case "AnimeDiscover":
      return { status: 200, body: page(filteredMedia(variables)) };
    case "SearchAnime":
    case "ImportSearch":
      return { status: 200, body: page(filteredMedia(variables)) };
    case "AnimeDetail": {
      const id = Number(variables.id);
      const media = STUB_MEDIA.find((candidate) => candidate.id === id);
      return { status: 200, body: { Media: media ? detail(media) : null } };
    }
    case "AnimeRelations": {
      const id = Number(variables.id);
      const media = STUB_MEDIA.find((candidate) => candidate.id === id);
      return {
        status: 200,
        body: {
          Media: media
            ? {
                id: media.id,
                format: media.format,
                seasonYear: media.seasonYear,
                title: title(media),
                coverImage: coverImage(),
                relations: detail(media).relations,
              }
            : null,
        },
      };
    }
    case "MediaListCollection":
      return {
        status: 200,
        body: {
          User: { mediaListOptions: { scoreFormat: "POINT_10" } },
          MediaListCollection: { lists: [{ entries: [] }] },
        },
      };
    case "MediaByMalIds": {
      const ids = Array.isArray(variables.malIds)
        ? variables.malIds.map(Number)
        : [];
      return {
        status: 200,
        body: {
          Page: {
            media: STUB_MEDIA.filter((media) => ids.includes(media.idMal)).map(detail),
          },
        },
      };
    }
    case "AnimeAiring": {
      const ids = Array.isArray(variables.ids) ? variables.ids.map(Number) : [];
      return {
        status: 200,
        body: {
          Page: {
            media: STUB_MEDIA.filter((media) => ids.includes(media.id)).map((media) => ({
              id: media.id,
              episodes: media.episodes,
              status: media.status,
              nextAiringEpisode: media.status === "RELEASING"
                ? { episode: 3, airingAt: 1_893_456_000 }
                : null,
            })),
          },
        },
      };
    }
    default:
      throw new Error(`Unknown AniList operation: ${name}`);
  }
}
