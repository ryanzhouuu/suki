import { deriveFingerprintFacts } from "@/lib/fingerprint/facts";
import { normalizeFingerprintInput } from "@/lib/fingerprint/normalize";
import { evaluateFingerprintRules } from "@/lib/fingerprint/rules";
import type { FingerprintTraitId } from "@/lib/fingerprint";

import { rankedProfile } from "./fixtures";

export function factsFor(input: ReturnType<typeof rankedProfile>) {
  const normalized = normalizeFingerprintInput(input);
  return deriveFingerprintFacts(normalized.franchises, normalized.rankingCount);
}

export function qualifies(
  input: ReturnType<typeof rankedProfile>,
  id: FingerprintTraitId,
): boolean {
  return evaluateFingerprintRules(factsFor(input)).some(
    (candidate) => candidate.id === id,
  );
}

export function neutralProfile(count: number, keepRankings = false) {
  const input = rankedProfile({ count, episodes: null, score: null });
  if (!keepRankings) input.rankings.length = 0;
  input.entries.forEach((item) => {
    item.anime.genres = [];
    item.anime.tags = [];
    item.anime.format = null;
  });
  return input;
}

export function popularityProfile(values: readonly number[]) {
  const input = neutralProfile(values.length, true);
  input.entries.forEach((item, index) => {
    item.anime.popularity = values[index];
  });
  return input;
}

export function lengthProfile(episodes: readonly number[]) {
  const input = neutralProfile(episodes.length);
  input.entries.forEach((item, index) => {
    item.anime.episodes = episodes[index];
  });
  return input;
}

export function formatProfile(movieCount: number, televisionCount: number) {
  const input = neutralProfile(movieCount + televisionCount);
  input.entries.forEach((item, index) => {
    item.anime.format = index < movieCount ? "MOVIE" : "TV";
    item.anime.episodes = index < movieCount ? 1 : 12;
  });
  return input;
}

export function statusProfile(
  statuses: readonly ReturnType<typeof rankedProfile>["entries"][number]["status"][],
) {
  const input = neutralProfile(statuses.length);
  input.entries.forEach((item, index) => {
    item.status = statuses[index];
  });
  return input;
}

export function scoreProfile(scores: readonly number[]) {
  const input = neutralProfile(scores.length);
  input.entries.forEach((item, index) => {
    item.personal_score = scores[index];
  });
  return input;
}
