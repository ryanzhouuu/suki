/**
 * Force-refresh cached anime rows that predate the rich detail metadata fields.
 *
 * Usage:
 *   npm run backfill:rich-metadata
 *   npm run backfill:rich-metadata -- --limit=100
 *   npm run backfill:rich-metadata -- --all
 *   npm run backfill:rich-metadata -- --dry-run
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { syncAnimeCatalogFromAnilist } from "@/lib/anime/catalog-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

import { fetchAllRows } from "./paginate";

const DEFAULT_DELAY_MS = 2500;
const RICH_METADATA_MISSING_FILTER = [
  "start_date.is.null",
  "studios.is.null",
  "tags.is.null",
  "rankings.is.null",
  "external_links.is.null",
].join(",");

type BackfillArgs = {
  all: boolean;
  dryRun: boolean;
  limit: number | null;
  delayMs: number;
};

function readNumericArg(argv: string[], name: string): number | null {
  const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) {
    const value = Number(inline.slice(name.length + 3));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const index = argv.indexOf(`--${name}`);
  if (index !== -1) {
    const value = Number(argv[index + 1]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  return null;
}

function parseArgs(argv: string[]): BackfillArgs {
  return {
    all: argv.includes("--all"),
    dryRun: argv.includes("--dry-run"),
    limit: readNumericArg(argv, "limit"),
    delayMs: readNumericArg(argv, "delay-ms") ?? DEFAULT_DELAY_MS,
  };
}

function titleOf(anime: Tables<"anime">): string {
  return (
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    `AniList ${anime.anilist_id}`
  );
}

async function loadCandidates(args: BackfillArgs): Promise<Tables<"anime">[]> {
  const admin = createAdminClient();
  const rows = await fetchAllRows<Tables<"anime">>((from, to) => {
    let query = admin.from("anime").select("*").order("anilist_id").range(from, to);
    if (!args.all) {
      query = query.or(RICH_METADATA_MISSING_FILTER);
    }
    return query;
  });

  return args.limit ? rows.slice(0, args.limit) : rows;
}

async function pause(ms: number) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidates = await loadCandidates(args);

  console.log(
    `${args.dryRun ? "Would refresh" : "Refreshing"} ${candidates.length} anime row${
      candidates.length === 1 ? "" : "s"
    }${args.all ? " (all cached rows)" : " with missing rich metadata"}.`,
  );
  console.log(
    `Mode: force AniList refresh, full series mapping, no embeddings, ${args.delayMs}ms between titles.`,
  );

  if (args.dryRun) {
    for (const anime of candidates) {
      console.log(`  ${anime.anilist_id}  ${titleOf(anime)}`);
    }
    return;
  }

  let refreshed = 0;
  let failed = 0;

  for (const anime of candidates) {
    try {
      await syncAnimeCatalogFromAnilist(anime.anilist_id, {
        forceRefresh: true,
        skipEmbedding: true,
      });
      refreshed += 1;
      if (refreshed % 10 === 0 || refreshed + failed === candidates.length) {
        console.log(
          `  ${refreshed + failed}/${candidates.length} (${refreshed} refreshed, ${failed} failed)`,
        );
      }
    } catch (error) {
      failed += 1;
      console.warn(
        `  Failed anilist_id=${anime.anilist_id} (${titleOf(anime)}):`,
        error instanceof Error ? error.message : error,
      );
    }

    if (refreshed + failed < candidates.length) {
      await pause(args.delayMs);
    }
  }

  console.log(`Done. ${refreshed} refreshed, ${failed} failed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
