import { REASON_CODES } from "./constants";
import { finalizeRecommendations, rerankCandidates } from "./rerank";
import type { RecommendationRequestPrefs } from "./request-prefs";
import type {
  CandidateAnime,
  ScoredRecommendation,
  TasteProfile,
  TasteProfileSignals,
} from "./types";
import type {
  CollaborativeRecommendationMode,
  CollaborativeRecommendationPrefs,
} from "./collaborative-types";

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function mergeSignals(
  viewerSignals: TasteProfileSignals,
  friendSignals: TasteProfileSignals,
): TasteProfileSignals {
  const mergeTop = (a: string[], b: string[], limit = 8) => {
    const counts = new Map<string, number>();
    for (const value of [...a, ...b]) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
      .slice(0, limit)
      .map(([value]) => value);
  };

  return {
    topRankedSeries: [
      ...viewerSignals.topRankedSeries.slice(0, 4),
      ...friendSignals.topRankedSeries.slice(0, 4),
    ],
    comparisonWinners: unique([
      ...viewerSignals.comparisonWinners,
      ...friendSignals.comparisonWinners,
    ]),
    comparisonLosers: unique([
      ...viewerSignals.comparisonLosers,
      ...friendSignals.comparisonLosers,
    ]),
    completedTitles: unique([
      ...viewerSignals.completedTitles,
      ...friendSignals.completedTitles,
    ]),
    watchingTitles: unique([...viewerSignals.watchingTitles, ...friendSignals.watchingTitles]),
    droppedTitles: unique([...viewerSignals.droppedTitles, ...friendSignals.droppedTitles]),
    topGenres: mergeTop(viewerSignals.topGenres, friendSignals.topGenres),
    topFormats: mergeTop(viewerSignals.topFormats, friendSignals.topFormats, 6),
    topSources: mergeTop(viewerSignals.topSources, friendSignals.topSources, 6),
    avoidGenres: mergeTop(viewerSignals.avoidGenres, friendSignals.avoidGenres, 6),
  };
}

function buildCollaborativeProfile(
  viewer: TasteProfile,
  friend: TasteProfile,
): TasteProfile {
  return {
    userId: viewer.userId,
    inputHash: `${viewer.inputHash}:${friend.inputHash}`,
    profileText: `${viewer.profileText}\n---\n${friend.profileText}`,
    signals: mergeSignals(viewer.signals, friend.signals),
  };
}

function applyModeTweaks(
  rec: ScoredRecommendation,
  viewer: TasteProfile,
  friend: TasteProfile,
  mode: CollaborativeRecommendationMode,
): ScoredRecommendation {
  const sharedGenres = new Set(
    viewer.signals.topGenres.filter((g) => friend.signals.topGenres.includes(g)),
  );
  const viewerGenres = new Set(viewer.signals.topGenres);
  const friendGenres = new Set(friend.signals.topGenres);
  const candidateGenres = rec.anime.genres ?? [];

  let finalScore = rec.finalScore;
  const reasonCodes = [...rec.reasonCodes];

  const viewerMatch = candidateGenres.some((genre) => viewerGenres.has(genre));
  const friendMatch = candidateGenres.some((genre) => friendGenres.has(genre));

  if (viewerMatch && friendMatch) {
    finalScore += 0.08;
    reasonCodes.push(REASON_CODES.collaborativeBothMatch);
  } else if (viewerMatch) {
    finalScore += 0.03;
    reasonCodes.push(REASON_CODES.collaborativeViewerMatch);
  } else if (friendMatch) {
    finalScore += 0.03;
    reasonCodes.push(REASON_CODES.collaborativeFriendMatch);
  }

  if (candidateGenres.some((genre) => sharedGenres.has(genre))) {
    finalScore += 0.05;
    reasonCodes.push(REASON_CODES.collaborativeSharedGenre);
  }

  if (mode === "based_on_overlap" && candidateGenres.some((genre) => sharedGenres.has(genre))) {
    finalScore += 0.08;
  }

  if (mode === "surprise_us") {
    finalScore += 0.03;
    reasonCodes.push(REASON_CODES.collaborativeSurprise);
  }

  return {
    ...rec,
    finalScore,
    reasonCodes: unique(reasonCodes),
  };
}

function collaborativePrimaryReason(
  rec: ScoredRecommendation,
  viewer: TasteProfile,
  friend: TasteProfile,
  mode: CollaborativeRecommendationMode,
): string {
  const title = rec.anime.english_title || rec.anime.romaji_title || "this title";
  const viewerAnchor = viewer.signals.topRankedSeries[0]?.title;
  const friendAnchor = friend.signals.topRankedSeries[0]?.title;

  if (viewerAnchor && friendAnchor) {
    return `Because it aligns with your taste in ${viewerAnchor} and your friend's taste in ${friendAnchor}.`;
  }

  if (mode === "surprise_us") {
    return `${title} is a stretch pick that still overlaps with both of your profiles.`;
  }

  return `Chosen to balance both of your watch histories and rankings.`;
}

export function collaborativePrefsToRequestPrefs(
  prefs: CollaborativeRecommendationPrefs,
): RecommendationRequestPrefs {
  if (prefs.mode === "short_watch" && prefs.lengthBucket == null) {
    return { ...prefs, lengthBucket: "short" };
  }
  return { ...prefs };
}

export function rerankCollaborativeCandidates(
  viewerProfile: TasteProfile,
  friendProfile: TasteProfile,
  candidates: CandidateAnime[],
  prefs: CollaborativeRecommendationPrefs,
): ScoredRecommendation[] {
  const mergedProfile = buildCollaborativeProfile(viewerProfile, friendProfile);
  const requestPrefs = collaborativePrefsToRequestPrefs(prefs);

  const reranked = rerankCandidates(mergedProfile, candidates, requestPrefs).map((rec) =>
    applyModeTweaks(rec, viewerProfile, friendProfile, prefs.mode),
  );

  const finalized = finalizeRecommendations(mergedProfile, reranked, requestPrefs);
  return finalized.map((rec) => {
    const primaryReason = collaborativePrimaryReason(
      rec,
      viewerProfile,
      friendProfile,
      prefs.mode,
    );
    return {
      ...rec,
      explanation: primaryReason,
      explanationDetails: {
        ...rec.explanationDetails,
        primaryReason,
        secondarySignals: unique([
          ...rec.explanationDetails.secondarySignals,
          "Built from overlapping and complementary taste signals.",
          `Mode: ${prefs.mode.replaceAll("_", " ")}.`,
        ]).slice(0, 4),
        anchorTitles: unique([
          ...rec.explanationDetails.anchorTitles,
          ...viewerProfile.signals.topRankedSeries.slice(0, 1).map((s) => s.title),
          ...friendProfile.signals.topRankedSeries.slice(0, 1).map((s) => s.title),
        ]).slice(0, 3),
      },
    };
  });
}
