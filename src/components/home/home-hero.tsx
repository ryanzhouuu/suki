import Link from "next/link";

import { HeroBackground } from "@/components/home/hero-background";
import type { HeroHeadline } from "@/lib/home/hero-copy";

type HomeHeroProps = {
  greetingName: string;
  watchingCount: number;
  headline: HeroHeadline;
  bgSrc: string;
};

export function HomeHero({
  greetingName,
  watchingCount,
  headline,
  bgSrc,
}: HomeHeroProps) {
  return (
    <section className="home-hero animate-rise overflow-hidden rounded-card border border-line/40 shadow-[0_24px_60px_-32px_rgb(var(--shadow-color)/0.55)]" style={{ minHeight: "62vh" }}>
      <HeroBackground src={bgSrc} variant="card" />

      <span className="home-hero__mark" aria-hidden>
        好
      </span>

      <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-8 pt-10 sm:px-10 sm:pb-12 sm:pt-14" style={{ minHeight: "62vh" }}>
        <p className="eyebrow truncate">Welcome back, {greetingName}</p>
        <h1 className="mt-2 max-w-xl text-balance text-[1.75rem] font-semibold leading-[1.08] text-[#f1e9da] sm:text-4xl sm:leading-[1.02] lg:text-[3.25rem]">
          {headline.lead}{" "}
          <span className="italic text-accent">{headline.emphasis}</span>
          {headline.trailing ? (
            <span className="text-accent">{headline.trailing}</span>
          ) : (
            <span className="text-accent">.</span>
          )}
        </h1>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-[rgba(241,233,218,0.72)]">
          {headline.description}
        </p>

        {watchingCount > 0 ? (
          <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {watchingCount} {watchingCount === 1 ? "show" : "shows"} in progress
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:translate-y-px"
          >
            Search anime
          </Link>
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/18 hover:text-white"
          >
            Open ranking
          </Link>
        </div>
      </div>
    </section>
  );
}
