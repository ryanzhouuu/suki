import type { SeriesRef } from "@/lib/library/group";

import { normalizeFranchise } from "./normalize-franchise";
import { compareStrings } from "./normalize-metadata";
import { normalizeRankings } from "./normalize-rankings";
import type {
  NormalizedFingerprintInput,
} from "./normalize-types";
import type { FingerprintBuildInput, FingerprintEntry } from "./types";

export type {
  FingerprintStatusCounts,
  NormalizedFingerprintInput,
  NormalizedFranchise,
  NormalizedRanking,
} from "./normalize-types";

/** Collapse season-level entries into deterministic franchise-level records. */
export function normalizeFingerprintInput(
  input: Pick<FingerprintBuildInput, "entries" | "rankings" | "seriesByAnimeId">,
): NormalizedFingerprintInput {
  const groups = new Map<
    string,
    { series: SeriesRef | null; entries: FingerprintEntry[] }
  >();

  for (const entry of input.entries) {
    const series = input.seriesByAnimeId.get(entry.anime_id) ?? null;
    const key = series?.id || `anime:${entry.anime_id}`;
    const group = groups.get(key);
    if (group) group.entries.push(entry);
    else groups.set(key, { series, entries: [entry] });
  }

  const rankings = normalizeRankings(input.rankings);
  const rankingBySeriesId = new Map(
    rankings.map((ranking) => [ranking.seriesId, ranking]),
  );
  const franchises = [...groups.entries()]
    .sort(([a], [b]) => compareStrings(a, b))
    .map(([key, group]) =>
      normalizeFranchise(
        key,
        group.series,
        group.entries,
        rankingBySeriesId.get(key) ?? null,
      ),
    );

  return {
    franchises,
    rankedFranchises: franchises
      .filter((franchise) => franchise.ranking !== null)
      .sort(
        (a, b) =>
          (a.ranking?.rank ?? Number.POSITIVE_INFINITY) -
            (b.ranking?.rank ?? Number.POSITIVE_INFINITY) ||
          compareStrings(a.id, b.id),
      ),
    rankingCount: rankings.length,
  };
}
