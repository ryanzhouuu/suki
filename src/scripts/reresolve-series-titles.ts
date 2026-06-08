/**
 * Re-derive canonical_title for every series WITHOUT calling AniList.
 *
 * Cluster membership is already materialized in `anime_series_map`, so the
 * franchise label can be recomputed purely from cached anime rows. This is the
 * fast counterpart to `backfill:series` (which re-fetches every franchise graph
 * from AniList) and is meant for correcting titles after a change to the
 * consolidation logic in `src/lib/series/title.ts`.
 *
 * Usage:
 *   npm run reresolve:titles            # dry run, prints proposed changes
 *   npm run reresolve:titles -- --apply # writes the new canonical_title values
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { pickPrimaryMedia, type FranchiseMediaNode } from "@/lib/series/graph";
import { franchiseRootForCluster } from "@/lib/series/merge";
import {
  displayTitleFromAniList,
  franchiseRootFromTitle,
} from "@/lib/series/title";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

type MappedAnime = Pick<
  Tables<"anime">,
  | "anilist_id"
  | "english_title"
  | "romaji_title"
  | "format"
  | "season_year"
  | "cover_image_url"
>;

function animeToNode(anime: MappedAnime): FranchiseMediaNode {
  return {
    anilistId: anime.anilist_id,
    format: anime.format,
    seasonYear: anime.season_year,
    title: {
      english: anime.english_title,
      romaji: anime.romaji_title,
      native: null,
    },
    coverImageUrl: anime.cover_image_url,
  };
}

/** Mirror of resolveFromCluster's canonical-title computation, sans AniList. */
function canonicalTitleForCluster(cluster: FranchiseMediaNode[]): string {
  const primary = pickPrimaryMedia(cluster);
  const fallbackTitle =
    primary.title.english || primary.title.romaji || "";
  const franchiseRoot = franchiseRootForCluster(cluster, fallbackTitle);
  const fallbackRoot = franchiseRootFromTitle(fallbackTitle);
  const primaryRoot = franchiseRootFromTitle(
    primary.title.english || primary.title.romaji || fallbackTitle,
  );
  return (
    franchiseRoot ||
    fallbackRoot ||
    primaryRoot ||
    displayTitleFromAniList(primary.title)
  );
}

async function loadMembersBySeries(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<string, FranchiseMediaNode[]>> {
  const bySeries = new Map<string, FranchiseMediaNode[]>();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("anime_series_map")
      .select(
        "series_id, anime(anilist_id, english_title, romaji_title, format, season_year, cover_image_url)",
      )
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      const anime = row.anime as MappedAnime | null;
      if (!anime) continue;
      const list = bySeries.get(row.series_id) ?? [];
      list.push(animeToNode(anime));
      bySeries.set(row.series_id, list);
    }

    if (rows.length < pageSize) break;
  }

  return bySeries;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const admin = createAdminClient();

  const { data: series, error } = await admin
    .from("series")
    .select("id, canonical_title")
    .order("canonical_title");
  if (error) throw new Error(error.message);

  const membersBySeries = await loadMembersBySeries(admin);

  const changes: { id: string; from: string; to: string }[] = [];
  let noMembers = 0;

  for (const row of series ?? []) {
    const cluster = membersBySeries.get(row.id);
    if (!cluster || cluster.length === 0) {
      noMembers += 1;
      continue;
    }
    const next = canonicalTitleForCluster(cluster);
    if (next && next !== row.canonical_title) {
      changes.push({ id: row.id, from: row.canonical_title, to: next });
    }
  }

  console.log(
    `${series?.length ?? 0} series, ${changes.length} title change(s)` +
      (noMembers ? `, ${noMembers} with no mapped anime (skipped)` : ""),
  );
  for (const c of changes) {
    console.log(`  "${c.from}"  ->  "${c.to}"`);
  }

  if (!apply) {
    console.log("\nDry run. Re-run with `-- --apply` to write these changes.");
    return;
  }

  let updated = 0;
  for (const c of changes) {
    const { error: updErr } = await admin
      .from("series")
      .update({ canonical_title: c.to })
      .eq("id", c.id);
    if (updErr) {
      console.warn(`  Failed to update ${c.id}: ${updErr.message}`);
      continue;
    }
    updated += 1;
  }
  console.log(`Applied ${updated}/${changes.length} updates.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
