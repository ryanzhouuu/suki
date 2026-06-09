import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const animeEntryStatusEnum = pgEnum("anime_entry_status", [
  "watching",
  "completed",
  "paused",
  "dropped",
  "plan_to_watch",
]);

export const watchlistPriorityEnum = pgEnum("watchlist_priority", [
  "low",
  "medium",
  "high",
]);

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public",
  "friends_only",
  "private",
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "declined",
  "blocked",
]);

export const rankingConfidenceEnum = pgEnum("ranking_confidence", [
  "low",
  "medium",
  "high",
]);

export const seriesMapSourceEnum = pgEnum("series_map_source", [
  "anilist_auto",
  "manual_override",
  "singleton",
]);

export const seriesOverrideActionEnum = pgEnum("series_override_action", [
  "force_series",
  "force_singleton",
  "exclude_from_auto_group",
]);

export const importSourceEnum = pgEnum("import_source", [
  "anilist",
  "mal_xml",
  "plain_text",
]);

export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "parsing",
  "needs_review",
  "importing",
  "series_backfill",
  "done",
  "failed",
  "canceled",
]);

export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id").primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    bannerUrl: text("banner_url"),
    bio: text("bio"),
    profileVisibility: profileVisibilityEnum("profile_visibility")
      .notNull()
      .default("public"),
    showActivityToFriends: boolean("show_activity_to_friends")
      .notNull()
      .default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("profiles_username_lower_idx").on(table.username)],
);

export const anime = pgTable("anime", {
  id: uuid("id").primaryKey().defaultRandom(),
  anilistId: integer("anilist_id").notNull().unique(),
  romajiTitle: text("romaji_title").notNull(),
  englishTitle: text("english_title"),
  nativeTitle: text("native_title"),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  bannerImageUrl: text("banner_image_url"),
  format: text("format"),
  episodes: integer("episodes"),
  durationMinutes: integer("duration_minutes"),
  season: text("season"),
  seasonYear: integer("season_year"),
  status: text("status"),
  genres: text("genres").array().notNull().default([]),
  averageScore: numeric("average_score", { precision: 5, scale: 2 }),
  popularity: integer("popularity"),
  source: text("source"),
  metadataUpdatedAt: timestamp("metadata_updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAnimeEntries = pgTable(
  "user_anime_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    animeId: uuid("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    status: animeEntryStatusEnum("status").notNull(),
    progressEpisodes: integer("progress_episodes").notNull().default(0),
    rewatchCount: integer("rewatch_count").notNull().default(0),
    priority: watchlistPriorityEnum("priority"),
    notes: text("notes"),
    personalScore: numeric("personal_score", { precision: 4, scale: 2 }),
    startedAt: date("started_at"),
    completedAt: date("completed_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_anime_entries_unique_user_anime").on(
      table.userId,
      table.animeId,
    ),
  ],
);

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").notNull(),
  recipientId: uuid("recipient_id").notNull(),
  status: friendshipStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const series = pgTable("series", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalTitle: text("canonical_title").notNull(),
  slug: text("slug").notNull().unique(),
  anilistPrimaryId: integer("anilist_primary_id").notNull().unique(),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const animeSeriesMap = pgTable("anime_series_map", {
  animeId: uuid("anime_id")
    .primaryKey()
    .references(() => anime.id, { onDelete: "cascade" }),
  seriesId: uuid("series_id")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  source: seriesMapSourceEnum("source").notNull().default("anilist_auto"),
  confidence: numeric("confidence", { precision: 4, scale: 3 })
    .notNull()
    .default("1.0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const seriesGroupOverrides = pgTable("series_group_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  anilistId: integer("anilist_id").notNull().unique(),
  action: seriesOverrideActionEnum("action").notNull(),
  targetSeriesId: uuid("target_series_id").references(() => series.id, {
    onDelete: "set null",
  }),
  targetAnilistPrimaryId: integer("target_anilist_primary_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pairwiseSeriesComparisons = pgTable("pairwise_series_comparisons", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  leftSeriesId: uuid("left_series_id")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  rightSeriesId: uuid("right_series_id")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  winnerSeriesId: uuid("winner_series_id").references(() => series.id, {
    onDelete: "cascade",
  }),
  comparisonContext: jsonb("comparison_context"),
  skippedReason: text("skipped_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const derivedSeriesRankings = pgTable(
  "derived_series_rankings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    seriesId: uuid("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    score: numeric("score", { precision: 10, scale: 4 }).notNull(),
    confidence: rankingConfidenceEnum("confidence").notNull().default("low"),
    comparisonCount: integer("comparison_count").notNull().default(0),
    algorithmVersion: text("algorithm_version").notNull().default("elo_series_v1"),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("derived_series_rankings_unique_user_series_version").on(
      table.userId,
      table.seriesId,
      table.algorithmVersion,
    ),
  ],
);

export const userEvents = pgTable("user_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  eventType: text("event_type").notNull(),
  animeId: uuid("anime_id").references(() => anime.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const animeImportJobs = pgTable("anime_import_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  source: importSourceEnum("source").notNull(),
  status: importStatusEnum("status").notNull().default("pending"),
  total: integer("total").notNull().default(0),
  processed: integer("processed").notNull().default(0),
  matched: integer("matched").notNull().default(0),
  needsReviewCount: integer("needs_review_count").notNull().default(0),
  unmatched: integer("unmatched").notNull().default(0),
  imported: integer("imported").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  sourceInput: jsonb("source_input").notNull().default({}),
  stagedRows: jsonb("staged_rows").notNull().default([]),
  backfillAnimeIds: uuid("backfill_anime_ids").array().notNull().default([]),
  retryCount: integer("retry_count").notNull().default(0),
  error: text("error"),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
