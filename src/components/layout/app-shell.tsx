import Link from "next/link";

import { BrandLockup } from "@/components/brand/brand-mark";
import { AccountMenu } from "@/components/layout/account-menu";
import { AppHeader, AppMain, CinematicFrame } from "@/components/layout/cinematic-frame";
import { DesktopNav, MobileNav } from "@/components/layout/main-nav";
import { TimezoneSync } from "@/components/layout/timezone-sync";
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
    <CinematicFrame>
      <TimezoneSync current={profile.timezone} />
      <AppHeader>
        <div className="mx-auto flex h-14 max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4">
          <Link
            href="/home"
            aria-label={`${APP_NAME} home`}
            className="group min-w-0 shrink"
          >
            <BrandLockup
              markClassName="h-8 w-8 sm:h-9 sm:w-9"
              wordmarkClassName="text-xl sm:text-2xl"
            />
          </Link>

          <DesktopNav badges={navBadges} />

          <AccountMenu
            username={profile.username}
            avatarUrl={profile.avatar_url}
            initial={initial}
            isSeriesAdmin={isSeriesAdmin}
          />
        </div>
      </AppHeader>

      <AppMain>{children}</AppMain>

      <MobileNav badges={navBadges} />
    </CinematicFrame>
  );
}
