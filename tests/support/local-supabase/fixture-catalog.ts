import { STUB_MEDIA } from "../../e2e/stubs/anilist";

const ANIME_IDS: Record<number, string> = {
  1001: "a1001000-0000-4000-8000-000000000001",
  1002: "a1002000-0000-4000-8000-000000000002",
  1003: "a1003000-0000-4000-8000-000000000003",
  1004: "a1004000-0000-4000-8000-000000000004",
  1005: "a1005000-0000-4000-8000-000000000005",
  1006: "a1006000-0000-4000-8000-000000000006",
  1007: "a1007000-0000-4000-8000-000000000007",
};

export const SERIES_IDS = {
  moonlitCouriers: "b1001000-0000-4000-8000-000000000001",
  gardenOfSmallSuns: "b1003000-0000-4000-8000-000000000003",
  signalAtDawn: "b1004000-0000-4000-8000-000000000004",
  paperStarsClub: "b1005000-0000-4000-8000-000000000005",
  lastOrchard: "b1006000-0000-4000-8000-000000000006",
  lanternsInOrbit: "b1007000-0000-4000-8000-000000000007",
} as const;

const SERIES_BY_ANILIST_ID: Record<number, string> = {
  1001: SERIES_IDS.moonlitCouriers,
  1002: SERIES_IDS.moonlitCouriers,
  1003: SERIES_IDS.gardenOfSmallSuns,
  1004: SERIES_IDS.signalAtDawn,
  1005: SERIES_IDS.paperStarsClub,
  1006: SERIES_IDS.lastOrchard,
  1007: SERIES_IDS.lanternsInOrbit,
};

export const FIXTURE_ANIME = STUB_MEDIA.map((media) => ({
  id: ANIME_IDS[media.id],
  anilist_id: media.id,
  romaji_title: media.romaji,
  english_title: media.english,
  native_title: media.native,
  description: media.description,
  cover_image_url: null,
  banner_image_url: null,
  format: media.format,
  episodes: media.episodes,
  duration_minutes: media.duration,
  season: media.season,
  season_year: media.seasonYear,
  status: media.status,
  genres: media.genres,
  average_score: media.averageScore || null,
  popularity: media.popularity,
  source: "ORIGINAL",
  mean_score: media.averageScore || null,
  trending: media.popularity,
  favourites: 1_000,
  country_of_origin: "JP",
  hashtag: null,
  site_url: `http://127.0.0.1:4100/stub/anime/${media.id}`,
  trailer: null,
  studios: [],
  tags: [],
  rankings: [],
  external_links: [],
}));

const SERIES_DEFINITIONS = [
  { id: SERIES_IDS.moonlitCouriers, canonicalTitle: "Moonlit Couriers", anilistPrimaryId: 1001 },
  { id: SERIES_IDS.gardenOfSmallSuns, canonicalTitle: "Garden of Small Suns", anilistPrimaryId: 1003 },
  { id: SERIES_IDS.signalAtDawn, canonicalTitle: "Signal at Dawn", anilistPrimaryId: 1004 },
  { id: SERIES_IDS.paperStarsClub, canonicalTitle: "Paper Stars Club", anilistPrimaryId: 1005 },
  { id: SERIES_IDS.lastOrchard, canonicalTitle: "The Last Orchard", anilistPrimaryId: 1006 },
  { id: SERIES_IDS.lanternsInOrbit, canonicalTitle: "Lanterns in Orbit", anilistPrimaryId: 1007 },
] as const;

export const FIXTURE_SERIES = SERIES_DEFINITIONS.map(({ id, canonicalTitle, anilistPrimaryId }) => ({
  id,
  canonical_title: canonicalTitle,
  slug: canonicalTitle.toLowerCase().replaceAll(" ", "-") + `-${anilistPrimaryId}`,
  anilist_primary_id: anilistPrimaryId,
  cover_image_url: null,
}));

export const FIXTURE_ANIME_SERIES_MAP = STUB_MEDIA.map((media) => ({
  anime_id: ANIME_IDS[media.id],
  series_id: SERIES_BY_ANILIST_ID[media.id],
  source: media.id === 1002 ? ("anilist_auto" as const) : ("singleton" as const),
  confidence: 1,
}));

export function fixtureAnimeId(anilistId: number): string {
  const id = ANIME_IDS[anilistId];
  if (!id) throw new Error(`Unknown local fixture AniList ID: ${anilistId}`);
  return id;
}
