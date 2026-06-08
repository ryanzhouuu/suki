/**
 * Re-group franchise entries that landed in their own series row — most often
 * movies, specials, OVAs/ONAs, and spin-offs whose distinguishing titles used
 * to defeat franchise consolidation (e.g. "The Quintessential Quintuplets
 * Movie", "Chainsaw Man – The Movie: Reze Arc").
 *
 * Unlike `reresolve:titles`, this re-fetches AniList relations (the movie→TV
 * link only exists there, not in the title), but it is scoped to non-TV entries
 * and memoizes the relations crawl so each media is fetched at most once per run.
 * Ranking/comparison data is migrated off the old series and orphan rows are
 * removed via the same helpers the admin "apply override" flow uses.
 *
 * Usage:
 *   npm run regroup:franchises             # dry run, lists proposed regroupings
 *   npm run regroup:franchises -- --apply  # repoint maps, migrate rankings
 *   npm run regroup:franchises -- --all    # consider every anime, not just non-TV
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { enableAnilistQueryCache } from "@/lib/anilist/client";
import {
  consolidateSeriesReferences,
  deleteOrphanSeries,
  recomputeUsersForSeries,
} from "@/lib/series/consolidate";
import { fetchFranchiseCluster } from "@/lib/series/graph";
import {
  findSeriesByFranchiseRoot,
  franchiseRootForCluster,
} from "@/lib/series/merge";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Formats that commonly get isolated; TV/TV_SHORT seasons rarely do. */
const TARGET_FORMATS = new Set(["MOVIE", "ONA", "OVA", "SPECIAL"]);

async function currentSeries(
  admin: AdminClient,
  animeId: string,
): Promise<Pick<Tables<"series">, "id" | "canonical_title"> | null> {
  const { data } = await admin
    .from("anime_series_map")
    .select("series:series(id, canonical_title)")
    .eq("anime_id", animeId)
    .maybeSingle();
  return (data?.series as Pick<Tables<"series">, "id" | "canonical_title">) ?? null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const all = process.argv.includes("--all");

  enableAnilistQueryCache();
  const admin = createAdminClient();

  const { data: anime, error } = await admin
    .from("anime")
    .select("*")
    .order("anilist_id");
  if (error) throw new Error(error.message);

  const candidates = (anime ?? []).filter(
    (a) => all || (a.format !== null && TARGET_FORMATS.has(a.format)),
  );
  console.log(
    `${candidates.length} candidate anime (${apply ? "APPLY" : "dry run"})`,
  );

  const affected = new Set<string>();
  let regrouped = 0;
  let processed = 0;
  let failed = 0;

  for (const a of candidates) {
    processed += 1;
    if (processed % 25 === 0) {
      console.log(`  …${processed}/${candidates.length}`);
    }

    const title =
      a.english_title || a.romaji_title || `Anime ${a.anilist_id}`;

    try {
      const current = await currentSeries(admin, a.id);
      const cluster = await fetchFranchiseCluster(a.anilist_id);
      if (cluster.length <= 1) continue; // standalone — nothing to join

      const root = franchiseRootForCluster(cluster, title);
      const target = await findSeriesByFranchiseRoot(admin, root);
      const wouldChange = Boolean(
        target && current && target.id !== current.id,
      );

      if (!apply) {
        if (wouldChange) {
          console.log(
            `  "${title}"  [${current!.canonical_title}]  ->  [${target!.canonical_title}]`,
          );
          regrouped += 1;
        }
        continue;
      }

      const resolved = await ensureAnimeSeriesMapping(a);
      if (current && current.id !== resolved.series.id) {
        await consolidateSeriesReferences(current.id, resolved.series.id);
        await deleteOrphanSeries(admin, current.id);
        affected.add(current.id);
        affected.add(resolved.series.id);
        regrouped += 1;
        console.log(
          `  regrouped "${title}"  ->  "${resolved.series.canonical_title}"`,
        );
      }
    } catch (e) {
      failed += 1;
      console.warn(
        `  failed anilist_id=${a.anilist_id}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  if (apply && affected.size > 0) {
    const users = await recomputeUsersForSeries([...affected]);
    console.log(`Recomputed rankings for ${users} user(s).`);
  }

  console.log(
    `${apply ? "Regrouped" : "Would regroup"} ${regrouped} entr(ies); ${failed} error(s).`,
  );
  if (!apply) {
    console.log("\nDry run. Re-run with `-- --apply` to write these changes.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
