/** Store pairs with left_anime_id < right_anime_id so (A,B) and (B,A) are one row. */
export function canonicalPairIds(
  animeIdA: string,
  animeIdB: string,
): [left: string, right: string] {
  return animeIdA < animeIdB
    ? [animeIdA, animeIdB]
    : [animeIdB, animeIdA];
}

export function pairKey(animeIdA: string, animeIdB: string): string {
  const [left, right] = canonicalPairIds(animeIdA, animeIdB);
  return `${left}:${right}`;
}
