export type ResolvedComparison = {
  winnerId: string;
  loserId: string;
};

export function resolvedComparisonsFromRows(
  rows: {
    left_series_id: string;
    right_series_id: string;
    winner_series_id: string | null;
  }[],
): ResolvedComparison[] {
  const resolved: ResolvedComparison[] = [];

  for (const row of rows) {
    const winner = row.winner_series_id;
    if (!winner) continue;

    const loser =
      winner === row.left_series_id ? row.right_series_id : row.left_series_id;

    resolved.push({ winnerId: winner, loserId: loser });
  }

  return resolved;
}
