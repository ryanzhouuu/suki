/**
 * Pure string-similarity helpers for fuzzy title matching (plain-text import).
 *
 * Uses the Sørensen–Dice coefficient over character bigrams of normalized
 * titles. Cheap, dependency-free, and stable enough to gate auto-accept at a
 * high threshold (see IMPORT_AUTO_ACCEPT_SIMILARITY).
 */

/** Lowercase, strip punctuation/symbols, collapse whitespace. */
export function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(value: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i < value.length - 1; i++) {
    const gram = value.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

/**
 * Returns a similarity score in [0, 1]. 1 means the normalized titles are
 * identical; 0 means no shared bigrams.
 */
export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);

  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;

  const gramsA = bigrams(na);
  const gramsB = bigrams(nb);

  let intersection = 0;
  let totalA = 0;
  for (const count of gramsA.values()) totalA += count;
  let totalB = 0;
  for (const count of gramsB.values()) totalB += count;

  for (const [gram, countA] of gramsA) {
    const countB = gramsB.get(gram);
    if (countB) intersection += Math.min(countA, countB);
  }

  return (2 * intersection) / (totalA + totalB);
}
