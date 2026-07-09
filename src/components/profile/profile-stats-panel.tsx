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

function HeadlineMetric({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="profile-metric">
      <p
        className={`font-display text-3xl font-semibold tabular-nums leading-none sm:text-4xl ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
    </div>
  );
}

function BentoCard({
  eyebrow,
  title,
  className = "",
  children,
}: {
  eyebrow: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-card border border-line bg-surface p-5 shadow-[0_16px_28px_-26px_rgb(var(--shadow-color)/0.5)] sm:p-6 ${className}`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

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

  const hasWatchStyle =
    watchStyle.topFormats.length > 0 ||
    watchStyle.totalEpisodesWatched > 0 ||
    watchStyle.shortSeriesShare !== null ||
    watchStyle.genreCompletionRates.some((g) => g.started > 0);

  const hasAnyStats =
    library.total > 0 ||
    taste.topGenres.length > 0 ||
    ranking.totalRanked > 0 ||
    hasWatchStyle;

  if (!hasAnyStats) {
    return (
      <section className="rounded-card border border-dashed border-line-strong bg-surface/50 p-8 text-center">
        <p className="text-sm text-muted">
          No library or ranking data yet. Start tracking anime to build a taste
          profile.
        </p>
      </section>
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

  return (
    <div className="min-w-0 space-y-4">
      {headlineMetrics.length > 0 ? (
        <section className="profile-metric-strip">
          {headlineMetrics.slice(0, 5).map((metric) => (
            <HeadlineMetric key={metric.label} {...metric} />
          ))}
        </section>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {taste.topGenres.length > 0 ? (
          <BentoCard
            eyebrow="Taste"
            title="Top genres"
            className="xl:col-span-3"
          >
            <ul className="flex flex-wrap gap-2">
              {taste.topGenres.map((g) => (
                <li
                  key={g.genre}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-sm text-ink"
                >
                  {g.genre}
                  <span className="text-xs text-muted">{g.count}</span>
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}

        {hasWatchStyle ? (
          <BentoCard
            eyebrow="Watch style"
            title="How they watch"
            className="xl:col-span-3"
          >
            <div className="space-y-3">
              {watchStyle.topFormats.length > 0 ? (
                <ul className="space-y-1.5">
                  {watchStyle.topFormats.map((f) => (
                    <li
                      key={f.format}
                      className="flex items-center justify-between rounded-lg bg-surface-2/70 px-2.5 py-1.5 text-sm"
                    >
                      <span className="text-ink">{f.format}</span>
                      <span className="tabular-nums text-muted">{f.count}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {watchStyle.genreCompletionRates.some((g) => g.started > 0) ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Completion by genre
                  </p>
                  <ul className="space-y-1.5">
                    {watchStyle.genreCompletionRates
                      .filter((g) => g.started > 0)
                      .map((g) => (
                        <li key={g.genre} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-ink">{g.genre}</span>
                            <span className="tabular-nums text-muted">
                              {g.rate}%
                            </span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.max(8, g.rate)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </BentoCard>
        ) : null}

        {libraryStatuses.length > 0 ? (
          <BentoCard
            eyebrow="Library"
            title="Status breakdown"
            className="xl:col-span-3"
          >
            <ul className="space-y-1.5">
              {libraryStatuses.map((status) => {
                const pct = Math.round(
                  (library[status.key] / library.total) * 100,
                );
                return (
                  <li key={status.key} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ink">{status.label}</span>
                      <span className="tabular-nums text-muted">
                        {library[status.key]}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent/70"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </BentoCard>
        ) : null}

        {ranking.totalRanked > 0 && confidenceEntries.length > 0 ? (
          <BentoCard
            eyebrow="Ranking"
            title="Confidence"
            className="xl:col-span-3"
          >
            <ul className="space-y-2">
              {confidenceEntries.map((level) => (
                <li
                  key={level}
                  className="rounded-lg bg-surface-2/70 px-2.5 py-1.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-ink">
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${
                          level === "high"
                            ? "bg-success"
                            : level === "medium"
                              ? "bg-accent"
                              : "bg-faint"
                        }`}
                      />
                      {CONFIDENCE_LABELS[level]}
                    </span>
                    <span className="tabular-nums text-muted">
                      {ranking.confidence[level]}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full ${
                        level === "high"
                          ? "bg-success"
                          : level === "medium"
                            ? "bg-accent"
                            : "bg-faint"
                      }`}
                      style={{
                        width: `${Math.max(
                          12,
                          Math.round(
                            (ranking.confidence[level] / ranking.totalRanked) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}

        {activitySlot}
      </div>
    </div>
  );
}
