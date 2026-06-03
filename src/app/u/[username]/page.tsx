import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimePoster } from "@/components/anime/anime-poster";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { ProfileEditSection } from "@/components/profile/profile-edit-section";
import { RankedList } from "@/components/ranking/ranked-list";
import { getAuthUser } from "@/lib/auth/session";
import { STATUS_LABELS } from "@/lib/constants";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { friendshipStatusForViewer } from "@/lib/friends/relationship";
import { getPublicProfileData } from "@/lib/profiles/queries";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const { username } = await params;
  const { edit } = await searchParams;
  const data = await getPublicProfileData(username);

  if (!data) {
    notFound();
  }

  const viewer = await getAuthUser();
  const { profile, entries, rankings, stats } = data;
  const displayName = profile.display_name || profile.username;
  const watching = entries.filter((e) => e.status === "watching").slice(0, 6);
  const watchlist = entries
    .filter((e) => e.status === "plan_to_watch")
    .slice(0, 6);

  const sections: { label: string; entries: typeof watching }[] = [
    { label: "Watching now", entries: watching },
    { label: STATUS_LABELS.plan_to_watch, entries: watchlist },
  ];

  let friendshipId: string | null = null;
  let friendshipStatus = friendshipStatusForViewer(null, viewer?.id ?? "");

  if (viewer && viewer.id !== profile.user_id) {
    const friendship = await getFriendshipBetween(viewer.id, profile.user_id);
    friendshipId = friendship?.id ?? null;
    friendshipStatus = friendshipStatusForViewer(friendship, viewer.id);
  }

  const isOwnProfile = viewer?.id === profile.user_id;
  const isEditing = isOwnProfile && edit === "1";

  return (
    <div className={`mx-auto max-w-5xl space-y-12 ${viewer ? "pb-6 sm:pb-0" : "px-4 py-10"}`}>
      <header className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="h-24 bg-linear-to-r from-accent/25 via-accent/10 to-transparent" />
        <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="-mt-12 h-24 w-24 rounded-full border-4 border-surface object-cover shadow-sm"
            />
          ) : (
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-accent font-display text-3xl font-semibold text-on-accent shadow-sm">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold">{displayName}</h1>
            <p className="text-muted">@{profile.username}</p>
            {profile.bio ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/85">
                {profile.bio}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { n: stats.total, label: "Tracked" },
                { n: stats.completed, label: "Completed" },
                { n: stats.watching, label: "Watching" },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-baseline gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm"
                >
                  <span className="font-display font-semibold text-ink">{s.n}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {s.label}
                  </span>
                </span>
              ))}
            </div>
            {isOwnProfile ? (
              <div className="mt-4">
                {!isEditing ? (
                  <ProfileEditSection profile={profile} editing={false} />
                ) : null}
              </div>
            ) : viewer ? (
              <div className="mt-4">
                <FriendActionButton
                  targetUserId={profile.user_id}
                  targetUsername={profile.username}
                  friendshipId={friendshipId}
                  status={friendshipStatus}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {isEditing ? (
        <ProfileEditSection profile={profile} editing />
      ) : null}

      <section>
        <p className="eyebrow">Top ranked</p>
        <h2 className="mb-4 mt-1 text-2xl font-semibold">Favorites</h2>
        <RankedList rankings={rankings} />
      </section>

      {sections.map((section) =>
        section.entries.length > 0 ? (
          <section key={section.label}>
            <h2 className="mb-4 text-2xl font-semibold">{section.label}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {section.entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/anime/${entry.anime.anilist_id}`}
                    className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition-colors hover:border-accent"
                  >
                    <AnimePoster
                      src={entry.anime.cover_image_url}
                      alt={entry.anime.romaji_title}
                      size="sm"
                    />
                    <span className="truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">
                      {entry.anime.english_title || entry.anime.romaji_title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      {!viewer ? (
        <p className="border-t border-line pt-8 text-center text-sm text-muted">
          <Link href="/" className="font-medium text-accent hover:underline">
            ← Back to Suki
          </Link>
        </p>
      ) : null}
    </div>
  );
}
