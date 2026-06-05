import type { ReactNode } from "react";

/**
 * Wide page canvas. Breaks out of the shell's default reading rail and centers
 * content on a roomy desktop track, while collapsing to a normal padded column
 * on phones. Pages opt in — the shell stays focused by default.
 */
export function WidePageFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="full-bleed px-4 sm:px-6 lg:px-8">
      <div className={`mx-auto w-full max-w-7xl min-w-0 ${className}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * Two-column desktop layout: a sticky control/side rail plus a flexible content
 * area. Stacks vertically on mobile so the rail's controls sit above content,
 * preserving the existing phone flow.
 */
export function ControlRail({
  sidebar,
  children,
  sidebarLabel = "Filters",
  sidebarClassName = "",
}: {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarLabel?: string;
  sidebarClassName?: string;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[19rem_minmax(0,1fr)] xl:gap-10">
      <aside
        aria-label={sidebarLabel}
        className={`relative z-10 mb-6 lg:mb-0 lg:sticky lg:top-20 ${sidebarClassName}`}
      >
        {sidebar}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Reusable full-bleed faded artwork layer for cinematic moments. Place inside a
 * `relative isolate` wrapper as the first child; content sits above with
 * `relative z-10`. Heavy fades keep foreground text readable in light and dark.
 */
export function CinematicBackdrop({
  imageUrl,
  className = "",
}: {
  imageUrl: string | null;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-0 right-[-50vw] left-[-50vw] z-0 h-[clamp(20rem,44vh,34rem)] overflow-hidden ${className}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full scale-105 object-cover object-[center_22%] saturate-[1.4]"
        />
      ) : (
        <div className="h-full w-full bg-linear-to-br from-accent-soft via-surface-2 to-surface" />
      )}
      {/* Blend only the edges into the paper theme; keep the center vivid. The
          bottom stays solid where the foreground card meets the artwork. */}
      <div className="absolute inset-0 bg-linear-to-r from-paper via-transparent to-paper" />
      <div className="absolute inset-0 bg-linear-to-b from-paper/40 via-transparent to-paper" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_50px_rgb(var(--shadow-color)/0.1)]" />
    </div>
  );
}

/** Responsive card grid for social/profile summaries. */
export function BentoGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}
