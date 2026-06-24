import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { ProfileActivity } from "@/lib/profiles/stats";

type ProfileActivityPanelProps = {
  activity: ProfileActivity;
  isOwnProfile: boolean;
  className?: string;
};

function entryTitle(entry: ProfileActivity["recentlyAdded"][number]) {
  return entry.anime.english_title || entry.anime.romaji_title;
}

function ActivityList({
  label,
  entries,
}: {
  label: string;
  entries: ProfileActivity["recentlyAdded"];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <ul className="mt-2 min-w-0 space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className="min-w-0">
            <Link
              href={`/anime/${entry.anime.anilist_id}`}
              className="group flex w-full min-w-0 items-center gap-2.5 rounded-xl border border-transparent bg-surface-2/40 px-2 py-1.5 transition-all hover:-translate-y-0.5 hover:border-line hover:bg-surface-2"
            >
              <AnimePoster
                src={entry.anime.cover_image_url}
                alt={entryTitle(entry)}
                size="sm"
              />
              <span className="min-w-0 truncate text-sm font-medium text-ink group-hover:text-accent">
                {entryTitle(entry)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProfileActivityPanel({
  activity,
  isOwnProfile,
  className = "",
}: ProfileActivityPanelProps) {
  const hasActivity =
    activity.recentlyCompleted.length > 0 ||
    activity.recentlyAdded.length > 0 ||
    (isOwnProfile && activity.recentComparisonCount !== null);

  if (!hasActivity) return null;

  return (
    <section
      className={`flex min-w-0 flex-col rounded-card border border-line bg-surface p-5 shadow-[0_16px_28px_-26px_rgb(var(--shadow-color)/0.5)] sm:p-6 ${className}`}
    >
      <p className="eyebrow">Activity</p>
      <h3 className="mt-1 text-lg font-semibold">Recent updates</h3>

      <div className="mt-4 grid min-w-0 flex-1 gap-5 sm:grid-cols-2">
        <ActivityList
          label="Recently completed"
          entries={activity.recentlyCompleted}
        />
        <ActivityList label="Recently added" entries={activity.recentlyAdded} />
      </div>

      {isOwnProfile && activity.recentComparisonCount !== null ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-sm text-muted">
          <span className="font-display font-semibold text-ink">
            {activity.recentComparisonCount}
          </span>{" "}
          series comparison
          {activity.recentComparisonCount === 1 ? "" : "s"} recorded.{" "}
          <Link
            href="/ranking"
            className="font-medium text-accent hover:underline"
          >
            Keep ranking →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
