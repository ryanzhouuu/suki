import {
  FEED_LOOKBACK_DAYS,
  FEED_MAX_COVERS,
  FEED_PAGE_SIZE,
  FEED_RANKING_TOP_N,
  FEED_WORTHY_EVENT_TYPES,
  RANKING_ALGORITHM_VERSION,
  USER_EVENT_TYPES,
} from "@/lib/constants";
import { listAcceptedFriends } from "@/lib/friends/queries";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  buildFeedItems,
  type AnimeRef,
  type FeedActor,
  type FeedEventRow,
  type FeedItem,
  type FeedLookups,
  type SeriesRef,
} from "./activity-feed";

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

type FeedQueryOptions = {
  cursor?: string | null;
  limit?: number;
};

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Resolves the viewer's accepted friends, then reads their recent `user_events`
 * via the admin client (bypassing RLS) with explicit in-code filtering:
 * friends whose visibility/opt-out allow it, feed-worthy event types only, and
 * a bounded lookback window. Returns grouped, display-ready items + a cursor.
 */
export async function getFriendActivityFeed(
  viewerId: string,
  { cursor = null, limit = FEED_PAGE_SIZE }: FeedQueryOptions = {},
): Promise<FeedPage> {
  const friends = await listAcceptedFriends(viewerId);
  const friendIds = friends.map((f) => f.profile.user_id);
  if (friendIds.length === 0) return { items: [], nextCursor: null };

  const admin = createAdminClient();

  // Only friends whose profile is visible and who haven't opted out.
  const { data: profileRows } = await admin
    .from("profiles")
    .select(
      "user_id, username, display_name, avatar_url, profile_visibility, show_activity_to_friends",
    )
    .in("user_id", friendIds);

  const actors = new Map<string, FeedActor>();
  for (const p of profileRows ?? []) {
    if (p.profile_visibility === "private") continue;
    if (!p.show_activity_to_friends) continue;
    actors.set(p.user_id, {
      userId: p.user_id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
    });
  }
  const allowedIds = [...actors.keys()];
  if (allowedIds.length === 0) return { items: [], nextCursor: null };

  const cutoff = new Date(
    Date.now() - FEED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  let query = admin
    .from("user_events")
    .select("id, user_id, event_type, anime_id, metadata, created_at")
    .in("user_id", allowedIds)
    .in("event_type", [...FEED_WORTHY_EVENT_TYPES])
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt("created_at", cursor);

  const { data: eventRows } = await query;
  const rows: FeedEventRow[] = (eventRows ?? []).map((e) => ({
    id: e.id,
    userId: e.user_id,
    eventType: e.event_type,
    animeId: e.anime_id,
    metadata: asMetadata(e.metadata),
    createdAt: e.created_at,
  }));

  // Resolve the anime + series + ranking lookups the builder needs.
  const animeIds = [
    ...new Set(rows.map((r) => r.animeId).filter((id): id is string => !!id)),
  ];
  const winnerSeriesIds = [
    ...new Set(
      rows
        .filter((r) => r.eventType === USER_EVENT_TYPES.seriesComparisonCreated)
        .map((r) => r.metadata.winnerSeriesId)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  const animeMap = new Map<string, AnimeRef>();
  if (animeIds.length > 0) {
    const { data: animeRows } = await admin
      .from("anime")
      .select("id, anilist_id, english_title, romaji_title, cover_image_url")
      .in("id", animeIds);
    for (const a of animeRows ?? []) {
      animeMap.set(a.id, {
        animeId: a.id,
        anilistId: a.anilist_id,
        title: a.english_title || a.romaji_title,
        coverImageUrl: a.cover_image_url,
      });
    }
  }

  const seriesMap = new Map<string, SeriesRef>();
  const rankByActorSeries = new Map<string, number>();
  if (winnerSeriesIds.length > 0) {
    const [{ data: seriesRows }, { data: rankRows }] = await Promise.all([
      admin
        .from("series")
        .select("id, anilist_primary_id, canonical_title, cover_image_url")
        .in("id", winnerSeriesIds),
      admin
        .from("derived_series_rankings")
        .select("user_id, series_id, rank")
        .in("user_id", allowedIds)
        .in("series_id", winnerSeriesIds)
        .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
        .lte("rank", FEED_RANKING_TOP_N),
    ]);
    for (const s of seriesRows ?? []) {
      seriesMap.set(s.id, {
        seriesId: s.id,
        anilistPrimaryId: s.anilist_primary_id,
        title: s.canonical_title,
        coverImageUrl: s.cover_image_url,
      });
    }
    for (const r of rankRows ?? []) {
      rankByActorSeries.set(`${r.user_id}:${r.series_id}`, r.rank);
    }
  }

  const lookups: FeedLookups = {
    actors,
    anime: animeMap,
    series: seriesMap,
    rankByActorSeries,
  };

  const items = buildFeedItems(rows, lookups, { maxCovers: FEED_MAX_COVERS });

  // Cursor pages over raw events; a full page implies there may be more.
  const nextCursor =
    rows.length === limit ? rows[rows.length - 1].createdAt : null;

  return { items, nextCursor };
}
