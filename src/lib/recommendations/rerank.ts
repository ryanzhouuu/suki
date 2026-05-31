import { REASON_CODES } from "./constants";
import type { CandidateAnime, ScoredRecommendation, TasteProfile } from "./types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function genreOverlap(genres: string[], preferred: string[]): number {
  if (preferred.length === 0 || genres.length === 0) return 0;
  const hits = genres.filter((g) => preferred.includes(g)).length;
  return hits / Math.max(preferred.length, 1);
}

export function rerankCandidates(
  profile: TasteProfile,
  candidates: CandidateAnime[],
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

    const finalScore =
      candidate.similarityScore * 0.75 + rerankScore * 0.25;

    return {
      anime: candidate,
      seriesId: candidate.seriesId,
      similarityScore: candidate.similarityScore,
      rerankScore,
      finalScore,
      reasonCodes: [...new Set(reasonCodes)],
      explanation: "",
    };
  });
}

export function buildExplanation(
  rec: ScoredRecommendation,
  profile: TasteProfile,
): string {
  const title =
    rec.anime.english_title || rec.anime.romaji_title || "this title";
  const { signals } = profile;

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

export function finalizeRecommendations(
  profile: TasteProfile,
  scored: ScoredRecommendation[],
): ScoredRecommendation[] {
  return scored
    .map((rec) => ({
      ...rec,
      explanation: buildExplanation(rec, profile),
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}
