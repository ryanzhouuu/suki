## Next.js 16 (read before writing code)

This repo uses Next.js 16 with the App Router. APIs and conventions differ from older versions and likely from your training data. **Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code**, and heed deprecation notices.

## Commands

- `npm run typecheck` — `tsc --noEmit` (strict mode is on; run after edits)
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm test` — unit tests via Node's native `--test` runner over `tests/**/*.test.ts(x)` (driven by `scripts/run-tests.mjs` using `tsx`; **not** Jest or Vitest). Component tests render with `@testing-library/react` against a `happy-dom` global registered in `tests/setup/dom.mjs`.
- `npm run test:coverage` / `npm run test:coverage:check` — c8 coverage (measures `src/lib/**` and `src/components/ui/**`; thresholds enforced)
- `npm run db:generate` — generate Drizzle migrations from schema; `npm run db:studio` — Drizzle Studio (needs `DATABASE_URL`)
- `npm run types:supabase` — regenerate Supabase types
- `npm run seed:catalog` / `backfill:series` / `backfill:embeddings` / `backfill:popular` — one-off data scripts in `src/scripts` (embeddings/seed need `OPENAI_API_KEY`)

Tests live in `tests/`, mirroring the `src/lib/` and `src/components/` structure.

For client components that use `next/navigation`'s `useRouter()` or call Server Actions (`@/actions/*`), mock them with node:test's built-in module mocking (`--experimental-test-module-mocks`, wired into `scripts/run-tests.mjs`): call `mock.module("next/navigation", { namedExports: { useRouter: () => router } })` (or use the `installRouterMock()` helper in `tests/helpers/mock-router.ts`) and `mock.module("@/actions/...", { namedExports: { ... } })` **before** dynamically `import()`-ing the component under test in a `before()` hook — the component's binding to the mocked module is fixed at that import, so reassign methods on the shared mock object between tests rather than re-registering the mock per test.

## Verification (before declaring a change done)

Run `npm run lint`, `npm run typecheck`, and `npm test`. The `/check` skill runs all three.

## Architecture notes

- **Supabase auth uses two distinct keys** — don't conflate them: the **publishable** key (`sb_publishable_...`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) is browser-safe and respects Row Level Security; the **secret** key (`sb_secret_...`, `SUPABASE_SECRET_KEY`) is server-only and bypasses RLS. Clients are in `src/lib/supabase/` (browser, server, admin, middleware).
- **Rankings are grouped by series (franchise), not individual anime** — multiple seasons/movies of one franchise collapse to a single rankable entry. Logic lives in `src/lib/ranking/` and `src/lib/series/`.
- Server Actions live in `src/actions/`. Avatar uploads allow up to 3 MB via `serverActions.bodySizeLimit` in `next.config.ts`.
- Database is Postgres (Supabase) with RLS; schema and migrations are in `supabase/migrations/`, Drizzle schema in `src/lib/db/`.
- Recommendations use OpenAI embeddings + vector search (`src/lib/recommendations/`). Anime metadata comes from the AniList GraphQL API (`src/lib/anilist/`).
- Path alias: `@/*` → `./src/*`.

## Environment

Required (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SITE_URL`. Optional: `SERIES_ADMIN_EMAILS` (comma-separated, grants `/admin/series` access); `ANILIST_TOKEN` (server-only AniList OAuth token — raises the authenticated rate-limit ceiling; unset behaves as today, since public metadata needs no auth. Read only via `src/lib/anilist/token.ts`, never a bare `process.env` read).

## Development Guidelines

Don't commit directly to `main`. Create a feature branch, push, and open a PR for review.

**NEVER** commit/track design docs.

**NEVER** reference design docs in code or code comments.

**ALWAYS** write simple, concise, one line commit messages that convey the meaning of the changes.

**NEVER** include a "co-authored" comment in a commit message.