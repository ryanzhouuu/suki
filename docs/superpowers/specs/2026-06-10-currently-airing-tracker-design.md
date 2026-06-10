# Currently-Airing Tracker — Design

Date: 2026-06-10
Status: Approved
Source: `docs/feature-roadmap.md` §3 (feature 3)

## Goal

Give users a reason to open Suki weekly: a glanceable Home section listing the
shows they're actively watching that are still airing, with next-episode timing
and how far behind they are.

## Resolved decisions

From the roadmap spec (not re-litigated):

- **Surface: a Home section** — not a separate `/airing` route for now.
- **Live + cache** — airing data is always fetched live from AniList behind a
  short-TTL cross-request cache; no denormalized `next_airing_at` column, no
  scheduled refresh job.
- **+1 auto-completes** — when `progress_episodes` reaches the title's total
  episode count, the entry flips to `completed` (making its series eligible for
  ranking).

Resolved during brainstorming:

- **Cache implementation: `unstable_cache`** (from `next/cache`), *not* the
  `'use cache'` directive. `'use cache'` requires enabling Cache Components
  (`cacheComponents: true`) project-wide, which turns on Partial Prerendering and
  would make every route reading request-time data (e.g. `requireProfile()` on
  Home) error unless wrapped in `<Suspense>` — a large, risky migration out of
  scope for this feature. `unstable_cache` gives the same cross-request TTL cache
  with zero global blast radius and is current/supported in Next 16.
- **Cache helper is general/reusable** — built as `src/lib/anilist/cache.ts` so
  the AniList search proxy (known-issue #5) can adopt it later. Airing is its
  first consumer.
- **Sort: soonest-airing only** for v1 — the "most behind" secondary sort is
  deferred.

## Architecture overview

A Home section lists the user's `watching` entries whose AniList status is still
`RELEASING` (i.e. they have a scheduled `nextAiringEpisode`), each with a live
next-episode countdown, an "episodes behind" badge, and a one-tap **+1 ep**
control that auto-completes at the finale. Airing data is fetched live from
AniList behind a cross-request TTL cache.

**No schema migration** — `progress_episodes`, `status`, and the `anime` cache
already exist.

## Components & data flow

### 1. AniList query — `src/lib/anilist/queries.ts`

Add `ANIME_AIRING_QUERY`, batching by AniList ID (AniList `perPage` max is 50):

```graphql
query AnimeAiring($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      episodes
      status
      nextAiringEpisode { episode airingAt }
    }
  }
}
```

Watching IDs are chunked into groups of ≤50 so users with many in-progress shows
still resolve in a bounded number of requests. Add an `AniListAiringMedia` type
to `src/lib/anilist/types.ts`.

### 2. Shared cache helper — `src/lib/anilist/cache.ts`

A thin wrapper over `unstable_cache` with a shared TTL constant
(`ANILIST_CACHE_TTL_SECONDS = 1800`) and a tag namespace. The airing fetch is
wrapped so that:

- The cache key is derived from the **sorted** list of AniList IDs, so the same
  set of IDs maps to a single cache entry regardless of order.
- `revalidate: ANILIST_CACHE_TTL_SECONDS` (30 min).
- A `tags` entry is attached for future on-demand invalidation.
- The inner `anilistQuery` is called with `{ cache: "no-store" }`, so
  `unstable_cache` owns the caching layer (no double-caching / Data Cache warnings).

The helper stays lean; the search proxy (known-issue #5) can adopt it later.

### 3. Airing module — `src/lib/anime/airing.ts`

Split into a pure, unit-tested core and an impure shell.

**Impure shell** `getAiringForWatching(userId)`:

1. `entries = await getUserLibraryEntries(userId, "watching")`.
2. Map entries to `anime.anilist_id`; chunk to ≤50; call the cached batched fetch
   → a map of AniList media keyed by id.
3. Hand entries + media to the pure core; return the resulting view models.

**Pure core** (exported, unit-tested):

For each entry whose matching media has a non-null `nextAiringEpisode`:

- `latestAiredEpisode = nextAiringEpisode.episode - 1`
- `episodesBehind = Math.max(0, latestAiredEpisode - progress_episodes)`
- `nextEpisodeNumber = nextAiringEpisode.episode`
- `airingAt` (unix seconds, absolute)
- `totalEpisodes = media.episodes ?? entry.anime.episodes`

Entries with no `nextAiringEpisode` (finished, or on hiatus/between seasons) are
**excluded** — the feature keys off next-episode timing. Rows are sorted by
`airingAt` ascending (soonest first). A caught-up entry (`episodesBehind === 0`)
is still shown (it's airing; the countdown is the value).

A pure `formatTimeUntil(secondsUntil)` helper also lives here (days/hours/minutes
formatting, e.g. "2d 4h", "5h 12m", "8m"), importable for both the client row and
tests.

### 4. Home server component — `src/components/home/airing-tracker.tsx`

Async server component `AiringTracker({ userId })` that calls
`getAiringForWatching(userId)`. Rendered on the Home page **wrapped in
`<Suspense>`** with a lightweight skeleton fallback, so the AniList round-trip
streams in without blocking the rest of Home.

- **Empty state:** "Nothing you're watching is currently airing — browse this
  season", linking toward discovery (`/search`).
- **Populated:** a labeled section; each row delegates to the client row
  component below.

Placement on `src/app/(app)/home/page.tsx`: a new section (near "Continue
watching"), wrapped in its own `<Suspense>` boundary rather than added to the
existing top-level `Promise.all`.

### 5. Client row — `src/components/home/airing-row.tsx` (`"use client"`)

Props: a flat view model — `entryId`, `anilistId`, `title`, `coverUrl`,
`nextEpisodeNumber`, `airingAt`, `episodesBehind`, `progressEpisodes`,
`totalEpisodes`.

- **Live countdown:** recompute `airingAt * 1000 - Date.now()` on a
  `setInterval` (≈60 s) so the badge ("Ep 8 in 2d 4h") stays current; computing
  from the absolute `airingAt` keeps it correct even when the value is served
  from cache.
- **Episodes-behind badge:** shown when `episodesBehind > 0`.
- **+1 ep:** reuses the `updateAnimeEntry` server action. Compute
  `next = progressEpisodes + 1`. If `totalEpisodes && next >= totalEpisodes`,
  call `updateAnimeEntry(entryId, { progressEpisodes: next, status: "completed" })`
  in a single call — the action sets `completed_at` and runs the existing
  completed side-effects (events, series mapping, ranking recompute). Otherwise
  call `updateAnimeEntry(entryId, { progressEpisodes: next })`. Optimistically
  update local progress/episodes-behind, then `router.refresh()`; revert on
  error. Auto-completed rows naturally drop off the list after refresh (no longer
  `watching`). Follows the established `src/components/library/entry-card.tsx`
  pattern (`useTransition`, optimistic state, `router.refresh`).

Reuses existing `AnimePoster` and `Button` components.

### Validation note

`validateLibraryEntryPatch` caps `progressEpisodes` at `maxEpisodes`
(`anime.episodes`). Sending `next === totalEpisodes` with `status: "completed"`
is within the cap and accepted; the action processes `status` and
`progressEpisodes` independently, so both the progress bump and the completion
(with its side-effects) are applied in one round-trip.

## Testing

`tests/lib/anime/airing.test.ts` covering the pure core:

- episodes-behind clamping (never negative; caught-up = 0)
- exclusion of entries with null `nextAiringEpisode`
- soonest-airing sort order
- `totalEpisodes` fallback (AniList `episodes` → cached `anime.episodes`)
- `formatTimeUntil` boundaries (days / hours / minutes)

Then the full suite: `npm run lint`, `npm run typecheck`, `npm test`.

## Scope boundaries

- Home section only (no `/airing` route).
- Soonest-airing sort only (no "most behind" toggle yet).
- No cron / no denormalized `next_airing_at` column.
- No schema migration.

## Files touched

New:
- `src/lib/anilist/cache.ts`
- `src/lib/anime/airing.ts`
- `src/components/home/airing-tracker.tsx`
- `src/components/home/airing-row.tsx`
- `tests/lib/anime/airing.test.ts`

Modified:
- `src/lib/anilist/queries.ts` (add `ANIME_AIRING_QUERY`)
- `src/lib/anilist/types.ts` (add `AniListAiringMedia`)
- `src/app/(app)/home/page.tsx` (render `<AiringTracker>` in `<Suspense>`)
