import {
  REASON_CODES,
  REQUEST_MATCH_WEIGHT,
  RERANK_WEIGHT,
  SIMILARITY_WEIGHT,
} from "./constants";
import { matchesAnyGenre } from "@/lib/filters/genre";

import { matchesLengthBucket } from "./request-filter";
import {
  EMPTY_REQUEST_PREFS,
  isEmptyRequestPrefs,
  type RecommendationRequestPrefs,
} from "./request-prefs";
import type { CandidateAnime, RecommendationExplanationDetails, ScoredRecommendation, TasteProfile } from "./types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function genreOverlap(genres: string[], preferred: string[]): number {
  if (preferred.length === 0 || genres.length === 0) return 0;
  const hits = genres.filter((g) => preferred.includes(g)).length;
  return hits / Math.max(preferred.length, 1);
}

function requestMatchScore(
  candidate: CandidateAnime,
  prefs: RecommendationRequestPrefs,
  reasonCodes: ScoredRecommendation["reasonCodes"],
): number {
  if (isEmptyRequestPrefs(prefs)) return 0;

  let score = 0;

  if (
    prefs.genres.length > 0 &&
    matchesAnyGenre(candidate.genres, prefs.genres)
  ) {
    const overlap = genreOverlap(candidate.genres, prefs.genres);
    score += overlap * 0.5;
    reasonCodes.push(REASON_CODES.requestGenreMatch);
  }

  if (prefs.format && candidate.format === prefs.format) {
    score += 0.25;
    reasonCodes.push(REASON_CODES.requestFormatMatch);
  }

  if (
    prefs.lengthBucket &&
    matchesLengthBucket(candidate, prefs.lengthBucket)
  ) {
    score += 0.25;
    reasonCodes.push(REASON_CODES.requestLengthMatch);
  }

  return clamp01(score);
}

export function rerankCandidates(
  profile: TasteProfile,
  candidates: CandidateAnime[],
  prefs: RecommendationRequestPrefs = EMPTY_REQUEST_PREFS,
): ScoredRecommendation[] {
  const { signals } = profile;

  return candidates.map((candidate) => {
    const reasonCodes: ScoredRecommendation["reasonCodes"] = [];
    let rerankScore = 0;

    const genreScore = genreOverlap(candidate.genres, signals.topGenres);
    if (genreScore > 0) {
      rerankScore += genreScore * 0.35;
      reasonCodes.push(REASON_CODES.topGenre);
    }

    if (candidate.format && signals.topFormats.includes(candidate.format)) {
      rerankScore += 0.15;
      reasonCodes.push(REASON_CODES.topFormat);
    }

    if (candidate.source && signals.topSources.includes(candidate.source)) {
      rerankScore += 0.1;
      reasonCodes.push(REASON_CODES.topSource);
    }

    const avoidOverlap = genreOverlap(candidate.genres, signals.avoidGenres);
    if (avoidOverlap > 0) {
      rerankScore -= avoidOverlap * 0.25;
      reasonCodes.push(REASON_CODES.droppedGenrePenalty);
    }

    if (candidate.average_score && Number(candidate.average_score) >= 75) {
      rerankScore += 0.08;
      reasonCodes.push(REASON_CODES.highCommunityScore);
    }

    if (candidate.popularity && candidate.popularity > 50_000) {
      rerankScore += 0.05;
      reasonCodes.push(REASON_CODES.popular);
    }

    if (candidate.similarityScore >= 0.72) {
      reasonCodes.push(REASON_CODES.semanticMatch);
    }

    rerankScore = clamp01(rerankScore);

    const requestScore = requestMatchScore(candidate, prefs, reasonCodes);

    const finalScore =
      candidate.similarityScore * SIMILARITY_WEIGHT +
      rerankScore * RERANK_WEIGHT +
      requestScore * REQUEST_MATCH_WEIGHT;

    return {
      anime: candidate,
      seriesId: candidate.seriesId,
      similarityScore: candidate.similarityScore,
      rerankScore,
      finalScore,
      reasonCodes: [...new Set(reasonCodes)],
      explanation: "",
      explanationDetails: {
        primaryReason: "",
        secondarySignals: [],
        matchedGenres: [],
        anchorTitles: [],
        badges: [],
      },
    };
  });
}

const LENGTH_LABELS: Record<string, string> = {
  movie: "a movie",
  short: "a shorter series",
  cour: "a standard-length series",
  long: "a longer series",
};

export function buildExplanation(
  rec: ScoredRecommendation,
  profile: TasteProfile,
  prefs: RecommendationRequestPrefs = EMPTY_REQUEST_PREFS,
): string {
  const title =
    rec.anime.english_title || rec.anime.romaji_title || "this title";
  const { signals } = profile;

  if (rec.reasonCodes.includes(REASON_CODES.wildcardPick)) {
    if (!isEmptyRequestPrefs(prefs)) {
      return `An adventurous pick for what you asked for — ${title} is outside your usual top matches.`;
    }
    return `An adventurous pick — ${title} is a wildcard suggestion based on your taste.`;
  }

  if (rec.reasonCodes.includes(REASON_CODES.diversePick)) {
    return `A varied suggestion that still fits your request and taste profile.`;
  }

  if (rec.reasonCodes.includes(REASON_CODES.requestGenreMatch) && prefs.genres[0]) {
    const shared = rec.anime.genres.filter((g) => prefs.genres.includes(g));
    if (shared.length > 0) {
      return `You asked for ${prefs.genres.slice(0, 2).join(" or ")} — ${title} includes ${shared.slice(0, 2).join(" and ")}.`;
    }
  }

  if (
    rec.reasonCodes.includes(REASON_CODES.requestLengthMatch) &&
    prefs.lengthBucket
  ) {
    return `Matches your length preference (${LENGTH_LABELS[prefs.lengthBucket] ?? prefs.lengthBucket}) and your rankings.`;
  }

  if (rec.reasonCodes.includes(REASON_CODES.requestFormatMatch) && prefs.format) {
    return `You wanted ${prefs.format} — ${title} matches that format and your taste.`;
  }

  if (rec.reasonCodes.includes(REASON_CODES.topGenre) && signals.topGenres[0]) {
    const shared = rec.anime.genres.filter((g) =>
      signals.topGenres.includes(g),
    );
    if (shared.length > 0) {
      return `Because you rank ${signals.topGenres[0]} highly and ${title} fits ${shared.slice(0, 2).join(" and ")}.`;
    }
  }

  if (
    rec.reasonCodes.includes(REASON_CODES.rankedSeriesAffinity) &&
    signals.topRankedSeries[0]
  ) {
    return `Similar taste to your top pick, ${signals.topRankedSeries[0].title}.`;
  }

  if (rec.reasonCodes.includes(REASON_CODES.semanticMatch)) {
    return `Matches the mood and themes of anime you have ranked and completed.`;
  }

  if (rec.reasonCodes.includes(REASON_CODES.highCommunityScore)) {
    return `Well-rated by the community and close to your ranked favorites.`;
  }

  return `Suggested based on your watch history and rankings.`;
}

function badgeForReason(code: string): RecommendationExplanationDetails["badges"][number] | null {
  switch (code) {
    case REASON_CODES.semanticMatch:
      return "strong_match";
    case REASON_CODES.topGenre:
      return "genre_match";
    case REASON_CODES.requestGenreMatch:
    case REASON_CODES.requestFormatMatch:
    case REASON_CODES.requestLengthMatch:
      return "request_match";
    case REASON_CODES.highCommunityScore:
      return "community_score";
    case REASON_CODES.popular:
      return "popular";
    case REASON_CODES.diversePick:
      return "diverse_pick";
    case REASON_CODES.wildcardPick:
      return "wildcard_pick";
    default:
      return null;
  }
}

export function buildExplanationDetails(
  rec: ScoredRecommendation,
  profile: TasteProfile,
  prefs: RecommendationRequestPrefs = EMPTY_REQUEST_PREFS,
): RecommendationExplanationDetails {
  const primaryReason = buildExplanation(rec, profile, prefs);
  const { signals } = profile;
  const secondarySignals: string[] = [];
  const matchedGenres = rec.anime.genres.filter(
    (genre) =>
      signals.topGenres.includes(genre) ||
      prefs.genres.includes(genre),
  );

  if (rec.reasonCodes.includes(REASON_CODES.semanticMatch)) {
    secondarySignals.push("Strong semantic match with your ranked favorites.");
  }

  if (matchedGenres.length > 0) {
    secondarySignals.push(
      `Matches genres you tend to enjoy: ${matchedGenres.slice(0, 3).join(", ")}.`,
    );
  }

  if (rec.anime.format && signals.topFormats.includes(rec.anime.format)) {
    secondarySignals.push(`Fits your preferred ${rec.anime.format} format.`);
  }

  if (rec.anime.average_score && Number(rec.anime.average_score) >= 75) {
    secondarySignals.push(
      `Community score ${Number(rec.anime.average_score)} on AniList.`,
    );
  }

  if (rec.anime.popularity && rec.anime.popularity > 50_000) {
    secondarySignals.push("Popular with a wide audience.");
  }

  if (
    rec.reasonCodes.includes(REASON_CODES.requestLengthMatch) &&
    prefs.lengthBucket
  ) {
    secondarySignals.push(
      `Matches your ${LENGTH_LABELS[prefs.lengthBucket] ?? prefs.lengthBucket} length preference.`,
    );
  }

  const anchorTitles = signals.topRankedSeries.slice(0, 2).map((series) => series.title);
  if (anchorTitles.length > 0 && rec.reasonCodes.includes(REASON_CODES.semanticMatch)) {
    secondarySignals.push(
      `Similar vibe to ${anchorTitles.join(" and ")}.`,
    );
  }

  const badges = [
    ...new Set(
      rec.reasonCodes
        .map((code) => badgeForReason(code))
        .filter((badge): badge is NonNullable<typeof badge> => badge !== null),
    ),
  ];

  const matchedRequest =
    !isEmptyRequestPrefs(prefs)
      ? {
          genres: prefs.genres.length > 0 ? prefs.genres : undefined,
          format: prefs.format ?? undefined,
          lengthBucket: prefs.lengthBucket ?? undefined,
        }
      : undefined;

  return {
    primaryReason,
    secondarySignals: [...new Set(secondarySignals)].slice(0, 4),
    matchedGenres: matchedGenres.slice(0, 4),
    matchedRequest,
    anchorTitles,
    badges,
  };
}

export function finalizeRecommendations(
  profile: TasteProfile,
  scored: ScoredRecommendation[],
  prefs: RecommendationRequestPrefs = EMPTY_REQUEST_PREFS,
  options?: { preserveOrder?: boolean },
): ScoredRecommendation[] {
  const withExpl = scored.map((rec) => {
    const explanation = buildExplanation(rec, profile, prefs);
    const explanationDetails = buildExplanationDetails(
      { ...rec, explanation },
      profile,
      prefs,
    );
    return {
      ...rec,
      explanation,
      explanationDetails,
    };
  });

  if (options?.preserveOrder) {
    return withExpl;
  }

  return withExpl.sort((a, b) => b.finalScore - a.finalScore);
}
