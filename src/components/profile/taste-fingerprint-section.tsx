import Link from "next/link";
import type { ReactNode } from "react";

import { TasteTraitCard } from "@/components/profile/taste-trait-card";
import type { TasteFingerprint } from "@/lib/fingerprint";

type FormingReason = "ranking" | "library";

export type TasteFingerprintSectionProps = {
  fingerprint: TasteFingerprint | null;
  isOwnProfile: boolean;
  tracker?: ReactNode;
};

function isFormingReason(value: unknown): value is FormingReason {
  return value === "ranking" || value === "library";
}

function formingReason(fingerprint: TasteFingerprint): FormingReason {
  const reason = (fingerprint as TasteFingerprint & { formingReason?: unknown })
    .formingReason;
  return isFormingReason(reason) ? reason : "library";
}

function FingerprintHeading() {
  return (
    <header className="relative">
      <p className="eyebrow">Overview</p>
      <h2
        id="taste-fingerprint-title"
        className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl"
      >
        Taste fingerprint
      </h2>
    </header>
  );
}

function FormingState({
  fingerprint,
  isOwnProfile,
}: {
  fingerprint: TasteFingerprint;
  isOwnProfile: boolean;
}) {
  const reason = formingReason(fingerprint);
  const copy =
    reason === "ranking"
      ? {
          message:
            "A few more ranked franchises will give this constellation a clearer shape.",
          href: "/ranking",
          cta: "Rank more favorites",
        }
      : {
          message:
            "A little more library activity will give this constellation a clearer shape.",
          href: "/library",
          cta: "Add library activity",
        };

  return (
    <div className="relative mt-5 rounded-card border border-dashed border-line-strong bg-surface-2/35 p-5 sm:p-6">
      <p className="text-base font-medium text-ink" role="status">
        This fingerprint is still forming.
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {isOwnProfile
          ? copy.message
          : "There is not quite enough history to draw a reliable constellation yet."}
      </p>
      {isOwnProfile ? (
        <Link
          href={copy.href}
          className="mt-4 inline-flex min-h-10 items-center rounded-full border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 motion-reduce:transition-none"
        >
          {copy.cta} <span aria-hidden className="ml-1.5">→</span>
        </Link>
      ) : null}
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="relative mt-5 rounded-card border border-dashed border-line-strong bg-surface-2/35 p-5 sm:p-6">
      <p className="text-base font-medium text-ink" role="status">
        Temporarily unavailable
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        This fingerprint could not be loaded right now. The rest of the profile
        is still available.
      </p>
    </div>
  );
}

export function TasteFingerprintSection({
  fingerprint,
  isOwnProfile,
  tracker,
}: TasteFingerprintSectionProps) {
  const state = fingerprint?.state ?? "unavailable";
  const traits = fingerprint?.traits.slice(0, 5) ?? [];

  return (
    <section
      aria-labelledby="taste-fingerprint-title"
      data-taste-fingerprint-section
      data-state={state}
      className="relative min-w-0 overflow-hidden rounded-card border border-line bg-surface p-5 shadow-[0_18px_34px_-28px_rgb(var(--shadow-color)/0.55)] sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-44 w-44 translate-x-20 -translate-y-20 rounded-full border border-line-strong/70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 right-20 h-1.5 w-1.5 rounded-full bg-accent/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 right-24 h-px w-16 origin-right -rotate-12 bg-line-strong/80"
      />

      <FingerprintHeading />

      {state === "ready" ? (
        <ol
          aria-label="Taste traits"
          className="relative mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {traits.map((trait, index) => (
            <li
              key={trait.id}
              className={`min-w-0 ${
                index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <TasteTraitCard
                trait={trait}
                prominent={index === 0}
                ordinal={index + 1}
              />
            </li>
          ))}
        </ol>
      ) : state === "forming" && fingerprint ? (
        <FormingState
          fingerprint={fingerprint as TasteFingerprint}
          isOwnProfile={isOwnProfile}
        />
      ) : (
        <UnavailableState />
      )}

      {tracker ? <div className="relative">{tracker}</div> : null}
    </section>
  );
}
