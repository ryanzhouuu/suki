import { after } from "next/server";

import { markDigestViewed } from "@/actions/digest";
import { AnimePoster } from "@/components/anime/anime-poster";
import { DigestActionLink } from "@/components/digest/digest-action-link";
import { formatDigestWeek } from "@/components/digest/weekly-digest-card";
import { requireProfile } from "@/lib/auth/session";
import {
  getDigestFriendHighlights,
  getDigestNextAction,
} from "@/lib/digest/live";
import {
  getOrCreateLatestDigest,
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
  const digest = await getOrCreateLatestDigest(user.id, profile.timezone);

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

  after(() => markDigestViewed(digest.id).catch(() => undefined));
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
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="rounded-card border border-accent/25 bg-linear-to-br from-accent-soft via-surface to-surface p-6 sm:p-9">
        <p className="eyebrow">Your week · {weekLabel}</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">
          {digest.summary.quiet
            ? "A fresh week is ready when you are"
            : "Here’s what moved your list forward"}
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          A stable recap of your completed Monday-to-Sunday week.
        </p>
      </header>

      {!digest.summary.quiet && stats.some((stat) => stat.value > 0) ? (
        <section aria-labelledby="your-week-heading">
          <h2 id="your-week-heading" className="text-2xl font-semibold">
            Your week
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-card border border-line bg-surface p-4"
              >
                <dd className="text-3xl font-semibold text-accent">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-sm text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {highlights.length > 0 ? (
        <section aria-labelledby="highlights-heading">
          <h2 id="highlights-heading" className="text-2xl font-semibold">
            Highlights
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {highlights.map((highlight) => {
              const title =
                highlight.anime.english_title || highlight.anime.romaji_title;
              return (
                <li key={highlight.animeId}>
                  <DigestActionLink
                    digestId={digest.id}
                    section="highlights"
                    actionKind={highlight.kind}
                    href={`/anime/${highlight.anime.anilist_id}`}
                    className="flex h-full gap-3 rounded-card border border-line bg-surface p-3 transition-colors hover:border-accent"
                  >
                    <AnimePoster
                      src={highlight.anime.cover_image_url}
                      alt={title}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium">{title}</p>
                      <p className="mt-1 text-xs capitalize text-muted">
                        {highlight.kind}
                        {highlight.progressDelta
                          ? ` · +${highlight.progressDelta} episodes`
                          : ""}
                      </p>
                    </div>
                  </DigestActionLink>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {friendHighlights.length > 0 ? (
        <section aria-labelledby="friends-week-heading">
          <h2 id="friends-week-heading" className="text-2xl font-semibold">
            Friends’ week
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {friendHighlights.map((item) => (
              <li
                key={item.id}
                className="rounded-card border border-line bg-surface p-4"
              >
                <p className="font-medium">
                  {item.actor.displayName || item.actor.username}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {item.kind === "completed"
                    ? "Completed"
                    : item.kind === "ranked"
                      ? "Ranked"
                      : "Added"}{" "}
                  {item.refs.map((ref) => ref.title).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {digest.summary.totals.recommendationInteractions > 0 ? (
        <section
          aria-labelledby="recommendations-heading"
          className="rounded-card border border-line bg-surface p-5"
        >
          <h2 id="recommendations-heading" className="text-xl font-semibold">
            Recommendations
          </h2>
          <p className="mt-2 text-sm text-muted">
            You explored {digest.summary.totals.recommendationInteractions}{" "}
            distinct recommendation
            {digest.summary.totals.recommendationInteractions === 1 ? "" : "s"}.
          </p>
        </section>
      ) : null}

      <section
        aria-labelledby="next-up-heading"
        className="rounded-card border border-accent/30 bg-accent-soft p-6"
      >
        <p className="eyebrow">Next up</p>
        <h2 id="next-up-heading" className="mt-2 text-2xl font-semibold">
          {nextAction.title}
        </h2>
        <p className="mt-2 text-sm text-muted">{nextAction.description}</p>
        <DigestActionLink
          digestId={digest.id}
          section="next_up"
          actionKind={nextAction.kind}
          href={nextAction.href}
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          Go →
        </DigestActionLink>
      </section>
    </div>
  );
}
