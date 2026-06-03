import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

type LandingHeroProps = {
  backdropUrls?: string[];
};

export function LandingHero({ backdropUrls = [] }: LandingHeroProps) {
  const covers = backdropUrls.slice(0, 6);
  const doubledCovers =
    covers.length > 0 ? [...covers, ...covers] : [];

  return (
    <section className="home-hero animate-rise overflow-hidden rounded-card border border-line bg-surface/70 shadow-[0_24px_60px_-32px_rgb(var(--shadow-color)/0.35)] backdrop-blur-sm">
      <div className="home-hero__bg" aria-hidden>
        {doubledCovers.length > 0 ? (
          <div className="home-hero__covers">
            {doubledCovers.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${index}`}
                src={url}
                alt=""
                className="home-hero__cover"
              />
            ))}
          </div>
        ) : null}
        <div className="home-hero__orb home-hero__orb--1" />
        <div className="home-hero__orb home-hero__orb--2" />
        <div className="home-hero__orb home-hero__orb--3" />
        <div className="home-hero__mesh" />
        <div className="home-hero__hatch" />
        <span className="home-hero__mark">好</span>
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-10 sm:py-14">
        <p className="eyebrow">Track anime with less friction</p>
        <h1 className="mt-2 max-w-xl text-balance text-[1.75rem] font-semibold leading-[1.08] sm:text-4xl sm:leading-[1.02] lg:text-[3.25rem]">
          Keep track, rank clearly, and{" "}
          <span className="italic text-accent">find what is next</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted">
          {APP_NAME} gives you one place to manage your watchlist, record
          episode progress, and build rankings through quick head-to-head picks.
        </p>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link
            href="/auth/login?mode=signup"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:translate-y-px"
          >
            Create account
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper/85 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
