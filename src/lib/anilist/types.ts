export type AniListMediaTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
};

export type AniListMediaSummary = {
  id: number;
  title: AniListMediaTitle;
  coverImage: { large: string | null } | null;
  format: string | null;
  episodes: number | null;
  seasonYear: number | null;
  status: string | null;
};

export type AniListMediaDetail = AniListMediaSummary & {
  description: string | null;
  bannerImage: string | null;
  duration: number | null;
  season: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  source: string | null;
};

export type AniListSearchResult = {
  Page: {
    media: AniListMediaSummary[] | null;
  } | null;
};

export type AniListMediaResult = {
  Media: AniListMediaDetail | null;
};
