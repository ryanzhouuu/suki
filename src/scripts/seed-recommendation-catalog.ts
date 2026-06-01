/**
 * Cache + embed popular/trending anime from AniList to grow the recommendation pool.
 * Usage: npm run seed:catalog
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */
import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { syncAnimeCatalogFromAnilist } from "@/lib/anime/catalog-sync";
import { getLatestAnime, getPopularAnime } from "@/lib/anilist/discover";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";

const DEFAULT_LIMIT = 60;
/** ~24 AniList requests/min (unauthenticated limit is ~30/min). */
const DELAY_MS = 2500;

async function main() {
  if (!isEmbeddingConfigured()) {
    console.error("OPENAI_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const limit = Number(process.argv[2]) || DEFAULT_LIMIT;

  const [popular, latest] = await Promise.all([
    getPopularAnime(),
    getLatestAnime(),
  ]);

  const ids = [...new Set([...popular, ...latest].map((a) => a.anilistId))].slice(
    0,
    limit,
  );

  console.log(
    `Seeding ${ids.length} titles (${DELAY_MS}ms between each, lightweight mapping)…`,
  );

  let synced = 0;
  let failed = 0;

  for (const anilistId of ids) {
    try {
      await syncAnimeCatalogFromAnilist(anilistId, {
        lightweightSeriesMapping: true,
      });
      synced += 1;
      if (synced % 5 === 0) {
        console.log(`  ${synced}/${ids.length} cached and embedded`);
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    } catch (e) {
      failed += 1;
      console.warn(
        `  Failed ${anilistId}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  console.log(`Done. ${synced} synced, ${failed} failed.`);
  console.log("Run npm run backfill:embeddings if needed, then refresh /recommendations.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
