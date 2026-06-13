import Link from "next/link";

import type { Tables } from "@/types/database";

type ProfileRestrictedCardProps = {
  profile: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url">;
  showSignIn?: boolean;
};

export function ProfileRestrictedCard({
  profile,
  showSignIn = false,
}: ProfileRestrictedCardProps) {
  const displayName = profile.display_name || profile.username;

  return (
    <section className="rounded-card border border-line bg-surface p-8 text-center sm:p-12">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          className="mx-auto h-20 w-20 rounded-full border-4 border-surface object-cover"
        />
      ) : (
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface bg-accent font-display text-2xl font-semibold text-on-accent">
          {displayName[0]?.toUpperCase()}
        </div>
      )}

      <h1 className="mt-4 text-2xl font-semibold">{displayName}</h1>
      <p className="mt-0.5 text-muted">@{profile.username}</p>

      <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted">
        This profile is private.
      </p>

      {showSignIn ? (
        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-full border border-line bg-surface-2 px-4 py-1.5 text-sm font-medium text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-ink"
        >
          Sign in
        </Link>
      ) : null}
    </section>
  );
}
