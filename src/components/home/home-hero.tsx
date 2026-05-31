import Link from "next/link";

type HomeHeroProps = {
  greetingName: string;
  watchingCount: number;
  backdropUrls?: string[];
};

export function HomeHero({
  greetingName,
  watchingCount,
  backdropUrls = [],
}: HomeHeroProps) {
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

      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14">
        <p className="eyebrow">Welcome back, {greetingName}</p>
        <h1 className="mt-2 max-w-xl text-balance text-4xl font-semibold leading-[1.02] sm:text-[3.25rem] sm:leading-[1.02]">
          Pick up right where you{" "}
          <span className="italic text-accent">left off</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted">
          Track what you watch, build a watchlist, and shape a ranking you
          actually trust — one quick comparison at a time.
        </p>

        {watchingCount > 0 ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper/80 px-3.5 py-1.5 text-sm text-muted backdrop-blur-sm">
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
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper/85 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            Open ranking
          </Link>
        </div>
      </div>
    </section>
  );
}
