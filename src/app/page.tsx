import { Suspense } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLockup } from "@/components/brand/brand-mark";
import { DiscoverRow } from "@/components/home/discover-row";
import { heroPrimaryClass } from "@/components/home/hero-frame";
import { LandingHero } from "@/components/home/landing-hero";
import { RouteSkeleton } from "@/components/ui/route-skeleton";
import {
  getLatestAnime,
  getPopularAnime,
  getTrendingAnime,
  getTrendingFeature,
} from "@/lib/anilist/discover";
import { getAuthUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    num: "01",
    label: "Track",
    title: "Your watchlist, current",
    body: "Log episodes in a tap and keep every show’s status in one place.",
  },
  {
    num: "02",
    label: "Rank",
    title: "Rankings you trust",
    body: "Quick head-to-head picks sort your favorites. No agonizing over 7 vs 8.",
  },
  {
    num: "03",
    label: "Discover",
    title: "Better next picks",
    body: "Recommendations sharpen as your history and rankings grow.",
  },
] as const;

async function LandingHeroSection() {
  const feature = await getTrendingFeature();
  return <LandingHero feature={feature} />;
}

async function LandingDiscoverSection() {
  const [trending, latest, popular] = await Promise.all([
    getTrendingAnime().catch(() => []),
    getLatestAnime().catch(() => []),
    getPopularAnime().catch(() => []),
  ]);
  return (
    <>
      {trending.length > 0 ? <DiscoverRow title="Trending" items={trending} ranked /> : null}
      {latest.length > 0 ? <DiscoverRow title="Latest" items={latest} /> : null}
      {popular.length > 0 ? <DiscoverRow title="Popular" items={popular} /> : null}
    </>
  );
}

function LandingDiscoverSkeleton() {
  return (
    <RouteSkeleton label="Loading anime discovery" className="space-y-10">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="mb-4">
            <div className="skeleton h-7 w-32 rounded" />
          </div>
          <div className="-mx-4 flex gap-3 overflow-hidden px-4">
            {Array.from({ length: 8 }).map((_, j) => (
              <div key={j} className="w-29 shrink-0 sm:w-32">
                <div className="skeleton aspect-2/3 w-full rounded-lg" />
                <div className="skeleton mt-2 h-3 w-3/4 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </RouteSkeleton>
  );
}

export default async function PublicLandingPage() {
  const user = await getAuthUser();
  if (user) redirect("/home");

  return (
    <div className="cinematic relative flex min-h-svh flex-col">
      <header className="absolute top-0 right-0 left-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label={`${APP_NAME} home`} className="group min-w-0">
            <BrandLockup
              inverted
              markClassName="h-8 w-8 sm:h-9 sm:w-9"
              wordmarkClassName="text-xl sm:text-2xl"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/auth/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white sm:px-3.5"
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

      <Suspense fallback={<LandingHero feature={null} />}>
        <LandingHeroSection />
      </Suspense>

      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14 lg:px-8">
        <section className="grid border-t border-white/10 sm:grid-cols-3 sm:border-t-0">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.num}
              className={`border-b border-white/10 py-6 sm:border-b-0 sm:px-6 sm:py-2 ${
                index > 0 ? "sm:border-l" : "sm:pl-0"
              } ${index === FEATURES.length - 1 ? "sm:pr-0" : ""}`}
            >
              <p className="credit-line">
                <span className="text-accent">{feature.num}</span>
                <span className="credit-line__dot"> · </span>
                {feature.label}
              </p>
              <h2 className="mt-3 font-display text-2xl font-medium text-ink">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </section>

        <div className="space-y-10">
          <p className="credit-line">Across AniList</p>
          <Suspense fallback={<LandingDiscoverSkeleton />}>
            <LandingDiscoverSection />
          </Suspense>
        </div>

        <section className="relative overflow-hidden rounded-card border border-line bg-surface px-6 py-12 text-center sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgb(255_106_74/0.28),transparent_70%)]"
          />
          <div className="relative">
            <p className="credit-line">
              <span className="text-accent">Free</span>
              <span className="credit-line__dot"> · </span>
              Takes two minutes
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
              Start your list tonight
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Link href="/auth/login?mode=signup" className={heroPrimaryClass}>
                Create account
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
