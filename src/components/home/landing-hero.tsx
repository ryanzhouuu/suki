import Link from "next/link";

import { CreditLine } from "@/components/home/credit-line";
import { heroGhostClass, heroPrimaryClass, HeroFrame } from "@/components/home/hero-frame";
import type { TrendingFeature } from "@/lib/anilist/discover";
import { titleCredit } from "@/lib/home/featured";

const SUPPORTING =
  "Log episodes as you go, settle your favorites with quick head-to-head picks, and find what to watch next.";

/** Signed-out hero. Without a trending feature it stays text-only on the dark ground. */
export function LandingHero({ feature }: { feature: TrendingFeature | null }) {
  return (
    <HeroFrame src={feature?.bannerUrl ?? null} edge="page">
      <div className="max-w-2xl">
        <CreditLine
          onArt
          parts={[
            { text: "Track", tone: "accent" },
            { text: "Rank", tone: "accent" },
            { text: "Discover", tone: "accent" },
          ]}
        />
        <h1 className="mt-3 max-w-3xl text-balance font-display text-4xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-[4.5rem]">
          Every show you watch, <em className="italic text-accent">in order.</em>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          {SUPPORTING}
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link href="/auth/login?mode=signup" className={heroPrimaryClass}>
            Create free account
          </Link>
          <Link href="/auth/login" className={heroGhostClass}>
            Sign in
          </Link>
        </div>
      </div>
      {feature ? (
        <div className="lg:max-w-sm lg:shrink-0 lg:text-right">
          <CreditLine
            onArt
            parts={[
              { text: "Now trending" },
              { text: `#${feature.rank} this week`, tone: "strong" },
            ]}
          />
          <div className="mt-2">
            <CreditLine onArt parts={titleCredit(feature)} />
          </div>
        </div>
      ) : null}
    </HeroFrame>
  );
}
