import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { StatsBlock } from "@/components/profile/profile-stats-panel";
import type { ProfileActivity } from "@/lib/profiles/stats";

type ProfileActivityPanelProps = {
  activity: ProfileActivity;
  isOwnProfile: boolean;
  className?: string;
};

function entryTitle(entry: ProfileActivity["recentlyAdded"][number]) {
  return entry.anime.english_title || entry.anime.romaji_title;
}

/** A labelled row of uniform posters with titles underneath. */
function ActivityRow({
  label,
  entries,
}: {
  label: string;
  entries: ProfileActivity["recentlyAdded"];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted">{label}</p>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
        {entries.map((entry) => (
          <li key={entry.id} className="min-w-0">
            <Link href={`/anime/${entry.anime.anilist_id}`} className="group block">
              <AnimePoster
                src={entry.anime.cover_image_url}
                alt={entryTitle(entry)}
                fill
                className="rounded-md ring-1 ring-white/10 transition-opacity group-hover:opacity-85"
              />
              <span className="mt-2 line-clamp-2 text-sm leading-snug text-ink/90 group-hover:text-accent">
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
    <StatsBlock title="Recent updates" className={className}>
      <div className="space-y-8">
        <ActivityRow label="Recently completed" entries={activity.recentlyCompleted} />
        <ActivityRow label="Recently added" entries={activity.recentlyAdded} />
      </div>

      {isOwnProfile && activity.recentComparisonCount !== null ? (
        <p className="mt-6 text-sm text-muted">
          <span className="font-display text-base text-ink tabular-nums">
            {activity.recentComparisonCount}
          </span>{" "}
          series comparison
          {activity.recentComparisonCount === 1 ? "" : "s"} recorded.{" "}
          <Link href="/ranking" className="font-medium text-accent hover:underline">
            Keep ranking
          </Link>
        </p>
      ) : null}
    </StatsBlock>
  );
}
