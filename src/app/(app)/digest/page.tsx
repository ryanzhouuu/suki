import { after } from "next/server";

import { markDigestViewed } from "@/actions/digest";
import { AnimePoster } from "@/components/anime/anime-poster";
import { DigestActionLink } from "@/components/digest/digest-action-link";
import { formatDigestWeek } from "@/components/digest/weekly-digest-card";
import { WidePageFrame } from "@/components/layout/page-frame";
import { requireProfile } from "@/lib/auth/session";
import {
  getDigestFriendHighlights,
  getDigestNextAction,
} from "@/lib/digest/live";
import {
  getDevelopmentDigestPreview,
  getOrCreateLatestDigest,
  isDevelopmentDigestPreview,
  resolveDigestHighlights,
} from "@/lib/digest/snapshot";

const statLabels = {
  episodesWatched: "Episodes watched",
  titlesStarted: "Titles started",
  titlesCompleted: "Titles completed",
  comparisons: "Ranking comparisons",
} as const;

export default async function DigestPage() {
  const { user, profile } = await requireProfile();
  const storedDigest = await getOrCreateLatestDigest(user.id, profile.timezone);
  const digest =
    storedDigest ??
    (process.env.NODE_ENV === "development"
      ? await getDevelopmentDigestPreview(user.id, profile.timezone)
      : null);

  if (!digest) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="eyebrow">Weekly digest</p>
        <h1 className="mt-2 text-3xl font-semibold">Your first recap is brewing</h1>
        <p className="mt-3 text-muted">
          Come back after the first full week of activity tracking.
        </p>
      </div>
    );
  }

  const isPreview = isDevelopmentDigestPreview(digest);
  if (!isPreview) {
    after(() => markDigestViewed(digest.id).catch(() => undefined));
  }
  const [highlights, friendHighlights, nextAction] = await Promise.all([
    resolveDigestHighlights(digest).catch(() => []),
    getDigestFriendHighlights(digest).catch(() => []),
    getDigestNextAction(user.id),
  ]);
  const weekLabel = formatDigestWeek(digest.week_start, digest.week_end);
  const stats = Object.entries(digest.summary.totals)
    .filter(([key]) => key !== "recommendationInteractions")
    .flatMap(([key, value]) =>
      value == null
        ? []
        : [{ label: statLabels[key as keyof typeof statLabels], value }],
    );

  return (
    <WidePageFrame>
      <article className="mx-auto max-w-6xl">
        <header className="animate-rise border-y-[3px] border-ink py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-4xl leading-none text-accent">
                週
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] uppercase">
                  The Suki Weekly
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Personal edition · {weekLabel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted uppercase">
                Week in review
              </p>
              <p className="mt-1 font-mono text-[0.65rem] text-faint">
                No. {digest.week_start.replaceAll("-", "")}
              </p>
            </div>
          </div>

          <div className="grid gap-7 py-7 sm:py-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.65fr)] lg:items-end lg:gap-12">
            <div>
              {isPreview ? (
                <p className="mb-4 inline-flex border border-accent px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.16em] text-accent uppercase">
                  Development preview
                </p>
              ) : null}
              <h1 className="max-w-4xl text-balance font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.84] font-semibold tracking-[-0.055em]">
                {digest.summary.quiet ? (
                  <>
                    A fresh week
                    <br />
                    <span className="text-accent italic">awaits.</span>
                  </>
                ) : (
                  <>
                    Your week,
                    <br />
                    <span className="text-accent italic">in motion.</span>
                  </>
                )}
              </h1>
            </div>
            <div className="border-l-2 border-accent pl-5">
              <p className="font-display text-xl leading-snug italic sm:text-2xl">
                “Small updates become a story when you look back.”
              </p>
              <p className="mt-4 text-sm leading-6 text-muted">
                A stable record of what you watched, finished, and discovered
                during the last completed week.
              </p>
            </div>
          </div>
        </header>

        {!digest.summary.quiet && stats.some((stat) => stat.value > 0) ? (
          <section
            aria-labelledby="your-week-heading"
            className="animate-rise border-b border-ink py-8 [animation-delay:60ms] sm:py-10"
          >
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">By the numbers</p>
                <h2
                  id="your-week-heading"
                  className="mt-1 font-display text-3xl font-semibold sm:text-4xl"
                >
                  The week at a glance
                </h2>
              </div>
              <p className="hidden max-w-xs text-right text-xs leading-5 text-muted sm:block">
                Only reliable activity is counted. Imports and routine edits
                stay out of the record.
              </p>
            </div>
            <dl className="grid border-y border-line sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`relative px-4 py-5 sm:min-h-36 sm:px-5 sm:py-6 ${
                    index > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""
                  } ${index === 0 ? "bg-accent-soft" : "bg-surface"}`}
                >
                  <dt className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted uppercase">
                    {stat.label}
                  </dt>
                  <dd
                    className={`mt-4 font-display leading-none font-semibold ${
                      index === 0
                        ? "text-6xl text-accent sm:text-7xl"
                        : "text-5xl text-ink sm:text-6xl"
                    }`}
                  >
                    {stat.value}
                  </dd>
                  <span className="absolute right-3 bottom-2 font-mono text-[0.6rem] text-faint">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {highlights.length > 0 ? (
          <section
            aria-labelledby="highlights-heading"
            className="animate-rise border-b border-ink py-8 [animation-delay:120ms] sm:py-12"
          >
            <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="eyebrow">Cover stories</p>
                <h2
                  id="highlights-heading"
                  className="mt-1 font-display text-4xl font-semibold sm:text-5xl"
                >
                  Titles that defined the week
                </h2>
              </div>
              <p className="text-sm text-muted">
                Completed first, then started and progressed.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr]">
              {highlights.map((highlight, index) => {
                const title =
                  highlight.anime.english_title || highlight.anime.romaji_title;
                return (
                  <li key={highlight.animeId}>
                    <DigestActionLink
                      digestId={digest.id}
                      section="highlights"
                      actionKind={highlight.kind}
                      href={`/anime/${highlight.anime.anilist_id}`}
                      className={`group relative flex h-full overflow-hidden border border-line bg-surface transition-all hover:-translate-y-1 hover:border-accent hover:shadow-[0_20px_45px_-30px_rgb(var(--shadow-color)/0.5)] ${
                        index === 0
                          ? "min-h-80 flex-col sm:flex-row lg:flex-col"
                          : "min-h-64 flex-col"
                      }`}
                    >
                      <div
                        className={
                          index === 0
                            ? "w-full shrink-0 sm:w-2/5 lg:w-full"
                            : "w-full"
                        }
                      >
                        <AnimePoster
                          src={highlight.anime.cover_image_url}
                          alt={title}
                          fill
                          className={`rounded-none transition-transform duration-500 group-hover:scale-[1.025] ${
                            index === 0 ? "sm:h-full lg:h-auto" : ""
                          }`}
                        />
                      </div>
                      <div className="flex flex-1 flex-col border-t border-line p-5 sm:border-t-0 sm:border-l lg:border-t lg:border-l-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-accent uppercase">
                            {highlight.kind}
                          </p>
                          <p className="font-mono text-[0.65rem] text-faint">
                            0{index + 1}
                          </p>
                        </div>
                        <h3
                          className={`mt-3 font-display leading-tight font-semibold ${
                            index === 0 ? "text-3xl" : "text-2xl"
                          }`}
                        >
                          {title}
                        </h3>
                        <p className="mt-auto pt-5 text-sm text-muted">
                          {highlight.progressDelta
                            ? `Moved forward by ${highlight.progressDelta} episodes.`
                            : highlight.kind === "completed"
                              ? "A finished story for this week’s record."
                              : "A new story entered your rotation."}
                        </p>
                      </div>
                    </DigestActionLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className="grid border-b border-ink lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
          <div className="space-y-10 py-9 lg:border-r lg:border-line lg:pr-10">
            {friendHighlights.length > 0 ? (
              <section aria-labelledby="friends-week-heading">
                <p className="eyebrow">The social column</p>
                <h2
                  id="friends-week-heading"
                  className="mt-1 font-display text-3xl font-semibold"
                >
                  Friends’ week
                </h2>
                <ul className="mt-5 border-t border-line">
                  {friendHighlights.map((item, index) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-line py-4"
                    >
                      <span className="font-mono text-xs text-accent">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {item.actor.displayName || item.actor.username}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {item.kind === "completed"
                            ? "Completed"
                            : item.kind === "ranked"
                              ? "Ranked"
                              : "Added"}{" "}
                          {item.refs.map((ref) => ref.title).join(", ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {digest.summary.totals.recommendationInteractions > 0 ? (
              <section
                aria-labelledby="recommendations-heading"
                className="border-l-4 border-accent bg-accent-soft px-5 py-4"
              >
                <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-accent uppercase">
                  Discovery desk
                </p>
                <h2
                  id="recommendations-heading"
                  className="mt-2 font-display text-2xl font-semibold"
                >
                  Recommendations explored
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                  You opened or added{" "}
                  <span className="font-semibold text-ink">
                    {digest.summary.totals.recommendationInteractions} distinct
                    recommendation
                    {digest.summary.totals.recommendationInteractions === 1
                      ? ""
                      : "s"}
                  </span>{" "}
                  this week.
                </p>
              </section>
            ) : null}
          </div>

          <section
            aria-labelledby="next-up-heading"
            className="relative overflow-hidden bg-ink px-6 py-9 text-paper sm:px-8 lg:px-9 lg:py-12"
          >
            <div
              aria-hidden
              className="absolute -right-12 -bottom-20 font-display text-[16rem] leading-none text-paper/5"
            >
              →
            </div>
            <div className="relative flex h-full min-h-72 flex-col">
              <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-paper/60 uppercase">
                Editor’s pick · Next up
              </p>
              <h2
                id="next-up-heading"
                className="mt-6 text-balance font-display text-4xl leading-[0.98] font-semibold sm:text-5xl"
              >
                {nextAction.title}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-paper/65">
                {nextAction.description}
              </p>
              <DigestActionLink
                digestId={digest.id}
                section="next_up"
                actionKind={nextAction.kind}
                href={nextAction.href}
                className="group mt-auto flex w-fit items-center gap-3 border-b-2 border-accent pt-10 pb-1 text-sm font-semibold text-paper"
              >
                Follow this story
                <span
                  aria-hidden
                  className="text-xl text-accent transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </DigestActionLink>
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-2 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>The Suki Weekly · A private recap made only for you.</p>
          <p>{digest.timezone} · Monday through Sunday</p>
        </footer>
      </article>
    </WidePageFrame>
  );
}
