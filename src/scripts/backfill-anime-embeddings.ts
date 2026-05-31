/**
 * Embed cached anime rows missing from anime_embeddings.
 * Usage: npm run backfill:embeddings
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */
import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import {
  formatEmbeddingError,
  isEmbeddingConfigured,
} from "@/lib/recommendations/embedding-provider";
import { backfillMissingAnimeEmbeddings } from "@/lib/recommendations/sync-anime-embedding";

async function main() {
  if (!isEmbeddingConfigured()) {
    console.error(
      "OPENAI_API_KEY is not set. Add it to .env.local in the project root.",
    );
    process.exit(1);
  }

  console.log("Embedding missing anime (up to 200)…");
  const result = await backfillMissingAnimeEmbeddings(200);

  if (result.animeTotal === 0) {
    console.log("No rows in anime table yet. Search or add anime in the app first.");
    return;
  }

  if (result.synced === 0 && result.missing === 0) {
    console.log(
      `Nothing to do: all ${result.animeTotal} cached anime already have embeddings.`,
    );
    return;
  }

  console.log(
    `Synced ${result.synced} anime embeddings (${result.embeddedTotal}/${result.animeTotal} total embedded).`,
  );
}

main().catch((e) => {
  console.error(formatEmbeddingError(e));
  process.exit(1);
});
