"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { signOut } from "@/actions/auth";

type AccountMenuProps = {
  username: string;
  avatarUrl: string | null;
  initial: string;
  isSeriesAdmin?: boolean;
};

const itemClassName =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none";

export function AccountMenu({
  username,
  avatarUrl,
  initial,
  isSeriesAdmin,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 text-sm font-semibold text-ink transition-[border-color,box-shadow,transform] hover:border-accent hover:shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-95 sm:h-9 sm:w-9"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-paper p-1.5 shadow-[0_18px_45px_-18px_rgb(var(--shadow-color)/0.65)] animate-fade"
        >
          <nav aria-label="Account">
            <Link
              href={`/u/${username}`}
              onClick={() => setOpen(false)}
              className={itemClassName}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
                className="h-5 w-5 text-muted"
              >
                <circle cx="10" cy="6.5" r="3" />
                <path d="M4.5 16c.5-3 2.4-4.5 5.5-4.5s5 1.5 5.5 4.5" />
              </svg>
              Profile
            </Link>

            {isSeriesAdmin ? (
              <Link
                href="/admin/series"
                onClick={() => setOpen(false)}
                className={itemClassName}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-5 w-5 text-muted"
                >
                  <path d="m12.6 5.1 2.3 2.3M11.4 6.3l3.2-3.2a1.6 1.6 0 0 1 2.3 2.3l-3.2 3.2M10.8 7l-6.9 6.9-.8 3 3-.8 6.9-6.9" />
                </svg>
                Admin
              </Link>
            ) : null}

            <div className="my-1 border-t border-line" />

            <form action={signOut}>
              <button type="submit" className={`${itemClassName} text-muted`}>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path d="M8 4H4.5A1.5 1.5 0 0 0 3 5.5v9A1.5 1.5 0 0 0 4.5 16H8M12.5 6.5 16 10l-3.5 3.5M7 10h9" />
                </svg>
                Sign out
              </button>
            </form>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
