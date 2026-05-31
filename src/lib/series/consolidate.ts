import { canonicalPairIds } from "@/lib/ranking/canonical-pair";
import { recomputeUserSeriesRanking } from "@/lib/ranking/recompute-series";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

type ComparisonRow = Pick<
  Tables<"pairwise_series_comparisons">,
  | "id"
  | "user_id"
  | "left_series_id"
  | "right_series_id"
  | "winner_series_id"
  | "skipped_reason"
  | "created_at"
>;

export type ConsolidateSeriesResult = {
  comparisonsUpserted: number;
  comparisonsRemoved: number;
  rankingsRowsRemoved: number;
};

function remapId(seriesId: string, fromId: string, toId: string): string {
  return seriesId === fromId ? toId : seriesId;
}

/** Remap one comparison row when merging `fromId` into `toId`. */
export function remapComparisonRow(
  row: ComparisonRow,
  fromId: string,
  toId: string,
): Omit<ComparisonRow, "id"> | null {
  if (fromId === toId) return row;

  const left = remapId(row.left_series_id, fromId, toId);
  const right = remapId(row.right_series_id, fromId, toId);
  if (left === right) return null;

  const [leftSeriesId, rightSeriesId] = canonicalPairIds(left, right);

  let winnerSeriesId = row.winner_series_id
    ? remapId(row.winner_series_id, fromId, toId)
    : null;

  if (
    winnerSeriesId &&
    winnerSeriesId !== leftSeriesId &&
    winnerSeriesId !== rightSeriesId
  ) {
    winnerSeriesId = null;
  }

  return {
    user_id: row.user_id,
    left_series_id: leftSeriesId,
    right_series_id: rightSeriesId,
    winner_series_id: winnerSeriesId,
    skipped_reason: row.skipped_reason,
    created_at: row.created_at,
  };
}

function pickPreferredComparison(
  a: Omit<ComparisonRow, "id">,
  b: Omit<ComparisonRow, "id">,
): Omit<ComparisonRow, "id"> {
  if (a.winner_series_id && !b.winner_series_id) return a;
  if (b.winner_series_id && !a.winner_series_id) return b;
  return a.created_at <= b.created_at ? a : b;
}

/**
 * Move ranking/comparison data from a deprecated series row onto the canonical one.
 */
export async function consolidateSeriesReferences(
  fromSeriesId: string,
  toSeriesId: string,
): Promise<ConsolidateSeriesResult> {
  const result: ConsolidateSeriesResult = {
    comparisonsUpserted: 0,
    comparisonsRemoved: 0,
    rankingsRowsRemoved: 0,
  };

  if (fromSeriesId === toSeriesId) return result;

  const admin = createAdminClient();

  const { data: comparisons, error } = await admin
    .from("pairwise_series_comparisons")
    .select(
      "id, user_id, left_series_id, right_series_id, winner_series_id, skipped_reason, created_at",
    )
    .or(
      `left_series_id.eq.${fromSeriesId},right_series_id.eq.${fromSeriesId},winner_series_id.eq.${fromSeriesId}`,
    );

  if (error) throw new Error(error.message);

  const rows = (comparisons ?? []) as ComparisonRow[];
  const deleteIds = new Set(rows.map((r) => r.id));
  const deduped = new Map<string, Omit<ComparisonRow, "id">>();

  for (const row of rows) {
    const remapped = remapComparisonRow(row, fromSeriesId, toSeriesId);
    if (!remapped) {
      result.comparisonsRemoved += 1;
      continue;
    }

    const key = `${remapped.user_id}:${remapped.left_series_id}:${remapped.right_series_id}`;
    const existing = deduped.get(key);
    deduped.set(
      key,
      existing ? pickPreferredComparison(existing, remapped) : remapped,
    );
  }

  if (deduped.size > 0) {
    const { error: upsertError } = await admin
      .from("pairwise_series_comparisons")
      .upsert([...deduped.values()], {
        onConflict: "user_id,left_series_id,right_series_id",
      });
    if (upsertError) throw new Error(upsertError.message);
    result.comparisonsUpserted = deduped.size;
  }

  if (deleteIds.size > 0) {
    const { error: deleteError } = await admin
      .from("pairwise_series_comparisons")
      .delete()
      .in("id", [...deleteIds]);
    if (deleteError) throw new Error(deleteError.message);
    result.comparisonsRemoved += deleteIds.size;
  }

  const { count: rankingsRemoved, error: rankDeleteError } = await admin
    .from("derived_series_rankings")
    .delete({ count: "exact" })
    .eq("series_id", fromSeriesId);
  if (rankDeleteError) throw new Error(rankDeleteError.message);
  result.rankingsRowsRemoved = rankingsRemoved ?? 0;

  const { error: recError } = await admin
    .from("recommendations")
    .update({ series_id: toSeriesId })
    .eq("series_id", fromSeriesId);
  if (recError) throw new Error(recError.message);

  const { error: overrideError } = await admin
    .from("series_group_overrides")
    .update({ target_series_id: toSeriesId })
    .eq("target_series_id", fromSeriesId);
  if (overrideError) throw new Error(overrideError.message);

  return result;
}

export async function deleteOrphanSeries(
  admin: AdminClient,
  seriesId: string,
): Promise<boolean> {
  const { count: mapCount } = await admin
    .from("anime_series_map")
    .select("*", { count: "exact", head: true })
    .eq("series_id", seriesId);

  if ((mapCount ?? 0) > 0) return false;

  const { count: compCount } = await admin
    .from("pairwise_series_comparisons")
    .select("*", { count: "exact", head: true })
    .or(
      `left_series_id.eq.${seriesId},right_series_id.eq.${seriesId},winner_series_id.eq.${seriesId}`,
    );

  if ((compCount ?? 0) > 0) return false;

  const { error } = await admin.from("series").delete().eq("id", seriesId);
  if (error) throw new Error(error.message);
  return true;
}

export async function collectUsersAffectedBySeries(
  admin: AdminClient,
  seriesIds: string[],
): Promise<string[]> {
  const ids = [...new Set(seriesIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const userIds = new Set<string>();
  const orFilter = ids
    .flatMap((id) => [
      `left_series_id.eq.${id}`,
      `right_series_id.eq.${id}`,
      `winner_series_id.eq.${id}`,
    ])
    .join(",");

  const { data: comparisonUsers } = await admin
    .from("pairwise_series_comparisons")
    .select("user_id")
    .or(orFilter);

  for (const row of comparisonUsers ?? []) {
    userIds.add(row.user_id);
  }

  const { data: rankingUsers } = await admin
    .from("derived_series_rankings")
    .select("user_id")
    .in("series_id", ids);

  for (const row of rankingUsers ?? []) {
    userIds.add(row.user_id);
  }

  const { data: maps } = await admin
    .from("anime_series_map")
    .select("anime_id, series_id")
    .in("series_id", ids);

  const animeIds = (maps ?? []).map((m) => m.anime_id);
  if (animeIds.length > 0) {
    const { data: entries } = await admin
      .from("user_anime_entries")
      .select("user_id")
      .in("anime_id", animeIds)
      .eq("status", "completed");

    for (const row of entries ?? []) {
      userIds.add(row.user_id);
    }
  }

  return [...userIds];
}

export async function recomputeUsersForSeries(
  seriesIds: string[],
): Promise<number> {
  const admin = createAdminClient();
  const userIds = await collectUsersAffectedBySeries(admin, seriesIds);

  for (const userId of userIds) {
    await recomputeUserSeriesRanking(userId);
  }

  return userIds.length;
}
