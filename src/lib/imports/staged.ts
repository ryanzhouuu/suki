import { randomUUID } from "node:crypto";

import type { AniListMediaDetail } from "@/lib/anilist/types";

import {
  type AniListListEntry,
  type AniListScoreFormat,
  mapAniListListStatus,
  normalizeAniListScore,
} from "./anilist-list";
import { type MalEntry, mapMalStatus, normalizeMalScore } from "./mal";
import type {
  ImportEntryInput,
  StagedRow,
  StagedRowCorrection,
} from "./types";

/** Build a staged row from a MAL entry and its resolved AniList media (if any). */
export function stagedRowFromMal(
  entry: MalEntry,
  media: AniListMediaDetail | null,
): StagedRow {
  const status = mapMalStatus(entry.rawStatus) ?? "plan_to_watch";
  const base: StagedRow = {
    rowId: randomUUID(),
    sourceTitle: entry.title,
    matchState: "unmatched",
    anilistId: null,
    media: null,
    status,
    personalScore: null,
    progressEpisodes: entry.watchedEpisodes,
    skip: false,
  };

  if (!media) return base;

  return {
    ...base,
    matchState: "matched",
    anilistId: media.id,
    media,
    personalScore: normalizeMalScore(entry.score),
  };
}

/** Build a staged row from an AniList MediaListCollection entry. */
export function stagedRowFromAniListEntry(
  entry: AniListListEntry,
  scoreFormat: AniListScoreFormat,
): StagedRow {
  return {
    rowId: randomUUID(),
    sourceTitle:
      entry.media.title.romaji ??
      entry.media.title.english ??
      entry.media.title.native ??
      "Unknown",
    matchState: "matched",
    anilistId: entry.media.id,
    media: entry.media,
    status: mapAniListListStatus(entry.status) ?? "plan_to_watch",
    personalScore: normalizeAniListScore(entry.score, scoreFormat),
    progressEpisodes: entry.progress,
    skip: false,
  };
}

/**
 * Collapse rows that resolve to the same AniList id (keep the first). Rows
 * without an anilistId (unmatched / needs-review) are all retained.
 */
export function dedupeStagedRows(rows: StagedRow[]): StagedRow[] {
  const seen = new Set<number>();
  const result: StagedRow[] = [];
  for (const row of rows) {
    if (row.anilistId == null) {
      result.push(row);
      continue;
    }
    if (seen.has(row.anilistId)) continue;
    seen.add(row.anilistId);
    result.push(row);
  }
  return result;
}

/** Apply user review corrections onto staged rows, keyed by rowId. */
export function applyCorrections(
  rows: StagedRow[],
  corrections: StagedRowCorrection[],
): StagedRow[] {
  const byRowId = new Map(corrections.map((c) => [c.rowId, c]));
  return rows.map((row) => {
    const correction = byRowId.get(row.rowId);
    if (!correction) return row;

    const next: StagedRow = { ...row };
    if (correction.skip !== undefined) next.skip = correction.skip;
    if (correction.status !== undefined) next.status = correction.status;
    if (correction.personalScore !== undefined) {
      next.personalScore = correction.personalScore;
    }
    if (correction.anilistId !== undefined) {
      next.anilistId = correction.anilistId;
      next.matchState = correction.anilistId == null ? "unmatched" : "matched";
    }
    return next;
  });
}

/** Resolve the rows ready to commit as library entries. */
export function toImportEntries(rows: StagedRow[]): ImportEntryInput[] {
  const entries: ImportEntryInput[] = [];
  for (const row of rows) {
    if (row.skip) continue;
    if (row.matchState !== "matched") continue;
    if (row.anilistId == null) continue;
    entries.push({
      anilistId: row.anilistId,
      status: row.status,
      personalScore: row.personalScore,
      progressEpisodes: row.progressEpisodes,
    });
  }
  return entries;
}
