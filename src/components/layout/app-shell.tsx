import Link from "next/link";

import { signOut } from "@/actions/auth";
import { DesktopNav, MobileNav } from "@/components/layout/main-nav";
import { APP_NAME } from "@/lib/constants";
import type { Tables } from "@/types/database";

type AppShellProps = {
  children: React.ReactNode;
  profile: Tables<"profiles">;
  isSeriesAdmin?: boolean;
};

export function AppShell({ children, profile, isSeriesAdmin }: AppShellProps) {
  const initial =
    (profile.display_name || profile.username || "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4">
          <Link
            href="/home"
            className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base font-semibold text-on-accent shadow-sm transition-transform group-hover:-rotate-6">
              好
            </span>
            <span className="truncate font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {APP_NAME}
            </span>
          </Link>

          <DesktopNav />

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {isSeriesAdmin ? (
              <Link
                href="/admin/series"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:inline-block"
              >
                Series admin
              </Link>
            ) : null}
            <Link
              href="/settings"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:inline-block"
            >
              Settings
            </Link>
            <form action={signOut} className="hidden sm:block">
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </form>
            <Link
              href={`/u/${profile.username}`}
              aria-label="Your profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 text-sm font-semibold text-ink transition-colors hover:border-accent"
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="app-main mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:py-10">
        {children}
      </main>

      <MobileNav />
    </div>
  );
}
