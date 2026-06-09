/** Plain-text matches at or above this similarity are auto-accepted. */
export const IMPORT_AUTO_ACCEPT_SIMILARITY = 0.85;

/** Hard cap on rows per import to bound staging payload + backfill time. */
export const MAX_IMPORT_ROWS = 2000;

/** Candidates kept per plain-text line for the review picker. */
export const IMPORT_SEARCH_CANDIDATES = 5;

/** Rows processed per Phase A import chunk (library writes). */
export const IMPORT_WRITE_CHUNK_SIZE = 25;

/** Lines matched per plain-text parse chunk (one AniList search each). */
export const IMPORT_MATCH_CHUNK_SIZE = 5;

/** MAL ids resolved per batched AniList lookup. */
export const IMPORT_MAL_BATCH_SIZE = 50;

/** Anime mapped per Phase B series-backfill chunk. */
export const IMPORT_BACKFILL_CHUNK_SIZE = 4;

/** Courtesy delay between franchise crawls in the backfill (ms). */
export const IMPORT_BACKFILL_DELAY_MS = 350;

/** Max MAL XML upload size (kept under next.config serverActions.bodySizeLimit). */
export const MAL_XML_MAX_BYTES = 6 * 1024 * 1024;
