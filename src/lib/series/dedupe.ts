import { sameFranchiseTitle } from "./title";

export type SeriesLite = {
  id: string;
  canonical_title: string;
  anilist_primary_id: number;
};

export type MergePlan = {
  survivorId: string;
  loserIds: string[];
};

/**
 * Group series rows that resolve to the same franchise and pick a survivor for
 * each group — the row with the most members, tie-broken by lowest AniList id
 * (the stable franchise primary). Grouping is anchor-based against `sameFranchiseTitle`,
 * which is conservative (e.g. "Fate/Zero" and "Fate/stay night" stay distinct),
 * so it never bridges unrelated franchises.
 */
export function planDuplicateMerges(
  series: SeriesLite[],
  memberCount: Map<string, number>,
): MergePlan[] {
  const used = new Set<string>();
  const plans: MergePlan[] = [];

  for (let i = 0; i < series.length; i++) {
    const anchor = series[i];
    if (used.has(anchor.id)) continue;

    const group = [anchor];
    used.add(anchor.id);

    for (let j = i + 1; j < series.length; j++) {
      const other = series[j];
      if (used.has(other.id)) continue;
      if (sameFranchiseTitle(anchor.canonical_title, other.canonical_title)) {
        group.push(other);
        used.add(other.id);
      }
    }

    if (group.length < 2) continue;

    group.sort((a, b) => {
      const diff = (memberCount.get(b.id) ?? 0) - (memberCount.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      return a.anilist_primary_id - b.anilist_primary_id;
    });

    plans.push({
      survivorId: group[0].id,
      loserIds: group.slice(1).map((s) => s.id),
    });
  }

  return plans;
}
