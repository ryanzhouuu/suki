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
