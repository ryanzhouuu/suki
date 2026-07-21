import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { DesktopNav, MobileNav } from "@/components/layout/main-nav";
import { APP_NAME } from "@/lib/constants";
import { getUnreadRecommendationCount } from "@/lib/friend-recommendations/queries";
import type { Tables } from "@/types/database";

type AppShellProps = {
  children: React.ReactNode;
  profile: Tables<"profiles">;
  isSeriesAdmin?: boolean;
};

export async function AppShell({ children, profile, isSeriesAdmin }: AppShellProps) {
  const initial =
    (profile.display_name || profile.username || "?")[0]?.toUpperCase() ?? "?";

  const unreadRecommendations = await getUnreadRecommendationCount(
    profile.user_id,
  );
  const navBadges = { "/friends": unreadRecommendations };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4">
          <Link
            href="/home"
            aria-label={`${APP_NAME} home`}
            className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base font-semibold text-on-accent shadow-sm transition-transform group-hover:-rotate-6">
              好
            </span>
            <span className="truncate font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {APP_NAME}
            </span>
          </Link>

          <DesktopNav badges={navBadges} />

          <AccountMenu
            username={profile.username}
            avatarUrl={profile.avatar_url}
            initial={initial}
            isSeriesAdmin={isSeriesAdmin}
          />
        </div>
      </header>

      <main className="app-main mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:py-10">
        {children}
      </main>

      <MobileNav badges={navBadges} />
    </div>
  );
}
