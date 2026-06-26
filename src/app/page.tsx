import { Suspense } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { DiscoverRow } from "@/components/home/discover-row";
import { LandingHero } from "@/components/home/landing-hero";
import { getLatestAnime, getPopularAnime } from "@/lib/anilist/discover";
import { getAuthUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    eyebrow: "Track",
    title: "Keep your watchlist current",
    body: "Update episode progress, mark completions, and manage watching states in one workflow.",
  },
  {
    eyebrow: "Rank",
    title: "Build rankings with confidence",
    body: "Use quick pairwise comparisons to sort series without relying on broad, hard-to-compare scores.",
  },
  {
    eyebrow: "Discover",
    title: "Get better recommendations",
    body: "Discovery and taste comparisons improve as your watch history and rankings become more complete.",
  },
] as const;

// ——— Streaming section ———

async function LandingDiscoverSection() {
  const [latest, popular] = await Promise.all([
    getLatestAnime().catch(() => []),
    getPopularAnime().catch(() => []),
  ]);
  return (
    <>
      {latest.length > 0 ? (
        <div className="animate-rise [animation-delay:240ms]">
          <DiscoverRow eyebrow="Browse" title="Latest anime" items={latest} />
        </div>
      ) : null}
      {popular.length > 0 ? (
        <div className="animate-rise [animation-delay:300ms]">
          <DiscoverRow eyebrow="Browse" title="Popular now" items={popular} />
        </div>
      ) : null}
    </>
  );
}

function LandingDiscoverSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1].map((i) => (
        <div key={i}>
          <div className="mb-4">
            <div className="h-3 w-14 animate-pulse rounded bg-surface-2" />
            <div className="mt-1 h-7 w-32 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="-mx-4 flex gap-3 overflow-hidden px-4">
            {Array.from({ length: 8 }).map((_, j) => (
              <div key={j} className="w-29 shrink-0 sm:w-32">
                <div className="aspect-2/3 w-full animate-pulse rounded-lg bg-surface-2" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ——— Page ———

export default async function PublicLandingPage() {
  const user = await getAuthUser();
  if (user) redirect("/home");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-paper/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base font-semibold text-on-accent shadow-sm transition-transform group-hover:-rotate-6">
              好
            </span>
            <span className="truncate font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/auth/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:px-3.5"
            >
              Sign in
            </Link>
            <Link
              href="/auth/login?mode=signup"
              className="rounded-full bg-accent px-3.5 py-2 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong sm:px-4"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 space-y-10 px-4 py-6 pb-12 sm:space-y-14 sm:py-10 sm:pb-16">
        {/* Hero renders immediately — no backdrop needed for initial paint */}
        <LandingHero />

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.eyebrow}
              className="animate-rise rounded-card border border-line bg-surface p-6 shadow-[0_12px_40px_-28px_rgb(var(--shadow-color)/0.35)]"
              style={{ animationDelay: `${60 + index * 60}ms` }}
            >
              <p className="eyebrow">{feature.eyebrow}</p>
              <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.body}
              </p>
            </article>
          ))}
        </section>

        <Suspense fallback={<LandingDiscoverSkeleton />}>
          <LandingDiscoverSection />
        </Suspense>

        <section className="animate-rise rounded-card border border-accent/35 bg-linear-to-br from-accent-soft via-surface to-surface p-6 text-center sm:p-10 [animation-delay:360ms]">
          <p className="eyebrow">Get started in minutes</p>
          <h2 className="mt-2 text-balance font-display text-xl font-medium text-ink sm:text-3xl">
            Create your account and start tracking
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Join for free, import your first shows, and start building a
            ranking that reflects your actual preferences.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/auth/login?mode=signup"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong"
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper/85 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
