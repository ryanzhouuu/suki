# Suki

Anime tracking with pairwise rankings, public taste profiles, and friends — built with Next.js, Supabase, and AniList.

Product and architecture details: [`docs/design.md`](./docs/design.md).

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js server components, route handlers, and server actions
- **Database:** Supabase Postgres with Row Level Security
- **Auth:** Supabase Auth
- **Metadata:** AniList GraphQL API
- **ORM:** Drizzle (typed queries alongside Supabase client)

## Getting started

### 1. Environment variables

Copy the example file and fill in values from your [Supabase dashboard](https://supabase.com/dashboard):

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API → **Publishable** key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Project Settings → API → **Secret** key (`sb_secret_...`, server only) |
| `DATABASE_URL` | Project Settings → Database → Connection string (pooler URI recommended) |
| `OPENAI_API_KEY` | [OpenAI API keys](https://platform.openai.com/api-keys) — server only; recommendations and friend taste comparison |
| `NEXT_PUBLIC_SITE_URL` | App URL for auth redirects (e.g. `http://localhost:3000`) |
| `SERIES_ADMIN_EMAILS` | Optional comma-separated emails for `/admin/series` |

Supabase has two key *types*, not one replacing the other:

- **Publishable** — safe in the browser; Row Level Security applies (replaces legacy `anon`).
- **Secret** — server/backend only; full access, bypasses RLS (replaces legacy `service_role`).

Legacy env names (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) still work if your project has not migrated yet.

### 2. Database

The remote Supabase project should already have migrations applied:

- `initial_schema` — tables, enums, indexes
- `row_level_security` — RLS policies
- `series_layer` / `series_rls` — franchise grouping (`series`, `anime_series_map`) and series-level rankings
- `recommendations_pgvector` — taste embeddings and vector search
- `friendships_update_rls` — scoped friendship update policies (apply on deploy)

SQL files are mirrored in [`supabase/migrations/`](./supabase/migrations/) for version control.

To apply on another project:

```bash
# With Supabase CLI linked to your project
supabase db push
```

Or run the SQL files in order via the SQL editor.

### 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    (app)/          # Main app shell (home, search, library, ranking, friends)
    auth/           # Login & signup (Milestone 1)
    u/[username]/   # Public profiles (Milestone 4)
    anime/[anilistId]/
  components/
  lib/
    anilist/        # AniList GraphQL client
    db/             # Drizzle schema & connection
    supabase/       # Browser, server, admin, middleware clients
  types/
    database.ts     # Supabase-generated types
supabase/
  migrations/       # Postgres schema + RLS
docs/
  design.md         # Full product & technical design
```

## Milestones (from design doc)

1. **Foundation** — Auth, onboarding, profiles, AniList search ✓
2. **Tracking** — Library, statuses, progress, anime detail ✓
3. **Ranking** — Pairwise comparisons by **series** (not individual seasons), Elo recompute, ranked list ✓ (requires `SUPABASE_SECRET_KEY`)
4. **Social** — Public profiles ✓ · Friends (requests, search, taste compare) ✓
5. **Recommendation readiness** — Embeddings + pgvector recommendations ✓ · Analytics *(later)*

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Unit tests (all `src/**/*.test.ts` — pure logic in `src/lib`) |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:studio` | Drizzle Studio (requires `DATABASE_URL`) |
| `npm run backfill:series` | Map existing anime → series via AniList relations, recompute rankings |
| `npm run backfill:embeddings` | Embed cached anime for vector search (requires `OPENAI_API_KEY`) |
| `npm run seed:catalog` | Cache + embed ~60 popular/trending titles (quick catalog boost) |
| `npm run backfill:popular` | Cache top 300 popular anime from AniList (`--metadata-only` skips embeddings; optional limit arg) |
## CI

GitHub Actions runs `lint`, `test`, `typecheck`, and `build` on push/PR (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

## Security notes

- Never commit `.env.local` or expose `SUPABASE_SECRET_KEY` to the client.
- `derived_series_rankings` has no client INSERT policy — writes use the secret key on the server.
- Rankings compare **series** (e.g. all Jujutsu Kaisen seasons/movies grouped). Set `SERIES_ADMIN_EMAILS` in `.env.local` to use `/admin/series` for overrides (or insert into `series_group_overrides` manually).
- Public profiles and lists are readable by default per MVP design; account data stays private.

## License

Private — not published.
