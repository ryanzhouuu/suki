/**
 * Merge duplicate franchise series rows and remove orphaned rows — entirely from
 * the database, with no AniList calls.
 *
 * Earlier passes left multiple rows per franchise: un-merged TV seasons
 * ("Attack on Titan" ×4, "HAIKYU!! 2nd Season"), casing/punctuation variants
 * ("ONE PIECE" vs "One Piece"), and colon-subtitle splits ("Bleach" vs
 * "BLEACH: Thousand-Year Blood War"). `reresolve:titles` only renamed rows; it
 * never merged them. This collapses each franchise to a single row (migrating
 * ranking/comparison data via the same helpers as the admin merge flow) and
 * deletes rows that no longer have any anime mapped to them.
 *
 * Usage:
 *   npm run dedupe:series             # dry run, lists merges + orphan deletes
 *   npm run dedupe:series -- --apply  # perform the merges and deletions
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import {
  consolidateSeriesReferences,
  deleteOrphanSeries,
  recomputeUsersForSeries,
} from "@/lib/series/consolidate";
import { planDuplicateMerges, type SeriesLite } from "@/lib/series/dedupe";
import type { FranchiseMediaNode } from "@/lib/series/graph";
import { franchiseRootForCluster } from "@/lib/series/merge";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

import { fetchAllRows } from "./paginate";

type AdminClient = ReturnType<typeof createAdminClient>;

type MemberAnime = Pick<
  Tables<"anime">,
  "anilist_id" | "english_title" | "romaji_title" | "format" | "season_year" | "cover_image_url"
>;

function animeToNode(a: MemberAnime): FranchiseMediaNode {
  return {
    anilistId: a.anilist_id,
    format: a.format,
    seasonYear: a.season_year,
    title: { english: a.english_title, romaji: a.romaji_title, native: null },
    coverImageUrl: a.cover_image_url,
  };
}

async function loadMembers(
  admin: AdminClient,
): Promise<Map<string, MemberAnime[]>> {
  const rows = await fetchAllRows<{
    series_id: string;
    anime: MemberAnime | null;
  }>((from, to) =>
    admin
      .from("anime_series_map")
      .select(
        "series_id, anime(anilist_id, english_title, romaji_title, format, season_year, cover_image_url)",
      )
      .range(from, to),
  );

  const bySeries = new Map<string, MemberAnime[]>();
  for (const row of rows) {
    if (!row.anime) continue;
    const list = bySeries.get(row.series_id) ?? [];
    list.push(row.anime);
    bySeries.set(row.series_id, list);
  }
  return bySeries;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const admin = createAdminClient();

  const series = await fetchAllRows<SeriesLite>((from, to) =>
    admin.from("series").select("id, canonical_title, anilist_primary_id").range(from, to),
  );

  const membersBySeries = await loadMembers(admin);
  const memberCount = new Map<string, number>(
    series.map((s) => [s.id, membersBySeries.get(s.id)?.length ?? 0]),
  );
  const titleById = new Map(series.map((s) => [s.id, s.canonical_title]));

  const plans = planDuplicateMerges(series, memberCount);

  // Re-derive the surviving title from the combined membership of each group.
  const planned = plans.map((plan) => {
    const memberAnime = [plan.survivorId, ...plan.loserIds].flatMap(
      (id) => membersBySeries.get(id) ?? [],
    );
    const nodes = memberAnime.map(animeToNode);
    const fallback = titleById.get(plan.survivorId) ?? "";
    const newTitle =
      nodes.length > 0 ? franchiseRootForCluster(nodes, fallback) : fallback;
    return { ...plan, newTitle };
  });

  const orphans = series.filter((s) => (memberCount.get(s.id) ?? 0) === 0);

  console.log(
    `${series.length} series; ${planned.length} franchise group(s) to merge; ` +
      `${orphans.length} orphan row(s) to check (${apply ? "APPLY" : "dry run"})`,
  );
  for (const plan of planned) {
    const losers = plan.loserIds
      .map((id) => `"${titleById.get(id)}"`)
      .join(", ");
    console.log(
      `  merge ${plan.loserIds.length} -> "${plan.newTitle}"  (drop: ${losers})`,
    );
  }

  if (!apply) {
    console.log("\nDry run. Re-run with `-- --apply` to perform merges.");
    return;
  }

  const affected = new Set<string>();
  let mergedRows = 0;

  for (const plan of planned) {
    for (const loserId of plan.loserIds) {
      await consolidateSeriesReferences(loserId, plan.survivorId);
      // consolidate moves ranking data but not the membership map; repoint it.
      const { error: remapErr } = await admin
        .from("anime_series_map")
        .update({ series_id: plan.survivorId })
        .eq("series_id", loserId);
      if (remapErr) throw new Error(remapErr.message);
      await deleteOrphanSeries(admin, loserId);
      affected.add(loserId);
      mergedRows += 1;
    }

    if (plan.newTitle && plan.newTitle !== titleById.get(plan.survivorId)) {
      const { error: titleErr } = await admin
        .from("series")
        .update({ canonical_title: plan.newTitle })
        .eq("id", plan.survivorId);
      if (titleErr) throw new Error(titleErr.message);
    }
    affected.add(plan.survivorId);
  }

  let orphansDeleted = 0;
  for (const orphan of orphans) {
    if (await deleteOrphanSeries(admin, orphan.id)) orphansDeleted += 1;
  }

  if (affected.size > 0) {
    const users = await recomputeUsersForSeries([...affected]);
    console.log(`Recomputed rankings for ${users} user(s).`);
  }

  console.log(
    `Merged ${mergedRows} duplicate row(s); deleted ${orphansDeleted} orphan(s).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
