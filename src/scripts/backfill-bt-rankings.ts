/**
 * Recompute every user's series ranking under the current algorithm version.
 *
 * Used to populate Bradley-Terry (bt_series_v1) rankings after the engine swap,
 * without re-running the (heavy, AniList-bound) series mapping that
 * `backfill:series` also does. Series mappings are assumed already present.
 *
 * Usage: npm run backfill:bt-rankings
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { recomputeUserSeriesRanking } from "@/lib/ranking/recompute-series";
import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const admin = createAdminClient();
  const { data: users, error } = await admin
    .from("user_anime_entries")
    .select("user_id")
    .eq("status", "completed");

  if (error) throw new Error(error.message);

  const userIds = [...new Set((users ?? []).map((u) => u.user_id))];
  console.log(
    `Recomputing ${RANKING_ALGORITHM_VERSION} rankings for ${userIds.length} users...`,
  );

  let ok = 0;
  let failed = 0;
  for (const userId of userIds) {
    try {
      await recomputeUserSeriesRanking(userId);
      ok++;
      console.log(`  Recomputed user ${userId}`);
    } catch (e) {
      failed++;
      console.warn(
        `  Failed user ${userId}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  console.log(`Done: ${ok} ok, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
