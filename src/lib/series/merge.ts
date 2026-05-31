import type { FranchiseMediaNode } from "./graph";
import {
  franchiseRootFromTitle,
  pickConsolidatedFranchiseRoot,
  sameFranchiseTitle,
} from "./title";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Find the canonical series row for a normalized franchise root, including
 * legacy rows whose title still has season / part / Roman suffixes.
 */
export async function findSeriesByFranchiseRoot(
  admin: AdminClient,
  franchiseRoot: string,
): Promise<Tables<"series"> | null> {
  const { data: exact } = await admin
    .from("series")
    .select("*")
    .eq("canonical_title", franchiseRoot)
    .maybeSingle();

  if (exact) return exact;

  const { data: candidates } = await admin
    .from("series")
    .select("*")
    .ilike("canonical_title", `${franchiseRoot}%`);

  let best: Tables<"series"> | null = null;
  for (const row of candidates ?? []) {
    if (franchiseRootFromTitle(row.canonical_title) !== franchiseRoot) continue;
    if (
      !best ||
      row.anilist_primary_id < best.anilist_primary_id ||
      row.canonical_title === franchiseRoot
    ) {
      best = row;
    }
  }

  return best;
}

/**
 * Find an existing series row already used by any member of this franchise cluster
 * or matching the shared franchise title.
 */
export async function findExistingSeriesForFranchise(
  admin: AdminClient,
  cluster: FranchiseMediaNode[],
  franchiseRoot: string,
): Promise<Tables<"series"> | null> {
  const byRoot = await findSeriesByFranchiseRoot(admin, franchiseRoot);
  if (byRoot) return byRoot;

  const anilistIds = cluster.map((n) => n.anilistId);
  if (anilistIds.length === 0) return null;

  const { data: animeRows } = await admin
    .from("anime")
    .select("id, anilist_id")
    .in("anilist_id", anilistIds);

  if (!animeRows?.length) return null;

  const { data: maps } = await admin
    .from("anime_series_map")
    .select("series_id, series(*)")
    .in(
      "anime_id",
      animeRows.map((a) => a.id),
    );

  let best: Tables<"series"> | null = null;
  let bestCount = 0;

  for (const row of maps ?? []) {
    const series = row.series as Tables<"series"> | null;
    if (!series) continue;
    if (!sameFranchiseTitle(series.canonical_title, franchiseRoot)) continue;

    const count = (maps ?? []).filter(
      (m) => (m.series as Tables<"series"> | null)?.id === series.id,
    ).length;

    if (count > bestCount) {
      best = series;
      bestCount = count;
    }
  }

  return best;
}

export function franchiseRootForCluster(
  cluster: FranchiseMediaNode[],
  fallbackTitle: string,
): string {
  const roots = cluster.map((n) =>
    franchiseRootFromTitle(
      n.title.english || n.title.romaji || fallbackTitle,
    ),
  );
  roots.push(franchiseRootFromTitle(fallbackTitle));

  return pickConsolidatedFranchiseRoot(roots);
}
