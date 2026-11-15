import { CONFIDENCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type {
  ProfileLibraryStats,
  ProfileRankingStats,
  ProfileTasteSummary,
  ProfileWatchStyle,
} from "@/lib/profiles/stats";

type ProfileStatsPanelProps = {
  library: ProfileLibraryStats;
  taste: ProfileTasteSummary;
  ranking: ProfileRankingStats;
  watchStyle: ProfileWatchStyle;
  activitySlot?: React.ReactNode;
};

/** A titled block of the stats grid. Whitespace, not a card, separates blocks. */
export function StatsBlock({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h3 className="border-b border-line pb-3 font-display text-xl font-medium text-ink">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** One labelled row with a proportional bar underneath. */
function BarRow({
  label,
  value,
  pct,
  barClassName = "bg-accent",
}: {
  label: React.ReactNode;
  value: string | number;
  pct: number;
  barClassName?: string;
}) {
  return (
    <li className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink">{label}</span>
        <span className="tabular-nums text-muted">{value}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
    </li>
  );
}

const CONFIDENCE_BAR: Record<"high" | "medium" | "low", string> = {
  high: "bg-success",
  medium: "bg-accent",
  low: "bg-faint",
};

export function ProfileStatsPanel({
  library,
  taste,
  ranking,
  watchStyle,
  activitySlot,
}: ProfileStatsPanelProps) {
  const libraryStatuses = [
    { key: "watching" as const, label: STATUS_LABELS.watching },
    { key: "completed" as const, label: STATUS_LABELS.completed },
    { key: "plan_to_watch" as const, label: STATUS_LABELS.plan_to_watch },
    { key: "paused" as const, label: STATUS_LABELS.paused },
    { key: "dropped" as const, label: STATUS_LABELS.dropped },
  ].filter((s) => library[s.key] > 0);

  const confidenceEntries = (["high", "medium", "low"] as const).filter(
    (level) => ranking.confidence[level] > 0,
  );

  const startedGenres = watchStyle.genreCompletionRates.filter((g) => g.started > 0);
  const hasWatchStyle =
    watchStyle.topFormats.length > 0 ||
    watchStyle.totalEpisodesWatched > 0 ||
    watchStyle.shortSeriesShare !== null ||
    startedGenres.length > 0;

  const hasAnyStats =
    library.total > 0 ||
    taste.topGenres.length > 0 ||
    ranking.totalRanked > 0 ||
    hasWatchStyle;

  if (!hasAnyStats) {
    return (
      <p className="border-y border-line py-10 text-center text-sm text-muted">
        No library or ranking data yet. Start tracking anime to build a taste
        profile.
      </p>
    );
  }

  const headlineMetrics: { value: string | number; label: string; accent?: boolean }[] =
    [];
  if (library.total > 0)
    headlineMetrics.push({ value: library.total, label: "Tracked" });
  if (library.completed > 0)
    headlineMetrics.push({ value: library.completed, label: "Completed" });
  if (watchStyle.totalEpisodesWatched > 0)
    headlineMetrics.push({
      value: watchStyle.totalEpisodesWatched.toLocaleString(),
      label: "Episodes",
    });
  if (ranking.totalRanked > 0)
    headlineMetrics.push({ value: ranking.totalRanked, label: "Ranked" });
  if (taste.averagePersonalScore !== null)
    headlineMetrics.push({
      value: taste.averagePersonalScore,
      label: "Avg score",
      accent: true,
    });
  if (watchStyle.shortSeriesShare !== null)
    headlineMetrics.push({
      value: `${watchStyle.shortSeriesShare}%`,
      label: "Short series",
    });

  const topGenreCount = Math.max(1, ...taste.topGenres.map((g) => g.count));
  const topFormatCount = Math.max(1, ...watchStyle.topFormats.map((f) => f.count));

  return (
    <div className="min-w-0 space-y-12">
      {headlineMetrics.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-line py-6 sm:grid-cols-3 lg:grid-cols-5">
          {headlineMetrics.slice(0, 5).map((metric) => (
            <div key={metric.label} className="flex min-w-0 flex-col-reverse">
              <dt className="mt-2 text-sm text-muted">{metric.label}</dt>
              <dd
                className={`font-display text-4xl font-medium tabular-nums leading-none sm:text-5xl ${
                  metric.accent ? "text-accent" : "text-ink"
                }`}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="grid min-w-0 gap-x-12 gap-y-12 lg:grid-cols-2">
        {taste.topGenres.length > 0 ? (
          <StatsBlock title="Top genres">
            <ul className="space-y-3">
              {taste.topGenres.map((g) => (
                <BarRow
                  key={g.genre}
                  label={g.genre}
                  value={g.count}
                  pct={(g.count / topGenreCount) * 100}
                  barClassName="bg-white/55"
                />
              ))}
            </ul>
          </StatsBlock>
        ) : null}

        {hasWatchStyle ? (
          <StatsBlock title="How they watch">
            <div className="space-y-6">
              {watchStyle.topFormats.length > 0 ? (
                <ul className="space-y-3">
                  {watchStyle.topFormats.map((f) => (
                    <BarRow
                      key={f.format}
                      label={f.format}
                      value={f.count}
                      pct={(f.count / topFormatCount) * 100}
                      barClassName="bg-white/30"
                    />
                  ))}
                </ul>
              ) : null}

              {startedGenres.length > 0 ? (
                <div>
                  <p className="mb-3 text-sm text-muted">Completion by genre</p>
                  <ul className="space-y-3">
                    {startedGenres.map((g) => (
                      <BarRow key={g.genre} label={g.genre} value={`${g.rate}%`} pct={g.rate} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </StatsBlock>
        ) : null}

        {libraryStatuses.length > 0 ? (
          <StatsBlock title="Status breakdown">
            <ul className="space-y-3">
              {libraryStatuses.map((status) => (
                <BarRow
                  key={status.key}
                  label={status.label}
                  value={library[status.key]}
                  pct={(library[status.key] / library.total) * 100}
                  barClassName="bg-white/40"
                />
              ))}
            </ul>
          </StatsBlock>
        ) : null}

        {ranking.totalRanked > 0 && confidenceEntries.length > 0 ? (
          <StatsBlock title="Confidence">
            <ul className="space-y-3">
              {confidenceEntries.map((level) => (
                <BarRow
                  key={level}
                  label={CONFIDENCE_LABELS[level]}
                  value={ranking.confidence[level]}
                  pct={(ranking.confidence[level] / ranking.totalRanked) * 100}
                  barClassName={CONFIDENCE_BAR[level]}
                />
              ))}
            </ul>
          </StatsBlock>
        ) : null}

        {activitySlot}
      </div>
    </div>
  );
}
