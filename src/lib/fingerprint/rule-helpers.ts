import type { FingerprintFacts } from "./facts";
import type { FingerprintCandidate, FingerprintRule } from "./rule-types";
import type { TraitEvidence } from "./types";

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function evidence(
  kind: string,
  text: string,
  options: Omit<TraitEvidence, "kind" | "text"> = {},
): TraitEvidence {
  return {
    kind,
    text,
    ...options,
    seriesIds: options.seriesIds
      ? [...new Set(options.seriesIds)].sort(compareStrings)
      : undefined,
  };
}

export function titleList(
  facts: FingerprintFacts,
  predicate: (franchise: FingerprintFacts["franchises"][number]) => boolean,
  limit = 3,
): { titles: string; ids: string[] } {
  const selected = facts.franchises
    .filter(predicate)
    .sort(
      (a, b) =>
        (a.ranking?.rank ?? Number.POSITIVE_INFINITY) -
          (b.ranking?.rank ?? Number.POSITIVE_INFINITY) ||
        compareStrings(a.id, b.id),
    )
    .slice(0, limit);
  return {
    titles: selected.map((franchise) => franchise.title).join(", "),
    ids: selected.map((franchise) => franchise.id),
  };
}

export function candidate(
  rule: FingerprintRule,
  strength: number,
  evidenceItems: TraitEvidence[],
  copy?: { label: string; summary: string },
): FingerprintCandidate {
  return {
    id: rule.id,
    family: rule.family,
    label: copy?.label ?? rule.label,
    summary: copy?.summary ?? rule.summary,
    strength: clamp01(strength),
    evidence: evidenceItems,
    opposingTraitIds: rule.opposingTraitIds ?? [],
    editorialPriority: rule.editorialPriority,
  };
}
