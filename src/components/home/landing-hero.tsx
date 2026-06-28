import Link from "next/link";

import { HeroBackground } from "@/components/home/hero-background";
import { APP_NAME } from "@/lib/constants";

type LandingHeroProps = {
  bgSrc: string;
};

export function LandingHero({ bgSrc }: LandingHeroProps) {
  return (
    <section className="home-hero home-hero--splash animate-rise overflow-hidden">
      <HeroBackground src={bgSrc} variant="splash" />

      <span className="home-hero__mark" aria-hidden>
        好
      </span>

      <div className="relative z-10 px-4 pb-12 pt-28 sm:px-10 sm:pb-20 sm:pt-32">
        <p className="eyebrow">Track anime with less friction</p>
        <h1 className="mt-2 max-w-xl text-balance text-[1.75rem] font-semibold leading-[1.08] text-[#f1e9da] sm:text-4xl sm:leading-[1.02] lg:text-[3.25rem]">
          Keep track, rank clearly, and{" "}
          <span className="italic text-accent">find what is next</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-[rgba(241,233,218,0.72)]">
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
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/18 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
