# Suki

**Suki is an anime tracker built around one idea: a ranked list is more honest than a bunch of 1–10 scores.**

Instead of asking you to rate each show in a vacuum, Suki has you make quick head-to-head choices — *this one or that one?* — and turns those comparisons into a ranked list of your taste. It groups seasons and movies into the franchises they belong to, learns what you like, recommends what to watch next, and lets you compare taste with friends.

*(「好き」/ suki — "to like.")*

---

## What you can do

### Track what you watch
A personal library of everything you're watching, have completed, plan to watch, or dropped — with per-episode progress, statuses, and personal scores. Metadata (titles, covers, episode counts, genres) comes live from [AniList](https://anilist.co). A **Group by show** view collapses every season, movie, and OVA of a franchise into a single card, so your library reads as *shows you've watched* rather than a wall of "Season 2"s.

### Rank by taste, not by guessing
It's difficult to rate shows 1-10 consistently and accurately. Suki instead asks you to compare two series at a time and builds a ranking from your choices:

- **Series-based.** All of *Jujutsu Kaisen*'s seasons and movies are one rankable entry — you're ranking *shows*, not episodes.
- **Bradley–Terry model.** Your pairwise picks feed a statistical ranking model that also tracks **how confident** it is about each placement, so a thinly-compared series isn't presented as gospel.
- **Smart prompts.** The comparison engine actively picks the matchups that will teach it the most, so you reach a meaningful ranking in fewer taps.
- **Two views.** See your taste as a clean **ranked list** or as an **S / A / B / C / D tier board** — the screenshot-friendly version.

### Find your next watch
- **Personalized recommendations** powered by an embedding-based taste profile and vector search over a catalog of anime.
- **Mood steering.** Nudge a recommendation run by vibe — cozy, hype, something that'll wreck you — with curated presets or free text, plus an **adventurousness** control that trades safe picks for surprising ones.
- **Filters** by genre, length (movie / short / standard / long), and format.
- **"What should I watch?" shuffle.** Can't decide? Spin your plan-to-watch list — optionally constrained by how much time you have — and get one pick.

### Keep up with what's airing
A Home tracker for the currently-airing shows you're watching: next-episode countdowns, an "episodes behind" badge, and a one-tap **+1 episode** that auto-completes a show when you finish it.

### Compare taste with friends
- **Public taste profiles** at `/u/:username` — top-ranked series, stats, and recent activity.
- **Friends** with requests and search.
- **Taste compare.** Line up your ranking against a friend's to see where you agree and clash.
- **Recommend to a friend.** Generate a shared pick the two of you are both likely to enjoy, with modes like *best shared match*, *short watch*, or *new to both*.
- **Activity feed.** A lightweight, ambient feed of what friends have completed, ranked, or added — high-signal only, with privacy controls.

### Share your taste
Profile and ranking links unfurl into a generated **taste card** (avatar, top-ranked covers, top genres) in Discord, Twitter, and iMessage — plus an in-app share button.

### Bring your list with you
Import an existing list so you don't start from an empty library:
- **AniList** by username (live, exact matching — the smoothest path)
- **MyAnimeList** XML export
- **Plain text** — paste one title per line, with a review step for fuzzy matches

Imported scores are informational; Suki re-ranks everything through its own comparisons.

---

## How it's built

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS**
- **Supabase** Postgres with Row Level Security, plus Supabase Auth
- **Drizzle** for typed queries; **pgvector** for recommendation search
- **OpenAI embeddings** for taste profiles and recommendations
- **AniList GraphQL API** for anime metadata

Privacy by design: profiles and lists are public by default, but account data stays private and Row Level Security is enforced at the database. Rankings are computed server-side with a key that never reaches the browser.

## Local browser tests

The end-to-end suite runs against a local Supabase stack and deterministic AniList/OpenAI stubs. Start Docker Desktop, install Chromium once with `npx playwright install chromium`, then run:

```bash
npm run test:e2e
```

Use `npm run test:e2e:headed` to watch the browser or `npm run test:e2e:ui` for Playwright UI mode. The runner refuses to reset anything unless the Supabase API and database both resolve to the local loopback ports.
