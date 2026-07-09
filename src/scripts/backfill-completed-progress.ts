/**
 * Set completed library entries to their anime episode total when known.
 *
 * Usage:
 *   npm run backfill:completed-progress
 *   npm run backfill:completed-progress -- --dry-run
 *   npm run backfill:completed-progress -- --limit=100
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY in .env.local
 */

import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

import { createAdminClient } from "@/lib/supabase/admin";

import { fetchAllRows } from "./paginate";

type Args = {
  dryRun: boolean;
  limit: number | null;
};

type CompletedEntryRow = {
  id: string;
  user_id: string;
  anime_id: string;
  progress_episodes: number;
  anime:
    | {
        anilist_id: number;
        romaji_title: string;
        english_title: string | null;
        native_title: string | null;
        episodes: number | null;
      }
    | null;
};

type Candidate = CompletedEntryRow & {
  anime: NonNullable<CompletedEntryRow["anime"]> & { episodes: number };
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

function parseArgs(argv: string[]): Args {
  return {
    dryRun: argv.includes("--dry-run"),
    limit: readNumericArg(argv, "limit"),
  };
}

function titleOf(row: CompletedEntryRow): string {
  return (
    row.anime?.english_title ||
    row.anime?.romaji_title ||
    row.anime?.native_title ||
    `Anime ${row.anime_id}`
  );
}

function isCandidate(row: CompletedEntryRow): row is Candidate {
  return (
    row.anime?.episodes != null &&
    row.anime.episodes > 0 &&
    row.progress_episodes !== row.anime.episodes
  );
}

async function loadCompletedEntries(): Promise<CompletedEntryRow[]> {
  const admin = createAdminClient();
  return fetchAllRows<CompletedEntryRow>((from, to) =>
    admin
      .from("user_anime_entries")
      .select(
        "id, user_id, anime_id, progress_episodes, anime:anime_id(anilist_id, romaji_title, english_title, native_title, episodes)",
      )
      .eq("status", "completed")
      .order("updated_at", { ascending: true })
      .range(from, to),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const completedEntries = await loadCompletedEntries();
  const unknownEpisodeCount = completedEntries.filter(
    (row) => row.anime?.episodes == null || row.anime.episodes <= 0,
  ).length;
  const alreadyCorrect = completedEntries.filter(
    (row) =>
      row.anime?.episodes != null &&
      row.anime.episodes > 0 &&
      row.progress_episodes === row.anime.episodes,
  ).length;
  const allCandidates = completedEntries.filter(isCandidate);
  const candidates = args.limit
    ? allCandidates.slice(0, args.limit)
    : allCandidates;

  console.log(
    `${args.dryRun ? "Would update" : "Updating"} ${candidates.length} completed entr${
      candidates.length === 1 ? "y" : "ies"
    } to match known episode totals.`,
  );
  console.log(
    `Scanned ${completedEntries.length} completed entries: ${allCandidates.length} need updates, ${alreadyCorrect} already correct, ${unknownEpisodeCount} missing episode totals.`,
  );
  if (args.limit && allCandidates.length > candidates.length) {
    console.log(`Limit: updating first ${candidates.length} of ${allCandidates.length}.`);
  }

  if (args.dryRun) {
    for (const row of candidates) {
      console.log(
        `  ${row.id}  ${titleOf(row)}  ${row.progress_episodes} -> ${row.anime.episodes}`,
      );
    }
    return;
  }

  const admin = createAdminClient();
  let updated = 0;
  let failed = 0;

  for (const row of candidates) {
    const { error } = await admin
      .from("user_anime_entries")
      .update({ progress_episodes: row.anime.episodes })
      .eq("id", row.id);

    if (error) {
      failed += 1;
      console.warn(`  Failed ${row.id} (${titleOf(row)}): ${error.message}`);
    } else {
      updated += 1;
    }

    const done = updated + failed;
    if (done % 100 === 0 || done === candidates.length) {
      console.log(`  ${done}/${candidates.length} (${updated} updated, ${failed} failed)`);
    }
  }

  console.log(`Done. ${updated} updated, ${failed} failed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
