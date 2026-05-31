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

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/library", label: "Library" },
  { href: "/ranking", label: "Ranking" },
  { href: "/friends", label: "Friends" },
] as const;

export const RANKING_ALGORITHM_VERSION = "elo_v1";
export const ELO_INITIAL_SCORE = 1500;

export const USER_EVENT_TYPES = {
  animeAdded: "anime_added",
  statusChanged: "status_changed",
  progressUpdated: "progress_updated",
  animeCompleted: "anime_completed",
  comparisonCreated: "comparison_created",
  rankingViewed: "ranking_viewed",
  friendRequestSent: "friend_request_sent",
  friendProfileViewed: "friend_profile_viewed",
} as const;
