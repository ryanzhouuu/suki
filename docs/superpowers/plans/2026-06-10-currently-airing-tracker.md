# Currently-Airing Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Home section listing the user's currently-watching shows that are still airing, with a live next-episode countdown, an "episodes behind" badge, and a one-tap +1-episode control that auto-completes at the finale.

**Architecture:** A pure, unit-tested core (`airing.ts`) maps library entries + AniList airing data into view models; an impure shell (`airing-fetch.ts`) fetches watching entries and batched AniList airing info behind an `unstable_cache` TTL cache (`cache.ts`). A streamed (`<Suspense>`) server component renders the section on Home; a client row component drives the live countdown and the +1 control (reusing the existing `updateAnimeEntry` action).

**Tech Stack:** Next.js 16 (App Router, RSC + `<Suspense>` streaming), `unstable_cache` from `next/cache`, AniList GraphQL, Supabase, Node's native `--test` runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-06-10-currently-airing-tracker-design.md`

---

## File Structure

New:
- `src/lib/anime/airing.ts` — **pure** core: `buildAiringRows`, `formatTimeUntil`, `AiringRow` type. Type-only imports so it is safe to unit-test in isolation.
- `src/lib/anime/airing-fetch.ts` — **impure** shell: `getAiringForWatching(userId)` (library read + batched cached AniList fetch). Imports the pure core.
- `src/lib/anilist/cache.ts` — reusable `unstable_cache` wrapper + shared TTL/tag constants.
- `src/components/home/airing-tracker.tsx` — async server component + skeleton fallback.
- `src/components/home/airing-row.tsx` — client row (live countdown + +1 control).
- `tests/lib/anime/airing.test.ts` — unit tests for the pure core.

Modified:
- `src/lib/anilist/queries.ts` — add `ANIME_AIRING_QUERY`.
- `src/lib/anilist/types.ts` — add `AniListAiringMedia`, `AniListAiringResult`.
- `src/app/(app)/home/page.tsx` — render `<AiringTracker>` inside `<Suspense>`.

---

## Task 1: Pure airing core + tests

**Files:**
- Create: `src/lib/anime/airing.ts`
- Test: `tests/lib/anime/airing.test.ts`

- [ ] **Step 1: Write the pure core**

Create `src/lib/anime/airing.ts`. Note both imports are `import type` (erased at runtime) so this module pulls in **no** server runtime dependencies and is safe to unit-test.

```ts
import type { AniListAiringMedia } from "@/lib/anilist/types";
import type { LibraryEntry } from "@/lib/library/queries";

/** A watching entry that is still airing, ready for display. */
export type AiringRow = {
  entryId: string;
  anilistId: number;
  title: string;
  coverUrl: string | null;
  nextEpisodeNumber: number;
  /** Unix seconds (absolute) when the next episode airs. */
  airingAt: number;
  episodesBehind: number;
  progressEpisodes: number;
  totalEpisodes: number | null;
};

/**
 * Join watching entries to their AniList airing media and produce display rows,
 * soonest-airing first. Entries with no scheduled next episode (finished or on
 * hiatus) are excluded — the feature keys off next-episode timing.
 */
export function buildAiringRows(
  entries: LibraryEntry[],
  mediaById: Map<number, AniListAiringMedia>,
): AiringRow[] {
  const rows: AiringRow[] = [];

  for (const entry of entries) {
    const media = mediaById.get(entry.anime.anilist_id);
    const next = media?.nextAiringEpisode;
    if (!media || !next) continue;

    const latestAired = next.episode - 1;
    const episodesBehind = Math.max(0, latestAired - entry.progress_episodes);
    const title =
      entry.anime.english_title ||
      entry.anime.romaji_title ||
      entry.anime.native_title ||
      "Unknown";

    rows.push({
      entryId: entry.id,
      anilistId: entry.anime.anilist_id,
      title,
      coverUrl: entry.anime.cover_image_url,
      nextEpisodeNumber: next.episode,
      airingAt: next.airingAt,
      episodesBehind,
      progressEpisodes: entry.progress_episodes,
      totalEpisodes: media.episodes ?? entry.anime.episodes,
    });
  }

  rows.sort((a, b) => a.airingAt - b.airingAt);
  return rows;
}

/** Format seconds-until-airing as a compact countdown, e.g. "2d 4h", "5h 12m", "8m". */
export function formatTimeUntil(secondsUntil: number): string {
  if (secondsUntil <= 0) return "now";
  const totalMinutes = Math.floor(secondsUntil / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/lib/anime/airing.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAiringRows,
  formatTimeUntil,
  type AiringRow,
} from "@/lib/anime/airing";
import type { AniListAiringMedia } from "@/lib/anilist/types";
import type { LibraryEntry } from "@/lib/library/queries";

function entry(opts: {
  id: string;
  anilistId: number;
  progress: number;
  episodes?: number | null;
  english?: string;
}): LibraryEntry {
  return {
    id: opts.id,
    progress_episodes: opts.progress,
    anime: {
      anilist_id: opts.anilistId,
      episodes: opts.episodes ?? null,
      english_title: opts.english ?? "Show",
      romaji_title: opts.english ?? "Show",
      native_title: null,
      cover_image_url: null,
    },
  } as unknown as LibraryEntry;
}

function media(opts: {
  id: number;
  episode: number | null; // next episode number; null => no scheduled next episode
  airingAt?: number;
  episodes?: number | null;
}): AniListAiringMedia {
  return {
    id: opts.id,
    episodes: opts.episodes ?? null,
    status: opts.episode == null ? "FINISHED" : "RELEASING",
    nextAiringEpisode:
      opts.episode == null
        ? null
        : { episode: opts.episode, airingAt: opts.airingAt ?? 0 },
  };
}

function mapOf(...items: AniListAiringMedia[]): Map<number, AniListAiringMedia> {
  return new Map(items.map((m) => [m.id, m]));
}

describe("buildAiringRows", () => {
  it("excludes entries whose media has no scheduled next episode", () => {
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 3 })],
      mapOf(media({ id: 1, episode: null })),
    );
    assert.equal(rows.length, 0);
  });

  it("excludes entries with no matching media", () => {
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 3 })],
      mapOf(media({ id: 99, episode: 5 })),
    );
    assert.equal(rows.length, 0);
  });

  it("computes episodes behind as latest-aired minus progress", () => {
    // next episode is 8 => latest aired is 7; progress 3 => 4 behind
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 3 })],
      mapOf(media({ id: 1, episode: 8, airingAt: 100 })),
    );
    assert.equal(rows[0].episodesBehind, 4);
    assert.equal(rows[0].nextEpisodeNumber, 8);
  });

  it("clamps episodes behind to zero when caught up", () => {
    // next episode 8 => latest aired 7; progress 7 => 0 behind (not negative)
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 7 })],
      mapOf(media({ id: 1, episode: 8, airingAt: 100 })),
    );
    assert.equal(rows[0].episodesBehind, 0);
  });

  it("sorts rows by soonest airing first", () => {
    const rows = buildAiringRows(
      [
        entry({ id: "a", anilistId: 1, progress: 0 }),
        entry({ id: "b", anilistId: 2, progress: 0 }),
      ],
      mapOf(
        media({ id: 1, episode: 2, airingAt: 500 }),
        media({ id: 2, episode: 2, airingAt: 200 }),
      ),
    );
    assert.deepEqual(
      rows.map((r: AiringRow) => r.entryId),
      ["b", "a"],
    );
  });

  it("falls back to the cached anime episode count when AniList omits it", () => {
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 0, episodes: 12 })],
      mapOf(media({ id: 1, episode: 2, airingAt: 100, episodes: null })),
    );
    assert.equal(rows[0].totalEpisodes, 12);
  });
});

describe("formatTimeUntil", () => {
  it("returns 'now' for non-positive input", () => {
    assert.equal(formatTimeUntil(0), "now");
    assert.equal(formatTimeUntil(-10), "now");
  });

  it("formats days and hours", () => {
    // 2 days, 4 hours
    assert.equal(formatTimeUntil((2 * 24 + 4) * 3600), "2d 4h");
  });

  it("formats hours and minutes when under a day", () => {
    assert.equal(formatTimeUntil(5 * 3600 + 12 * 60), "5h 12m");
  });

  it("formats minutes only when under an hour", () => {
    assert.equal(formatTimeUntil(8 * 60 + 30), "8m");
  });
});
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (the implementation in Step 1 satisfies these tests). The new file `tests/lib/anime/airing.test.ts` runs green alongside the existing suite.

- [ ] **Step 4: Lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors. (`AniListAiringMedia` does not exist yet — **typecheck will fail here on the type-only import**. That's expected; it is added in Task 2. If you are executing tasks strictly in order, do Task 2 before running typecheck, or temporarily expect this one failure to resolve after Task 2.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/anime/airing.ts tests/lib/anime/airing.test.ts
git commit -m "feat(airing): pure airing-row mapping and countdown formatting

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: AniList airing query + types

**Files:**
- Modify: `src/lib/anilist/queries.ts`
- Modify: `src/lib/anilist/types.ts`

- [ ] **Step 1: Add the airing query**

Append to `src/lib/anilist/queries.ts` (after `ANIME_RELATIONS_QUERY`):

```ts
/** Batched airing info for many watching titles in one request (perPage max 50). */
export const ANIME_AIRING_QUERY = `
  query AnimeAiring($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        episodes
        status
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  }
`;
```

- [ ] **Step 2: Add the airing types**

Append to `src/lib/anilist/types.ts`:

```ts
export type AniListAiringMedia = {
  id: number;
  episodes: number | null;
  status: string | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
};

export type AniListAiringResult = {
  Page: {
    media: AniListAiringMedia[] | null;
  } | null;
};
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors (Task 1's type-only import of `AniListAiringMedia` now resolves).

- [ ] **Step 4: Commit**

```bash
git add src/lib/anilist/queries.ts src/lib/anilist/types.ts
git commit -m "feat(airing): AniList airing query and media types

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Reusable AniList cache helper

**Files:**
- Create: `src/lib/anilist/cache.ts`

- [ ] **Step 1: Write the cache helper**

Create `src/lib/anilist/cache.ts`:

```ts
import { unstable_cache } from "next/cache";

/** Short TTL for best-effort AniList schedule caching (30 min). */
export const ANILIST_CACHE_TTL_SECONDS = 1800;

/** Shared cache tag namespace so AniList entries can be invalidated together. */
export const ANILIST_CACHE_TAG = "anilist";

/**
 * Wrap an AniList fetch function in Next's cross-request Data Cache.
 *
 * The cache key is derived from `keyParts` plus the serialized arguments passed
 * to the returned function, so callers should pass stable, order-normalized
 * arguments (e.g. a sorted id list). The wrapped function should fetch with
 * `{ cache: "no-store" }` so this layer owns caching.
 */
export function cachedAnilistFetch<A extends unknown[], T>(
  keyParts: string[],
  fn: (...args: A) => Promise<T>,
  options?: { revalidate?: number; tags?: string[] },
): (...args: A) => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: options?.revalidate ?? ANILIST_CACHE_TTL_SECONDS,
    tags: [ANILIST_CACHE_TAG, ...(options?.tags ?? [])],
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/anilist/cache.ts
git commit -m "feat(anilist): reusable unstable_cache wrapper for AniList fetches

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Impure airing-fetch shell

**Files:**
- Create: `src/lib/anime/airing-fetch.ts`

- [ ] **Step 1: Write the fetch shell**

Create `src/lib/anime/airing-fetch.ts`:

```ts
import { anilistQuery } from "@/lib/anilist/client";
import { cachedAnilistFetch } from "@/lib/anilist/cache";
import { ANIME_AIRING_QUERY } from "@/lib/anilist/queries";
import type {
  AniListAiringMedia,
  AniListAiringResult,
} from "@/lib/anilist/types";
import { buildAiringRows, type AiringRow } from "@/lib/anime/airing";
import { getUserLibraryEntries } from "@/lib/library/queries";

/** AniList Page.media caps at 50 results per request. */
const AIRING_BATCH_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Cached batched fetch of airing info by AniList id. Pass a sorted id list so
 * the same set of ids maps to a single cache entry regardless of order.
 */
const fetchAiringByIds = cachedAnilistFetch(
  ["anilist-airing"],
  async (ids: number[]): Promise<AniListAiringMedia[]> => {
    const data = await anilistQuery<AniListAiringResult>(
      ANIME_AIRING_QUERY,
      { ids },
      { cache: "no-store" },
    );
    return data.Page?.media ?? [];
  },
  { tags: ["anilist-airing"] },
);

/** Watching entries that are still airing, soonest-airing first. */
export async function getAiringForWatching(
  userId: string,
): Promise<AiringRow[]> {
  const entries = await getUserLibraryEntries(userId, "watching");
  const ids = [...new Set(entries.map((e) => e.anime.anilist_id))];
  if (ids.length === 0) return [];

  const mediaById = new Map<number, AniListAiringMedia>();
  for (const batch of chunk(ids, AIRING_BATCH_SIZE)) {
    const sorted = [...batch].sort((a, b) => a - b);
    const media = await fetchAiringByIds(sorted);
    for (const m of media) {
      mediaById.set(m.id, m);
    }
  }

  return buildAiringRows(entries, mediaById);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/anime/airing-fetch.ts
git commit -m "feat(airing): cached batched fetch of watching airing info

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Client airing row (countdown + +1)

**Files:**
- Create: `src/components/home/airing-row.tsx`

- [ ] **Step 1: Write the client row component**

Create `src/components/home/airing-row.tsx`. Imports `formatTimeUntil` + the `AiringRow` type from the **pure** module so no server code reaches the client bundle.

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { updateAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { formatTimeUntil, type AiringRow } from "@/lib/anime/airing";

export function AiringRowItem({ row }: { row: AiringRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [progress, setProgress] = useState(row.progressEpisodes);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const secondsUntil = Math.floor((row.airingAt * 1000 - now) / 1000);
  const latestAired = row.nextEpisodeNumber - 1;
  const episodesBehind = Math.max(0, latestAired - progress);

  function bump() {
    const previous = progress;
    const next = previous + 1;
    const willComplete = row.totalEpisodes != null && next >= row.totalEpisodes;
    setProgress(next); // optimistic
    startTransition(async () => {
      const result = await updateAnimeEntry(
        row.entryId,
        willComplete
          ? { progressEpisodes: next, status: "completed" }
          : { progressEpisodes: next },
      );
      if (result.error) {
        setProgress(previous); // revert
      } else {
        router.refresh();
      }
    });
  }

  return (
    <li className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition-all hover:border-accent">
      <Link
        href={`/anime/${row.anilistId}`}
        className="block shrink-0 overflow-hidden rounded-md"
      >
        <AnimePoster src={row.coverUrl} alt={row.title} size="sm" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/anime/${row.anilistId}`}
          className="block truncate font-medium text-ink transition-colors group-hover:text-accent"
        >
          {row.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          Ep {row.nextEpisodeNumber} in {formatTimeUntil(secondsUntil)}
        </p>
        {episodesBehind > 0 ? (
          <span className="mt-1 inline-block rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
            {episodesBehind} behind
          </span>
        ) : null}
      </div>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={bump}
      >
        +1 ep
      </Button>
    </li>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/airing-row.tsx
git commit -m "feat(airing): client row with live countdown and +1 control

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Home server component + skeleton

**Files:**
- Create: `src/components/home/airing-tracker.tsx`

- [ ] **Step 1: Write the server component and skeleton**

Create `src/components/home/airing-tracker.tsx`. The fetch is wrapped in `.catch(() => [])` so an AniList outage/rate-limit degrades to the empty state rather than crashing Home.

```tsx
import Link from "next/link";

import { AiringRowItem } from "@/components/home/airing-row";
import { getAiringForWatching } from "@/lib/anime/airing-fetch";

export async function AiringTracker({ userId }: { userId: string }) {
  const rows = await getAiringForWatching(userId).catch(() => []);

  return (
    <section className="animate-rise">
      <div className="mb-4">
        <p className="eyebrow">Now airing</p>
        <h2 className="mt-1 text-2xl font-semibold">Airing this week</h2>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface/40 p-8 text-center">
          <p className="text-sm text-muted">
            Nothing you&apos;re watching is currently airing —{" "}
            <Link
              href="/search"
              className="font-semibold text-accent hover:underline"
            >
              browse this season
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <AiringRowItem key={row.entryId} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function AiringTrackerSkeleton() {
  return (
    <section className="animate-rise">
      <div className="mb-4">
        <p className="eyebrow">Now airing</p>
        <h2 className="mt-1 text-2xl font-semibold">Airing this week</h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <li
            key={i}
            className="h-[88px] animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/airing-tracker.tsx
git commit -m "feat(airing): home airing-tracker section with empty + skeleton states

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Wire the tracker into Home

**Files:**
- Modify: `src/app/(app)/home/page.tsx`

- [ ] **Step 1: Add imports**

In `src/app/(app)/home/page.tsx`, add `Suspense` to the existing `import Link from "next/link";` area. Add at the top of the file:

```tsx
import { Suspense } from "react";
```

And alongside the other `@/components/home/...` imports:

```tsx
import {
  AiringTracker,
  AiringTrackerSkeleton,
} from "@/components/home/airing-tracker";
```

- [ ] **Step 2: Render the section**

Insert the streamed section immediately after the `<FriendActivityTeaser userId={user.id} />` line (around line 69):

```tsx
      <FriendActivityTeaser userId={user.id} />

      <Suspense fallback={<AiringTrackerSkeleton />}>
        <AiringTracker userId={user.id} />
      </Suspense>
```

- [ ] **Step 3: Lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/home/page.tsx"
git commit -m "feat(airing): surface airing tracker on Home

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all three pass. (Equivalent to the `/check` skill.)

- [ ] **Step 2: Manual smoke check (optional but recommended)**

With the dev server running and a logged-in user who has at least one `watching` entry for a currently-RELEASING show:
- The Home page shows an "Airing this week" section (after a brief skeleton).
- Rows show "Ep N in …" countdown, sorted soonest-first, with a "behind" badge where applicable.
- Clicking **+1 ep** increments progress; when the +1 reaches the show's total episode count, the entry flips to `completed` and the row drops off on refresh.
- A user with no airing watching shows sees the empty state linking to `/search`.

- [ ] **Step 3: Final confirmation**

No commit needed if Step 1 is green and nothing changed. If smoke testing surfaced fixes, commit them with a descriptive message.

---

## Self-Review notes

- **Spec coverage:** Home section (Task 6–7), live countdown (Task 5), episodes-behind badge (Tasks 1, 5), +1 reusing `updateAnimeEntry` with auto-complete (Task 5), batched AniList airing query (Task 2), `unstable_cache` TTL cache keyed by sorted ids (Tasks 3–4), soonest-airing sort (Task 1), empty state (Task 6), no migration. All covered.
- **Type consistency:** `AniListAiringMedia` (types.ts) is consumed by `buildAiringRows` (Task 1), the cached fetch (Task 4), and the test (Task 1). `AiringRow` flows from `airing.ts` → `airing-fetch.ts` → `airing-tracker.tsx` → `airing-row.tsx` unchanged. `getAiringForWatching` defined in Task 4, consumed in Task 6. `formatTimeUntil` defined in Task 1, consumed in Task 5.
- **Note on Task 1 typecheck:** `airing.ts` type-only-imports `AniListAiringMedia`, which is added in Task 2 — typecheck is only fully green from Task 2 onward. Flagged in Task 1 Step 4.
