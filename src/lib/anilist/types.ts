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
  genres?: string[];
};

export type AniListRelationType =
  | "ADAPTATION"
  | "PREQUEL"
  | "SEQUEL"
  | "PARENT"
  | "SIDE_STORY"
  | "CHARACTER"
  | "SUMMARY"
  | "ALTERNATIVE"
  | "SPIN_OFF"
  | "OTHER"
  | "SOURCE"
  | "COMPILATION"
  | "CONTAINS";

export type AniListRelationNode = {
  id: number;
  type: string;
  format: string | null;
  seasonYear: number | null;
  title: AniListMediaTitle;
};

export type AniListRelationEdge = {
  relationType: AniListRelationType | string;
  node: AniListRelationNode | null;
};

export type AniListMediaRelations = {
  edges: AniListRelationEdge[] | null;
} | null;

export type AniListMediaDetail = AniListMediaSummary & {
  description: string | null;
  bannerImage: string | null;
  duration: number | null;
  season: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  source: string | null;
  relations?: AniListMediaRelations;
};

export type AniListMediaRelationsOnly = {
  id: number;
  format: string | null;
  seasonYear: number | null;
  title: AniListMediaTitle;
  coverImage: { large: string | null } | null;
  relations: AniListMediaRelations;
};

export type AniListRelationsResult = {
  Media: AniListMediaRelationsOnly | null;
};

export type AniListSearchResult = {
  Page: {
    media: AniListMediaSummary[] | null;
  } | null;
};

export type AniListDiscoverResult = {
  Page: {
    pageInfo?: {
      hasNextPage: boolean;
      lastPage: number;
    } | null;
    media: AniListMediaSummary[] | null;
  } | null;
};

export type AniListMediaResult = {
  Media: AniListMediaDetail | null;
};
