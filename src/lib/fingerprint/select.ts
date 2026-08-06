import type { FingerprintTrait, TraitEvidence, TraitFamily } from "./types";
import type { FingerprintCandidate } from "./rules";

export const MAX_FINGERPRINT_TRAITS = 5;

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function validEvidence(item: TraitEvidence): boolean {
  if (typeof item.kind !== "string" || item.kind.trim().length === 0) {
    return false;
  }
  if (typeof item.text !== "string" || item.text.trim().length === 0) {
    return false;
  }
  if (item.value !== undefined && !Number.isFinite(item.value)) return false;
  if (
    item.denominator !== undefined &&
    (!Number.isFinite(item.denominator) || item.denominator <= 0)
  ) {
    return false;
  }
  if (
    item.seriesIds?.some(
      (seriesId) => typeof seriesId !== "string" || seriesId.trim().length === 0,
    )
  ) {
    return false;
  }
  return true;
}

export function isValidFingerprintCandidate(
  candidate: FingerprintCandidate,
): boolean {
  return (
    typeof candidate.id === "string" &&
    typeof candidate.family === "string" &&
    typeof candidate.label === "string" &&
    candidate.label.trim().length > 0 &&
    typeof candidate.summary === "string" &&
    candidate.summary.trim().length > 0 &&
    Number.isFinite(candidate.strength) &&
    candidate.strength >= 0 &&
    candidate.strength <= 1 &&
    candidate.evidence.length >= 2 &&
    candidate.evidence.length <= 3 &&
    candidate.evidence.every(validEvidence)
  );
}

function compareCandidates(
  a: FingerprintCandidate,
  b: FingerprintCandidate,
): number {
  return (
    b.strength - a.strength ||
    b.editorialPriority - a.editorialPriority ||
    compareStrings(a.id, b.id)
  );
}

function conflicts(
  candidate: FingerprintCandidate,
  selected: readonly FingerprintCandidate[],
): boolean {
  return selected.some(
    (other) =>
      candidate.opposingTraitIds.includes(other.id) ||
      other.opposingTraitIds.includes(candidate.id),
  );
}

function toPublicTrait(candidate: FingerprintCandidate): FingerprintTrait {
  return {
    id: candidate.id,
    family: candidate.family,
    label: candidate.label,
    summary: candidate.summary,
    strength: candidate.strength,
    evidence: candidate.evidence.map((item) => ({
      ...item,
      seriesIds: item.seriesIds ? [...item.seriesIds] : undefined,
    })),
  };
}

/**
 * Prefer one trait per family for the constellation's first pass, then use
 * remaining capacity for the strongest compatible candidates.
 */
export function selectFingerprintTraits(
  candidates: readonly FingerprintCandidate[],
  maxTraits = MAX_FINGERPRINT_TRAITS,
): FingerprintTrait[] {
  const ordered = candidates
    .filter(isValidFingerprintCandidate)
    .sort(compareCandidates);
  const selected: FingerprintCandidate[] = [];
  const families = new Set<TraitFamily>();

  for (const candidate of ordered) {
    if (selected.length >= Math.max(0, maxTraits)) break;
    if (families.has(candidate.family) || conflicts(candidate, selected)) continue;
    selected.push(candidate);
    families.add(candidate.family);
  }

  for (const candidate of ordered) {
    if (selected.length >= Math.max(0, maxTraits)) break;
    if (selected.some((existing) => existing.id === candidate.id)) continue;
    if (conflicts(candidate, selected)) continue;
    selected.push(candidate);
  }

  return selected.map(toPublicTrait);
}
