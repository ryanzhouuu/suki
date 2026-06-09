import { randomUUID } from "node:crypto";

import {
  IMPORT_AUTO_ACCEPT_SIMILARITY,
  IMPORT_SEARCH_CANDIDATES,
} from "./constants";
import { titleSimilarity } from "./similarity";
import type { ImportCandidate, StagedRow } from "./types";

/** Search function injected so the matcher stays pure/testable. */
export type CandidateSearch = (query: string) => Promise<ImportCandidate[]>;

/** Split pasted text into trimmed, de-duplicated (case-insensitive) lines. */
export function parsePlainText(text: string): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
  }
  return lines;
}

/**
 * Match a single pasted title: run one search, score candidates, auto-accept
 * the top hit only if it clears the similarity bar, else queue it for review.
 */
export async function matchPlainTextLine(
  line: string,
  search: CandidateSearch,
): Promise<StagedRow> {
  const base: StagedRow = {
    rowId: randomUUID(),
    sourceTitle: line,
    matchState: "unmatched",
    anilistId: null,
    media: null,
    status: "plan_to_watch",
    personalScore: null,
    progressEpisodes: 0,
    skip: false,
  };

  const results = await search(line);
  if (results.length === 0) return base;

  // Roadmap decision: take AniList's top (most-relevant) hit and score it;
  // auto-accept only above the bar. Candidates are surfaced in review.
  const candidates = results
    .slice(0, IMPORT_SEARCH_CANDIDATES)
    .map((candidate) => ({
      ...candidate,
      similarity: titleSimilarity(line, candidate.title),
    }));

  const top = candidates[0];

  if ((top.similarity ?? 0) >= IMPORT_AUTO_ACCEPT_SIMILARITY) {
    return {
      ...base,
      matchState: "matched",
      anilistId: top.anilistId,
      similarity: top.similarity,
    };
  }

  return {
    ...base,
    matchState: "needs_review",
    similarity: top.similarity,
    candidates,
  };
}
