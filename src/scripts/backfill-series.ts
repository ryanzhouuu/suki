/**
 * Backfill series mappings for all cached anime and recompute series rankings.
 *
 * Usage: npm run backfill:series
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* .env.local optional when env is already set */
  }
}

loadEnvLocal();

import { recomputeUserSeriesRanking } from "@/lib/ranking/recompute-series";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

async function backfillAnimeMappings() {
  const admin = createAdminClient();
  const { data: allAnime, error } = await admin.from("anime").select("*").order("anilist_id");

  if (error) throw new Error(error.message);

  const rows = (allAnime ?? []) as Tables<"anime">[];
  console.log(`Mapping ${rows.length} anime to series...`);

  let ok = 0;
  let failed = 0;

  for (const anime of rows) {
    try {
      await ensureAnimeSeriesMapping(anime);
      ok += 1;
      if (ok % 10 === 0) console.log(`  ${ok}/${rows.length} mapped`);
    } catch (e) {
      failed += 1;
      console.warn(
        `  Failed anilist_id=${anime.anilist_id}:`,
        e instanceof Error ? e.message : e,
      );
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`Done mapping: ${ok} ok, ${failed} failed`);
}

async function recomputeAllUserRankings() {
  const admin = createAdminClient();
  const { data: users, error } = await admin
    .from("user_anime_entries")
    .select("user_id")
    .eq("status", "completed");

  if (error) throw new Error(error.message);

  const userIds = [...new Set((users ?? []).map((u) => u.user_id))];
  console.log(`Recomputing series rankings for ${userIds.length} users...`);

  for (const userId of userIds) {
    try {
      await recomputeUserSeriesRanking(userId);
      console.log(`  Recomputed user ${userId}`);
    } catch (e) {
      console.warn(
        `  Failed user ${userId}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
}

async function main() {
  await backfillAnimeMappings();
  await recomputeAllUserRankings();
  console.log("Backfill complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
