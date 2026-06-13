import type { Enums } from "@/types/database";

export const APP_NAME = "Suki";

export type AnimeEntryStatus = Enums<"anime_entry_status">;

export const ANIME_ENTRY_STATUSES: AnimeEntryStatus[] = [
  "watching",
  "completed",
  "paused",
  "dropped",
  "plan_to_watch",
];

export const STATUS_LABELS: Record<AnimeEntryStatus, string> = {
  watching: "Watching",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
  plan_to_watch: "Plan to watch",
};

export const CONFIDENCE_LABELS = {
  low: "Needs more comparisons",
  medium: "Getting clearer",
  high: "Well established",
} as const;

export type ProfileVisibility = Enums<"profile_visibility">;

export const PROFILE_VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  public: "Public",
  friends_only: "Friends only",
  private: "Private",
};

export const NAV_ITEMS = [
  { href: "/search", label: "Search", mobileLabel: "Search" },
  { href: "/library", label: "Library", mobileLabel: "Library" },
  { href: "/ranking", label: "Ranking", mobileLabel: "Rank" },
  { href: "/recommendations", label: "For you", mobileLabel: "Picks" },
  { href: "/friends", label: "Friends", mobileLabel: "Friends" },
] as const;

export const RANKING_ALGORITHM_VERSION = "elo_series_v1";
/** @deprecated Season-level rankings; kept for audit only */
export const LEGACY_ANIME_RANKING_ALGORITHM_VERSION = "elo_v1";
export const ELO_INITIAL_SCORE = 1500;

export const USER_EVENT_TYPES = {
  animeAdded: "anime_added",
  statusChanged: "status_changed",
  progressUpdated: "progress_updated",
  animeCompleted: "anime_completed",
  comparisonCreated: "comparison_created",
  seriesComparisonCreated: "series_comparison_created",
  seriesRankingReset: "series_ranking_reset",
  rankingViewed: "ranking_viewed",
  friendRequestSent: "friend_request_sent",
  friendRequestAccepted: "friend_request_accepted",
  friendRequestDeclined: "friend_request_declined",
  friendProfileViewed: "friend_profile_viewed",
  recommendationViewed: "recommendation_viewed",
  recommendationClicked: "recommendation_clicked",
  recommendationAdded: "recommendation_added",
  recommendationDismissed: "recommendation_dismissed",
  recommendationRefreshed: "recommendation_refreshed",
  collaborativeRecommendationRefreshed: "collaborative_recommendation_refreshed",
  libraryEntryUpdated: "library_entry_updated",
  libraryEntryRemoved: "library_entry_removed",
  watchlistShuffled: "watchlist_shuffled",
  friendRecommendationSent: "friend_recommendation_sent",
  friendRecommendationAdded: "friend_recommendation_added",
} as const;

/** Raw event types the friend activity feed considers (everything else is noise). */
export const FEED_WORTHY_EVENT_TYPES = [
  USER_EVENT_TYPES.animeCompleted,
  USER_EVENT_TYPES.animeAdded,
  USER_EVENT_TYPES.seriesComparisonCreated,
] as const;

/** Only events newer than this surface in the feed. */
export const FEED_LOOKBACK_DAYS = 30;
/** Raw events fetched per feed page (grouping collapses these into fewer items). */
export const FEED_PAGE_SIZE = 60;
/** A comparison surfaces only if the winner is currently within this rank. */
export const FEED_RANKING_TOP_N = 5;
/** Max cover thumbnails shown per grouped feed item. */
export const FEED_MAX_COVERS = 4;

export const WATCHLIST_PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
} as const;
