export const ANIME_DISCOVER_QUERY = `
  query AnimeDiscover(
    $sort: [MediaSort]
    $status: MediaStatus
    $page: Int
    $perPage: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        lastPage
      }
      media(
        type: ANIME
        sort: $sort
        status: $status
        isAdult: false
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        format
        seasonYear
      }
    }
  }
`;

export const ANIME_SEARCH_QUERY = `
  query SearchAnime(
    $search: String
    $genres: [String]
    $format: MediaFormat
    $sort: [MediaSort]
    $page: Int
    $perPage: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      media(
        search: $search
        type: ANIME
        sort: $sort
        genre_in: $genres
        format: $format
        isAdult: false
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        format
        episodes
        seasonYear
        status
        genres
      }
    }
  }
`;

export const ANIME_DETAIL_QUERY = `
  query AnimeDetail($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
      }
      bannerImage
      format
      episodes
      duration
      season
      seasonYear
      status
      genres
      averageScore
      popularity
      source
      relations {
        edges {
          relationType
          node {
            id
            type
            format
            seasonYear
            title {
              romaji
              english
            }
          }
        }
      }
    }
  }
`;

/**
 * Full media detail fields (mirrors ANIME_DETAIL_QUERY's scalars, minus
 * relations) so import flows can build anime rows offline.
 */
const MEDIA_DETAIL_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  description
  coverImage {
    large
  }
  bannerImage
  format
  episodes
  duration
  season
  seasonYear
  status
  genres
  averageScore
  popularity
  source
`;

/** A user's full anime list by username, plus their score display format. */
export const MEDIA_LIST_COLLECTION_QUERY = `
  query MediaListCollection($userName: String) {
    User(name: $userName) {
      mediaListOptions {
        scoreFormat
      }
    }
    MediaListCollection(userName: $userName, type: ANIME) {
      lists {
        entries {
          status
          score
          progress
          media {
            ${MEDIA_DETAIL_FIELDS}
          }
        }
      }
    }
  }
`;

/** Batched lookup of AniList media by MyAnimeList ids (for MAL XML imports). */
export const MEDIA_BY_MAL_IDS_QUERY = `
  query MediaByMalIds($malIds: [Int]) {
    Page(page: 1, perPage: 50) {
      media(idMal_in: $malIds, type: ANIME) {
        idMal
        ${MEDIA_DETAIL_FIELDS}
      }
    }
  }
`;

/** Search returning full detail so a confirmed plain-text match builds offline. */
export const IMPORT_SEARCH_QUERY = `
  query ImportSearch($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: ANIME, isAdult: false) {
        ${MEDIA_DETAIL_FIELDS}
      }
    }
  }
`;

/** Lightweight fetch for series graph traversal */
export const ANIME_RELATIONS_QUERY = `
  query AnimeRelations($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      format
      seasonYear
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      relations {
        edges {
          relationType
          node {
            id
            type
            format
            seasonYear
            title {
              romaji
              english
            }
          }
        }
      }
    }
  }
`;

/** Batched airing info for many watching titles in one request (perPage max 50). */
export const ANIME_AIRING_QUERY = `
  query AnimeAiring($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        episodes
        status
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  }
`;
