# Suki — Full-Stack App Design

Date: 2026-05-31  
Status: Draft

## 1. Executive Summary

This document designs **Suki**, a full-stack web application for tracking anime, building a watchlist, ranking finished franchises through Beli-style pairwise comparisons, and discovering other users' lists and rankings through public profiles.

The recommended MVP stack is Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Auth/Storage/Realtime, and AniList GraphQL for anime metadata. This stack optimizes for a fast MVP while preserving a relational data model that can support rankings, friendships, and future recommendations.

The core product bet is that anime tracking should feel lighter than a spreadsheet and more social than a private checklist. Users should be able to add an anime in seconds, keep watching progress up to date, and gradually build a trusted personal ranking through small comparison prompts instead of maintaining a large manual ordered list.

Tracking is per **anime** (season, movie, OVA). Rankings are per **series** (franchise): multiple completed entries in the same franchise count as one rankable title.

## 2. Goals

### Product Goals

- Make it easy for users to add anime they are watching, completed, paused, dropped, or planning to watch.
- Provide a watchlist flow for bookmarking future watches without forcing a full rating decision.
- Create a distinctive ranking system inspired by Beli, where pairwise **series** comparisons produce ranked franchise lists.
- Let users browse public profiles, lists, and rankings.
- Support friend relationships so users can follow people whose taste they care about.
- Capture enough structured preference data to enable future recommendations.

### Technical Goals

- Keep anime metadata separate from user-specific tracking data.
- Model rankings, comparisons, friendships, and recommendation signals relationally.
- Keep profile and ranking pages fast through cached `derived_series_rankings`.
- Preserve clear authorization boundaries for public data, friend data, and private account data.

### Non-Goals For MVP

- Native mobile apps.
- Full social feed with comments, likes, and DMs.
- Custom anime metadata administration.
- Import/export from MyAnimeList, AniList, or Kitsu.
- Episode-level community discussion.
- Moderation-heavy public posting features.

## 3. Target Users

### Primary User: Personal Tracker

This user wants a clean way to track what they have watched and what they plan to watch. They care about speed, search quality, and not losing track of shows between seasons.

### Secondary User: Taste Sharer

This user wants to compare favorites with friends. They care about public profiles, ranked lists, and seeing how friends' taste differs from theirs.

### Future User: Recommendation Seeker

This user wants the app to suggest anime they are likely to enjoy. They care less about manually browsing and more about the app learning from rankings and watch behavior.

## 4. Recommended Stack

### Recommended MVP Stack

- Frontend and backend: Next.js App Router with TypeScript
- Styling: Tailwind CSS plus a small component system
- Database: Supabase Postgres
- Auth: Supabase Auth
- ORM/query layer: Drizzle ORM or Supabase typed clients
- Metadata source: AniList GraphQL API
- Hosting: Vercel for Next.js, Supabase for database/auth/storage
- Background jobs: Vercel Cron, Supabase Edge Functions, or a lightweight queue later
- Analytics: PostHog or Vercel Analytics
- Error tracking: Sentry

### Implementation Notes

- Runtime data access uses the Supabase JS client (browser, server, middleware, and a secret-key admin client for ranking writes).
- Drizzle mirrors the Postgres schema for tooling; migrations live in `supabase/migrations/`.
- `derived_series_rankings` and series mapping writes use the Supabase secret key server-side; clients do not INSERT derived rows directly.
- Ranking recomputes on demand after completions and comparisons (scheduled jobs optional later).
- Avatars are external URLs on `profiles.avatar_url` unless Storage upload is added later.

### Why This Stack

Supabase keeps the app close to a normal Postgres architecture while providing hosted auth and useful managed services. That matters because this product has relational data at its core: users have anime entries, entries produce comparisons, comparisons produce rankings, rankings are visible on profiles, and friends connect users into a social graph.

Next.js App Router is a strong fit because many product surfaces are server-renderable: public profiles, anime detail pages, ranked lists, and watchlists. Server actions or route handlers can handle mutations while keeping the frontend relatively simple.

AniList avoids building a custom anime catalog. The app should cache normalized anime records locally when users interact with them, while treating AniList as the source for search and enrichment.

## 5. MVP Scope

### In Scope

- Email/password and OAuth authentication.
- User profiles with username, display name, avatar, bio, and public profile URL (`/u/:username`).
- Anime search powered by AniList; optional discover rows on home (latest, popular).
- Anime detail pages with metadata, cover image, genres, season/year, format, status, and description.
- User library entries with status, progress, notes, started date, completed date, and optional personal rating.
- Watchlist via `plan_to_watch` status.
- Series grouping: map cached anime to canonical franchises for ranking.
- Pairwise comparison prompts for completed **series** (see §11).
- Generated personal rankings from comparison history (`derived_series_rankings`).
- Public profile pages showing ranked series, watching list, and watchlist highlights.
- Friend requests and accepted friend relationships.
- Browse friends' profiles and rankings.
- Basic privacy controls for account-level sensitive data.
- Append-only `user_events` for recommendation readiness.

### Out Of Scope Until Later

- Native apps.
- Offline support.
- Advanced recommendation engine.
- Direct messaging.
- Comments and public discussion threads.
- Moderator console.
- Imports from third-party anime trackers.
- Paid subscriptions.

## 6. Core Product Principles

### Fast Capture

Adding or updating an anime should take less than 10 seconds from search. The user should not need to answer ranking questions while adding something unless they choose to.

### Rankings Improve Gradually

The app should not demand that users rank everything at once. It should ask small, contextual comparison questions and improve rankings over time.

### Public By Default, Account-Private By Design

Profiles, lists, and rankings are public by default. Email addresses, auth providers, internal IDs, notification settings, and private account metadata are never public.

### Recommendations Need Clean Signals

Every ranking comparison, watch status update, completion, rewatch, and dropped anime is a future recommendation signal. The data model should preserve these events rather than only storing final state.

## 7. User Journeys

### 7.1 Onboarding

1. User signs up with email or OAuth.
2. User chooses a unique username.
3. User optionally adds display name, avatar, and bio.
4. User is prompted to search for anime they have already completed.
5. User can skip onboarding and start with search or watchlist.

Success criteria:

- User reaches the main app within one minute.
- Username uniqueness errors are clear.
- Empty states explain the first useful action.

### 7.2 Add Watched Anime

1. User searches for an anime by title.
2. App displays AniList results with title, cover, year, format, and episode count.
3. User opens an anime detail page or quick-add menu.
4. User selects status: watching, completed, paused, dropped, or plan to watch.
5. If completed, the entry's **series** becomes eligible for pairwise ranking (after `anime_series_map` is ensured).
6. App confirms the add and suggests the next useful action.

Useful next actions:

- "Compare this with another completed series"
- "Add another anime"
- "View your ranking"
- "Update progress"

### 7.3 Manage Watchlist

1. User adds anime as `plan_to_watch`.
2. Watchlist page groups entries by priority, genre, or date added.
3. User can move an anime to `watching` when they start it.
4. User can remove entries or mark them as not interested.

MVP watchlist sorting:

- Recently added
- Title
- Release year
- Optional manual priority: low, medium, high

### 7.4 Pairwise Ranking

Rankings operate on **series** (franchises). A user needs at least one completed library entry in each of two distinct series before comparing.

1. User opens the ranking page (or follows a home prompt).
2. App presents two completed series (canonical title, cover; may reflect multiple seasons in the user's library).
3. User answers "Which did you enjoy more?"
4. App stores the comparison in `pairwise_series_comparisons` (canonical `left_series_id < right_series_id`).
5. Server recomputes `derived_series_rankings` for `algorithm_version = elo_series_v1`.
6. Ranked list shows confidence labels (`low`, `medium`, `high`).

Comparison actions:

- Pick left or right series (winner).
- Skip: cannot decide (`skipped_reason = cannot_decide`).
- Skip: not comparable (`skipped_reason = not_comparable`).

Skips do not affect Elo scores. Re-answering the same pair upserts the existing row.

### 7.5 View Public Profile

1. Visitor opens `/u/:username`.
2. Page shows profile info, series ranked list, aggregate stats, watching highlights, and watchlist highlights.
3. Visitor can browse full rankings and list sections.
4. Authenticated visitors can send a friend request.

Public profile defaults:

- Visible: display name, username, avatar, bio, public lists, rankings, aggregate stats.
- Hidden: email, auth identities, private settings, notification preferences.

### 7.6 Friends

1. User searches for another user by username.
2. User sends a friend request.
3. Recipient accepts or declines.
4. Accepted friends appear in the friends list.
5. Users can browse friends' rankings from a friend dashboard.

MVP friend value:

- Easier access to known profiles.
- Compare rankings with friends.
- Later: friend-based recommendation signals.

## 8. Information Architecture

### Primary Navigation

- Home (`/`): continue watching, ranking prompt, optional discover rows, friend highlights (later).
- Search (`/search`): anime search and quick-add.
- Library (`/library`): entries by status.
- Ranking (`/ranking`): series comparison and ranked list.
- Friends (`/friends`): friend list, requests, discovery.
- Settings (`/settings`): account and profile appearance.
- Public profile (`/u/:username`): visitor-facing taste page.

### Main Screens

#### Home

Purpose: Resume the most useful action.

Sections:

- Continue watching (in-progress entries with progress).
- Optional AniList discover (latest, popular).
- Series ranking prompt when eligible.
- Watchlist reminders (later).
- Recent friend rankings (later).

#### Search

Purpose: Find anime quickly.

Sections:

- Search input.
- Result cards with quick-add status actions.
- Filters for format, year, season, status, genre (later).

#### Anime Detail

Purpose: Show metadata and the user's relationship to the anime.

Sections:

- Hero with title, cover, description, and metadata.
- User status card.
- Progress controls.
- Ranking eligibility when completed.
- Friends who watched it (later).

#### Library

Purpose: Manage tracked anime.

Sections:

- Tabs by status (`all`, `watching`, `completed`, `plan_to_watch`, `paused`, `dropped`).
- In-library title search.
- Entry cards with status, progress, notes, and dates.
- Sort: recently updated (default); title, year, priority (later).

#### Ranking

Purpose: Build and view personal series rankings.

Sections:

- Pairwise comparison card (two series).
- Current ranked list with confidence indicators.
- Empty state when fewer than two completed series.
- Filters by format or genre (later).

#### Friends

Purpose: Browse social graph.

Sections:

- Friend search.
- Incoming and outgoing requests.
- Friend list.
- Friend ranking highlights.

#### Public Profile

Purpose: Let others understand a user's taste.

Sections:

- Profile header with friend action.
- Series ranked list.
- Recently completed (later).
- Watching now and watchlist highlights.
- Full public lists (later).

## 9. System Architecture

```mermaid
flowchart TD
  browser[Browser] --> nextApp[Next.js App]
  nextApp --> serverActions[Server Actions And Route Handlers]
  serverActions --> auth[Supabase Auth]
  serverActions --> postgres[Supabase Postgres]
  serverActions --> anilist[AniList GraphQL]
  serverActions --> rankingService[Ranking Service]
  rankingService --> postgres
  cron[Scheduled Jobs] --> rankingService
  cron --> recommendationPrep[Recommendation Prep]
  recommendationPrep --> postgres
  postgres --> profilePages[Public Profile Pages]
  profilePages --> browser
```

### Frontend Responsibilities

- Render app routes and public profile pages.
- Provide fast search, status updates, and comparison interactions.
- Manage optimistic UI for low-risk actions such as status updates.
- Display ranking confidence and empty states.
- Keep forms accessible and mobile-friendly.

### Backend Responsibilities

- Authenticate users.
- Enforce authorization.
- Normalize and cache anime metadata.
- Persist user library entries.
- Persist pairwise series comparisons.
- Compute and cache series rankings (admin client).
- Manage friend requests and relationships.
- Emit analytics and event records for recommendation readiness.

### External Services

- AniList GraphQL for anime metadata search and enrichment.
- Supabase for database, auth, storage, and optional realtime.
- Vercel for app hosting and cron triggers.
- Sentry for error tracking.
- PostHog or Vercel Analytics for product analytics.

## 10. Data Model

### Entity Overview

Tracking is per **anime**; ranking is per **series**.

```mermaid
erDiagram
  USERS ||--|| PROFILES : owns
  USERS ||--o{ USER_ANIME_ENTRIES : tracks
  ANIME ||--o{ USER_ANIME_ENTRIES : referenced_by
  ANIME ||--o| ANIME_SERIES_MAP : mapped_to
  SERIES ||--o{ ANIME_SERIES_MAP : contains
  USERS ||--o{ PAIRWISE_SERIES_COMPARISONS : creates
  SERIES ||--o{ PAIRWISE_SERIES_COMPARISONS : left_series
  SERIES ||--o{ PAIRWISE_SERIES_COMPARISONS : right_series
  USERS ||--o{ DERIVED_SERIES_RANKINGS : has
  SERIES ||--o{ DERIVED_SERIES_RANKINGS : ranked
  USERS ||--o{ FRIENDSHIPS : requester
  USERS ||--o{ FRIENDSHIPS : recipient
  USERS ||--o{ USER_EVENTS : emits
```

### `users`

Managed primarily by Supabase Auth.

Fields:

- `id`
- `email`
- `created_at`
- `last_sign_in_at`

Public exposure: never expose email or auth metadata.

### `profiles`

Public user-facing profile data.

Fields:

- `user_id`
- `username`
- `display_name`
- `avatar_url`
- `bio`
- `profile_visibility`
- `created_at`
- `updated_at`

MVP visibility: public profiles by default. `profile_visibility` exists for future private or friends-only modes.

### `anime`

Local cache of anime metadata from AniList.

Fields:

- `id`
- `anilist_id`
- `romaji_title`
- `english_title`
- `native_title`
- `description`
- `cover_image_url`
- `banner_image_url`
- `format`
- `episodes`
- `duration_minutes`
- `season`
- `season_year`
- `status`
- `genres`
- `average_score`
- `popularity`
- `source`
- `metadata_updated_at`

Rule: create or refresh records when users search, open details, or add entries.

### `user_anime_entries`

User-specific tracking state.

Fields:

- `id`
- `user_id`
- `anime_id`
- `status`
- `progress_episodes`
- `rewatch_count`
- `priority`
- `notes`
- `personal_score`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Constraints:

- Unique `user_id`, `anime_id`.
- `status` enum: `watching`, `completed`, `paused`, `dropped`, `plan_to_watch`.
- `progress_episodes` cannot be negative.
- Completed entries make their mapped **series** eligible for ranking (not the individual season row).
- `started_at` / `completed_at` may be set automatically on status transitions or edited by the user.

### `series`

Canonical franchise row for ranking and public lists.

Fields:

- `id`
- `canonical_title`
- `slug` (unique)
- `anilist_primary_id` (unique)
- `cover_image_url`
- `created_at`, `updated_at`

Created/updated when users complete or add anime, using the AniList relation graph, title heuristics, and optional `series_group_overrides`.

### `anime_series_map`

Links each cached `anime` row to exactly one `series`.

Fields:

- `anime_id` (PK, FK → `anime`)
- `series_id` (FK → `series`)
- `source` — `anilist_auto` | `manual_override` | `singleton`
- `confidence` (0–1)

### `series_group_overrides`

Admin/manual corrections when auto-grouping is wrong.

Fields include `anilist_id`, `action` (`force_series`, `force_singleton`, `exclude_from_auto_group`), optional `target_series_id` / `target_anilist_primary_id`, `notes`.

### `pairwise_series_comparisons`

Ranking input events.

Fields:

- `id`
- `user_id`
- `left_series_id`, `right_series_id` (canonical order: `left < right`)
- `winner_series_id` (nullable if skipped)
- `comparison_context` (jsonb, optional)
- `skipped_reason` — e.g. `cannot_decide`, `not_comparable`
- `created_at`

Rules:

- Unique `(user_id, left_series_id, right_series_id)`; upsert on repeat.
- User must have at least one completed entry in each series.
- Skipped rows are excluded from Elo recompute.
- RLS: users read/write own rows; anon can SELECT (public profile context).

### `derived_series_rankings`

Cached output of ranking computation.

Fields:

- `id`
- `user_id`
- `series_id`
- `rank` (1-based, dense after sort)
- `score` (Elo)
- `confidence` — enum `low` | `medium` | `high`
- `comparison_count`
- `algorithm_version` — current: `elo_series_v1`
- `computed_at`

Rules:

- Unique `(user_id, series_id, algorithm_version)`.
- **Writes:** server admin client only (no authenticated INSERT policy).
- **Reads:** public SELECT for profiles; users read own rows.
- Recompute replaces all rows for `(user_id, algorithm_version)` after each winning comparison or completion mapping repair.
- Public profile and ranking pages read this table.

### `friendships`

Friend request and accepted friend relationship.

Fields:

- `id`
- `requester_id`
- `recipient_id`
- `status`
- `created_at`
- `responded_at`

Status enum:

- `pending`
- `accepted`
- `declined`
- `blocked`

Constraints:

- Prevent duplicate active relationships between the same two users.
- Prevent users from friending themselves.

### `user_events`

Append-only product and recommendation signal log.

Fields:

- `id`
- `user_id`
- `event_type`
- `anime_id`
- `metadata`
- `created_at`

Event examples:

- `anime_added`
- `status_changed`
- `progress_updated`
- `anime_completed`
- `series_comparison_created`
- `ranking_viewed`
- `friend_request_sent`
- `friend_profile_viewed`

Purpose: keep recommendation signals even if current state changes.

## 11. Ranking System

### Product Model

The primary ranking input is pairwise comparison at **series** granularity: "Which did you enjoy more?" Users track individual anime in the library; completed entries contribute eligibility to their parent **series**. Multiple completed seasons in one franchise count as one rankable entity.

The comparison UI shows series title, cover, and how many library entries the user has in that franchise.

### Eligibility

A series enters the pool when the user has at least one `user_anime_entries` row with `status = completed` mapped via `anime_series_map`. Ranking unlock requires at least two distinct such series.

On add or complete, the app ensures `anime_series_map` (AniList franchise graph and merge rules) and recomputes derived rankings.

### MVP Algorithm

Use an Elo-style scoring model per user, per series.

| Constant | Value |
|----------|--------|
| Initial score | `1500` |
| K-factor | `32` |
| Algorithm version | `elo_series_v1` |

On comparison:

- Winner gains points; loser loses points (standard Elo update).
- Each series' `comparison_count` increments for resolved comparisons.
- Skipped pairs (`winner_series_id` null) are excluded from recompute.

Confidence on `derived_series_rankings`:

- `low`: fewer than 3 comparisons involving the series
- `medium`: 3 to 7
- `high`: 8 or more

Display softly: "Needs more comparisons", "Getting clearer", "Well established".

Why Elo for MVP:

- Simple to explain.
- Easy to implement.
- Works incrementally.
- Does not require users to compare every pair.
- Produces stable enough rankings for personal lists.

Limitations:

- Ordering can depend on comparison sequence.
- Sparse comparisons create low-confidence rankings.
- It does not directly model uncertainty as well as Bayesian systems.
- Franchise grouping quality depends on AniList relations and heuristics; `series_group_overrides` and a backfill script support repair.

### Future Algorithm Improvements

Consider moving to TrueSkill, Glicko, or a Bradley-Terry model once data volume grows.

Future ranking features:

- Genre-specific rankings.
- Seasonal rankings.
- Movies vs series filtering.
- Friend comparison view.
- "You and this friend both loved..." view.
- Ranking confidence prompts that choose high-information comparisons.

### Prompt Selection

The comparison prompt should avoid random-only selection. It should prefer pairs that improve ranking quality.

MVP prompt strategy:

1. Only include completed series.
2. Prefer series with low comparison counts.
3. Prefer series with similar current Elo scores.
4. Avoid pairs with very large rank distance when better candidates exist.
5. Do not repeat the same canonical pair once compared (upsert if the user re-answers).
6. Allow skips without affecting scores.

Future prompt strategy:

- Select pairs with the highest uncertainty reduction.
- Consider recency and popularity.
- Let users focus comparisons by genre or format.

### Ranking Confidence

Confidence should be displayed softly, not as a technical metric. See the thresholds in the MVP algorithm section above. This can later account for score volatility and graph connectivity.

## 12. Recommendation Readiness

Recommendations are a future feature, but the MVP should collect clean preference signals now.

### Signals To Capture

- Completed anime.
- Dropped anime.
- Plan-to-watch anime.
- Pairwise comparison winners and losers.
- Ranking scores and confidence.
- Genres, studios, formats, season years, and source material.
- Friend overlap and friend differences.
- Rewatches.
- Manual scores, if present.

### Phase 1 Recommendations

No machine learning needed.

Approach:

- Recommend anime from genres and formats the user ranks highly.
- Boost anime that friends rank highly.
- Exclude anime already tracked.
- Down-rank genres or formats often dropped by the user.

### Phase 2 Recommendations

Collaborative filtering.

Approach:

- Find users with similar ranking patterns.
- Recommend anime they completed and ranked highly.
- Use pairwise preference data as stronger signal than raw watch status.

### Phase 3 Recommendations

Hybrid model.

Approach:

- Combine collaborative filtering, content features, and friend graph signals.
- Use pairwise outcomes to learn taste vectors.
- Explain recommendations with simple reasons.

Example explanations:

- "Because you ranked character-driven dramas highly."
- "Popular among friends who also loved your top 10."
- "Similar tone and genres to three shows you ranked above average."

## 13. API And Server Action Design

### Auth

- `signUp`
- `signIn`
- `signOut`
- `getCurrentUser`
- `completeProfile`

### Anime Metadata

- `searchAnime(query)` — route handler `GET /api/search`
- `getAnimeDetails(anilistId)`
- `syncAnimeMetadata(anilistId)`
- `getLatestAnime`, `getPopularAnime` (home discover)

### Library

- `addAnimeEntry(anilistId, status)` — upserts anime cache, entry, series map; recompute on complete
- `updateAnimeEntry(entryId, patch)` — status, progress, notes, priority, dates
- `removeAnimeEntry(entryId)`
- `listUserAnimeEntries(userId, filters)`

### Ranking

- `getNextComparisonPair(userId)`
- `submitComparison(leftSeriesId, rightSeriesId, winnerSeriesId)`
- `skipComparison(leftSeriesId, rightSeriesId, reason)`
- `getUserRanking(userId)` — reads `derived_series_rankings`
- `recomputeUserRanking(userId)` — server-only (admin client)

### Friends

- `searchUsers(query)`
- `sendFriendRequest(recipientId)`
- `respondToFriendRequest(friendshipId, response)`
- `listFriends(userId)`
- `listFriendRequests()`

### Profiles

- `getPublicProfile(username)` — profile, entries, series rankings, stats
- `getPublicLists(username)` (later)
- `updateProfile(patch)`

## 14. Authorization Model

### Public Reads

Allowed:

- Public profile data.
- Public rankings.
- Public anime lists.
- Public aggregate stats.

Denied:

- Email addresses.
- Auth identities.
- Private settings.
- Internal event logs.
- Non-public future fields.

### Authenticated Writes

Users can write:

- Their own profile.
- Their own library entries.
- Their own `pairwise_series_comparisons` rows.
- Friend requests involving themselves.

Users cannot write:

- Other users' entries.
- Other users' ranking rows (read-only via public SELECT).
- `derived_series_rankings` rows directly (server admin only).
- Anime metadata except through controlled sync paths.

### Friend-Specific Reads

MVP public profiles do not need friend-only list access. Friendship is mainly a discovery and relationship feature. The schema should still support future visibility levels.

## 15. Data Flow

### Add Anime Flow

```mermaid
sequenceDiagram
  participant User
  participant App
  participant AniList
  participant Database

  User->>App: Search title
  App->>AniList: Query anime
  AniList-->>App: Results
  User->>App: Add anime with status
  App->>Database: Upsert anime metadata
  App->>Database: Upsert user anime entry
  App->>Database: Write user event
  App-->>User: Show updated library state
```

### Pairwise Ranking Flow

```mermaid
sequenceDiagram
  participant User
  participant App
  participant Database
  participant RankingService

  User->>App: Open ranking page
  App->>Database: Fetch eligible completed series
  App->>Database: Fetch comparison history and derived rankings
  App-->>User: Show comparison pair (two series)
  User->>App: Choose winner
  App->>Database: Upsert pairwise_series_comparisons
  App->>Database: Write user event
  App->>RankingService: Recompute derived_series_rankings
  RankingService->>Database: Replace ranking rows
  App-->>User: Show updated ranking
```

### Public Profile Flow

```mermaid
sequenceDiagram
  participant Visitor
  participant App
  participant Database

  Visitor->>App: Open profile URL
  App->>Database: Fetch public profile
  App->>Database: Fetch derived_series_rankings
  App->>Database: Fetch public list summaries
  App-->>Visitor: Render public profile
```

## 16. UX Details

### Adding And Tracking

The app should prioritize quick actions:

- Search result cards should include status actions (watchlist, watching, completed).
- Anime detail pages should show the current user's status prominently.
- Progress updates should be one tap or one small input away (library cards; detail page later).
- Completing an anime should offer, but not force, a ranking comparison.
- Duplicate add updates status in place: "Already in your library. Status updated."

### Watchlist

The watchlist should feel separate from completed rankings. Users often bookmark with less certainty than they rate.

- Status: `plan_to_watch` (library tab).
- Priority: low, medium, high (optional field).
- Default sort: recently updated; title, year, priority later.

### Pairwise Ranking UI

The comparison UI should be simple and mobile-first:

- Two large series cards (cover, canonical title, entry count in library).
- Primary question: "Which did you enjoy more?"
- Whole-card tap selects winner.
- Secondary actions: can't decide, not comparable.
- Avoid showing numeric Elo on the comparison screen.

### Public Profiles

Profiles should make taste immediately legible:

- Series ranked list above the fold.
- Watching now and watchlist as secondary sections.
- Friend action near the profile header.

### Empty States

Examples:

- No library entries: "Search for an anime to start building your list."
- Fewer than two completed series: explain how to unlock rankings.
- Not enough comparisons: "Compare a few favorites to build your ranking."
- No friends: "Find friends by username and compare rankings."

## 17. Error Handling

### Search Failures

If AniList is unavailable:

- Show a friendly error.
- Let the user retry.
- Keep local recently viewed anime available if cached.

### Duplicate Adds

If a user adds an anime already in their library:

- Update status instead of creating duplicates.
- Show a message: "Already in your library. Status updated."

### Ranking Edge Cases

If fewer than two completed series exist:

- Hide pairwise prompt.
- Explain how to unlock ranking.

If a user has completed anime but missing series mappings:

- Repair mappings and recompute on ranking page load.

If a compared series is no longer completed:

- Exclude it from future prompts.
- Keep historical comparison records.
- Recompute ranking using current completed series only.

### Friend Request Edge Cases

- Prevent duplicate pending requests.
- If two users request each other, convert to accepted friendship.
- Block self-friend requests.
- Respect blocked relationships in future versions.

## 18. Accessibility And Mobile UX

### Accessibility

- All interactive controls must be keyboard accessible.
- Comparison cards must have clear button labels.
- Cover images need meaningful alt text.
- Color cannot be the only indicator of status or ranking confidence.
- Forms need inline validation messages.
- Public profile and ranking pages need semantic headings.

### Mobile UX

- Ranking comparisons should fit comfortably on a phone.
- Bottom navigation is appropriate for primary app sections.
- Search and quick-add interactions should avoid dense tables.
- Tap targets should be large enough for repeated ranking actions.

## 19. Security And Privacy

### Security Controls

- Use row-level security policies for all user-owned tables.
- Validate all server-side mutations.
- Rate limit search, friend requests, and comparison submissions.
- Use unique usernames with normalized casing.
- Sanitize profile bio and notes.
- Store external image URLs, not downloaded images, unless storage is needed later.

### Privacy Controls

MVP:

- Public profiles and lists by default.
- Private account data never exposed.
- Users can delete their own entries and comparisons.

Future:

- Profile visibility: public, friends-only, private.
- Per-list visibility.
- Blocked users.
- Data export.
- Account deletion workflow.

## 20. Testing Strategy

### Unit Tests

- Ranking score updates.
- Prompt selection.
- Visibility and authorization helpers.
- Status transition validation.
- Username normalization.

### Integration Tests

- Add anime from search result.
- Update library entry status.
- Submit comparison and verify ranking changes.
- Send, accept, and decline friend requests.
- Render public profile with rankings.

### End-To-End Tests

- Onboard a new user and add first anime.
- Build a ranking from multiple comparisons.
- View another user's public profile.
- Send and accept a friend request.

### Data Tests

- Ensure one library entry per user/anime.
- Ensure comparison winner is valid.
- Ensure `derived_series_rankings` are unique per user/series/algorithm version.
- Ensure public profile queries do not include private fields.

## 21. Analytics And Observability

### Product Analytics

Track:

- Signup completion.
- Anime searches.
- Anime adds by status.
- Completion events.
- Pairwise comparisons submitted.
- Skips.
- Ranking page visits.
- Public profile views.
- Friend requests sent and accepted.

Key metrics:

- Activation: user adds at least 3 anime.
- Ranking activation: user completes at least 5 comparisons.
- Social activation: user views or adds at least 1 friend.
- Retention: user updates progress or submits comparison after first week.

### Engineering Observability

Monitor:

- AniList API failures and latency.
- Database query performance for public profiles.
- Ranking recomputation time.
- Auth errors.
- Server action validation failures.

## 22. Rollout Plan

### Milestone 1: Foundation

- Set up Next.js app.
- Configure auth (email/password; OAuth).
- Create database schema and RLS.
- Build profile creation and settings.
- Integrate AniList search.

### Milestone 2: Tracking

- Add anime metadata caching.
- Build add/update library flows.
- Build library and watchlist pages.
- Add progress tracking (library and detail).
- Notes, priority, and date editing.

### Milestone 3: Ranking

- Series grouping and `anime_series_map`.
- Completed-series eligibility.
- Pairwise comparison UI with skips.
- Elo recompute and `derived_series_rankings`.
- Ranking page and home prompt.
- Confidence labels.

### Milestone 4: Social

- Build public profile pages with series rankings.
- Build user search.
- Build friend requests and friends dashboard.

### Milestone 5: Recommendation Readiness

- Add event logging.
- Add basic analytics and error tracking.
- Add recommendation signal views for internal debugging.
- Prepare first rules-based recommendation prototype.

### Maintenance

- `backfill:series` script to map existing anime to series and recompute rankings.

## 23. Open Product Decisions

These decisions can wait until implementation planning:

- Whether `personal_score` should exist in MVP or be deferred entirely.
- Whether watchlist priority should be manual, automatic, or omitted.
- Whether ranking should include only completed anime or allow dropped anime in a separate "least favorite" list.
- Whether public profile pages should be indexable by search engines.
- Whether usernames can be changed after creation.

Recommended defaults:

- Include optional `personal_score`, but do not make it prominent.
- Include simple watchlist priority.
- Rank only completed series in MVP.
- Do not index public profiles until privacy settings mature.
- Allow username changes with rate limits and reserved-name checks.

## 24. Risks And Mitigations

### Risk: Pairwise Ranking Feels Tedious

Mitigation:

- Ask for comparisons opportunistically.
- Keep each comparison interaction fast.
- Show visible progress and ranking changes.
- Allow users to stop anytime.

### Risk: Rankings Feel Wrong With Sparse Data

Mitigation:

- Display confidence labels.
- Prefer high-information comparison prompts.
- Avoid overclaiming precision.
- Let users keep comparing to improve results.

### Risk: Public Profiles Create Privacy Surprises

Mitigation:

- Clearly explain public profile visibility during onboarding.
- Never expose private account data.
- Keep future visibility fields in the schema.
- Add privacy controls before adding richer social content.

### Risk: External Metadata API Becomes A Bottleneck

Mitigation:

- Cache anime records locally.
- Rate limit search.
- Degrade gracefully if AniList fails.
- Store enough normalized data for tracked anime to render without live API calls.

### Risk: Recommendation Feature Is Hard To Add Later

Mitigation:

- Store append-only user events.
- Preserve `pairwise_series_comparisons` history.
- Cache `derived_series_rankings` with algorithm versions (`elo_series_v1`).
- Keep anime metadata structured by genres, format, source, and season.

## 25. Recommended MVP Data Access Pattern

Use server actions for authenticated mutations where possible:

- Add entry.
- Update status and progress.
- Submit series comparison.
- Skip comparison.
- Send friend request.

Use server-rendered routes for public reads:

- Public profile.
- Public ranking.
- Anime details.

Use client components for interactive surfaces:

- Search input and filters.
- Pairwise comparison cards.
- Progress controls.
- Friend request buttons.

This balances performance, simplicity, and interactivity.

## 26. Summary Recommendation

Build the MVP with Next.js, TypeScript, Supabase, Tailwind CSS, and AniList. Keep the first version focused on fast tracking, watchlists, **series-level** pairwise rankings, public profiles, and friends. Use an Elo-style ranking model (`elo_series_v1`) because it is understandable, incremental, and easy to evolve.

Tracking stays per anime; ranking stays per series — an intentional split that matches how users think about individual seasons versus franchises they love.

Preserve future recommendation flexibility by storing structured anime metadata, append-only `user_events`, `pairwise_series_comparisons` history, and versioned `derived_series_rankings`.
