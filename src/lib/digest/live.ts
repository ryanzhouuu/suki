import { getAiringForWatching } from "@/lib/anime/airing-fetch";
import type { DigestSnapshot } from "@/lib/digest/snapshot";
import { getReceivedRecommendations } from "@/lib/friend-recommendations/queries";
import { getFriendActivityFeed } from "@/lib/friends/activity";
import { getUserLibraryEntries } from "@/lib/library/queries";
import {
  selectNextAction,
  type DigestAction,
  type DigestActionKind,
} from "@/lib/digest/next-action";
import { getUserRecommendations } from "@/lib/recommendations/queries";
import { utcRangeForLocalDates } from "@/lib/digest/window";

export async function getDigestFriendHighlights(snapshot: DigestSnapshot) {
  const range = utcRangeForLocalDates(
    snapshot.week_start,
    snapshot.week_end,
    snapshot.timezone,
  );
  const feed = await getFriendActivityFeed(snapshot.user_id, {
    limit: 60,
    createdAfter: range.startUtc,
    createdBefore: range.endUtc,
  });
  return feed.items.slice(0, 3);
}

export async function getDigestNextAction(userId: string): Promise<DigestAction> {
  const [airing, watching, friendRecommendations, personalRecommendations] =
    await Promise.all([
      getAiringForWatching(userId).catch(() => []),
      getUserLibraryEntries(userId, "watching").catch(() => []),
      getReceivedRecommendations(userId).catch(() => []),
      getUserRecommendations(userId, { limit: 1 }).catch(() => []),
    ]);
  const candidates: Partial<Record<DigestActionKind, DigestAction>> = {};
  const behind = airing
    .filter((row) => row.episodesBehind > 0)
    .sort((left, right) => right.episodesBehind - left.episodesBehind)[0];
  if (behind) {
    candidates.catch_up = {
      kind: "catch_up",
      href: `/anime/${behind.anilistId}`,
      title: `Catch up on ${behind.title}`,
      description: `${behind.episodesBehind} episode${behind.episodesBehind === 1 ? "" : "s"} behind the latest airing episode.`,
    };
  }
  const recent = watching[0];
  if (recent) {
    candidates.continue = {
      kind: "continue",
      href: `/anime/${recent.anime.anilist_id}`,
      title: `Continue ${recent.anime.english_title || recent.anime.romaji_title}`,
      description: `Pick up after episode ${recent.progress_episodes}.`,
    };
  }
  const friend = friendRecommendations[0];
  if (friend) {
    candidates.friend_recommendation = {
      kind: "friend_recommendation",
      href: "/friends",
      title: `See ${friend.sender.display_name || friend.sender.username}'s pick`,
      description: `They recommended ${friend.anime.english_title || friend.anime.romaji_title}.`,
    };
  }
  const personal = personalRecommendations[0];
  if (personal) {
    candidates.personal_recommendation = {
      kind: "personal_recommendation",
      href: `/anime/${personal.anime.anilist_id}`,
      title: `Try ${personal.anime.english_title || personal.anime.romaji_title}`,
      description: "A current recommendation based on your library.",
    };
  }
  return selectNextAction(candidates);
}
