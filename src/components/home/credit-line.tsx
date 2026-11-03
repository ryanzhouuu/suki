import Link from "next/link";

import type { CreditPart } from "@/lib/home/featured";

/**
 * A film-credit line. Uppercase tracking comes from CSS so the source strings
 * can stay in sentence case for tests and screen readers.
 */
export function CreditLine({
  parts,
  onArt = false,
  className = "",
}: {
  parts: CreditPart[];
  /** Muted white, for copy sitting on banner art. */
  onArt?: boolean;
  className?: string;
}) {
  if (parts.length === 0) return null;
  return (
    <p className={`credit-line ${onArt ? "credit-line--on-art" : ""} ${className}`}>
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 ? <span className="credit-line__dot"> · </span> : null}
          <span
            className={
              part.tone === "accent"
                ? "text-accent"
                : part.tone === "strong"
                  ? onArt
                    ? "text-white"
                    : "text-ink"
                  : undefined
            }
          >
            {part.text}
          </span>
        </span>
      ))}
    </p>
  );
}

/** Section label plus heading, with an optional trailing link. */
export function SectionHeading({
  label,
  title,
  href,
  linkLabel = "See all →",
}: {
  label: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="credit-line">{label}</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
