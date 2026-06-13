"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/constants";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Unread counts keyed by nav href (e.g. friend recommendations on /friends). */
type NavBadges = Record<string, number>;

function badgeLabel(count: number) {
  return count > 9 ? "9+" : String(count);
}

export function DesktopNav({ badges = {} }: { badges?: NavBadges }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const badge = badges[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {badge > 0 ? (
              <span
                aria-label={`${badge} new`}
                className="ml-1.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-accent px-1 py-0.5 align-middle text-[10px] font-semibold leading-none text-on-accent"
              >
                {badgeLabel(badge)}
              </span>
            ) : null}
            {active ? (
              <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-accent" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ badges = {} }: { badges?: NavBadges }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const badge = badges[item.href] ?? 0;
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={badge > 0 ? `${item.label} (${badge} new)` : item.label}
                title={item.label}
                className={`relative flex min-h-13 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-medium leading-tight transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {badge > 0 ? (
                  <span className="absolute top-1.5 right-[calc(50%-1.25rem)] inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-on-accent">
                    {badgeLabel(badge)}
                  </span>
                ) : null}
                <span
                  className={`h-1 w-1 shrink-0 rounded-full transition-colors ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
                <span className="max-w-full truncate">{item.mobileLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
