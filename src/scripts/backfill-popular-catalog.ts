/**
 * Cache the top N popular anime from AniList into Supabase (and optionally embed).
 *
 * Usage:
 *   npm run backfill:popular              # top 300, embed if OPENAI_API_KEY set
 *   npm run backfill:popular -- 100       # top 100
 *   npm run backfill:popular -- --metadata-only
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 * Embeddings (optional): OPENAI_API_KEY
 */
import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { syncAnimeCatalogFromAnilist } from "@/lib/anime/catalog-sync";
import { fetchTopPopularAnimeIds } from "@/lib/anilist/discover";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";

const DEFAULT_LIMIT = 300;
/** ~24 AniList detail requests/min (unauthenticated limit ~30/min). */
const SYNC_DELAY_MS = 2500;
/** Pause between discover list pages. */
const PAGE_DELAY_MS = 2500;

function parseArgs(argv: string[]) {
  const metadataOnly = argv.includes("--metadata-only");
  const numeric = argv.find((a) => /^\d+$/.test(a));
  const limit = numeric ? Number(numeric) : DEFAULT_LIMIT;
  return { limit, metadataOnly };
}

async function main() {
  const { limit, metadataOnly } = parseArgs(process.argv.slice(2));
  const embed = !metadataOnly && isEmbeddingConfigured();

  if (!metadataOnly && !isEmbeddingConfigured()) {
    console.log(
      "No OPENAI_API_KEY — caching metadata only. Add key or pass --metadata-only.",
    );
  }

  console.log(
    `Fetching top ${limit} popular titles from AniList (paginated discover)…`,
  );
  const ids = await fetchTopPopularAnimeIds(limit, {
    pageDelayMs: PAGE_DELAY_MS,
  });
  console.log(`Got ${ids.length} AniList IDs. Syncing to Supabase…`);
  console.log(
    `Mode: ${embed ? "metadata + embeddings" : "metadata only"}, lightweight series mapping, ${SYNC_DELAY_MS}ms between titles.`,
  );
  console.log(
    "Already-fresh rows skip the AniList detail call (re-runs are faster).\n",
  );

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const anilistId of ids) {
    try {
      const before = Date.now();
      await syncAnimeCatalogFromAnilist(anilistId, {
        lightweightSeriesMapping: true,
        skipEmbedding: !embed,
      });
      const elapsed = Date.now() - before;
      if (elapsed < 400) {
        skipped += 1;
      } else {
        synced += 1;
      }
      const done = synced + skipped + failed;
      if (done % 10 === 0 || done === ids.length) {
        console.log(
          `  ${done}/${ids.length} (${synced} fetched, ${skipped} cache-hit, ${failed} failed)`,
        );
      }
      await new Promise((r) => setTimeout(r, SYNC_DELAY_MS));
    } catch (e) {
      failed += 1;
      console.warn(
        `  Failed ${anilistId}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  console.log(
    `\nDone. ${synced} synced from AniList, ${skipped} already cached, ${failed} failed.`,
  );
  if (embed) {
    console.log("Refresh recommendations in the app when finished.");
  } else {
    console.log(
      "Run npm run backfill:embeddings later to enable vector recommendations.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
