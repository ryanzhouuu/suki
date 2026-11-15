import Link from "next/link";
import type { ReactNode } from "react";

import { TasteRadarChart } from "@/components/profile/taste-radar-chart";
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

function FingerprintHeading({
  sourceSeriesCount,
  ready,
}: {
  sourceSeriesCount: number;
  ready: boolean;
}) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
      <h2
        id="taste-fingerprint-title"
        className="font-display text-3xl font-medium text-ink sm:text-4xl"
      >
        Taste fingerprint
      </h2>
      {ready ? (
        <p className="text-sm text-muted">
          Read from{" "}
          <span className="tabular-nums text-ink">{sourceSeriesCount}</span> series
          in this history
        </p>
      ) : null}
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
            "A few more ranked franchises will give this readout a clearer signal.",
          href: "/ranking",
          cta: "Rank more favorites",
        }
      : {
          message:
            "A little more library activity will give this readout a clearer signal.",
          href: "/library",
          cta: "Add library activity",
        };

  return (
    <div className="mt-6 border-t border-line pt-6">
      <p className="font-display text-xl text-ink" role="status">
        This fingerprint is still forming.
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {isOwnProfile
          ? copy.message
          : "There is not quite enough history to produce a reliable readout yet."}
      </p>
      {isOwnProfile ? (
        <Link
          href={copy.href}
          className="mt-4 inline-flex min-h-10 items-center rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
        >
          {copy.cta}
        </Link>
      ) : null}
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="mt-6 border-t border-line pt-6">
      <p className="font-display text-xl text-ink" role="status">
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
      className="min-w-0"
    >
      <FingerprintHeading
        sourceSeriesCount={fingerprint?.sourceSeriesCount ?? 0}
        ready={state === "ready"}
      />

      {state === "ready" ? (
        <ol
          aria-label="Taste traits"
          className="mt-6 grid min-w-0 gap-x-10 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {traits.map((trait, index) => (
            <li
              key={trait.id}
              className={`min-w-0 ${
                index === 0
                  ? "grid gap-8 sm:col-span-2 lg:col-span-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center"
                  : ""
              }`}
            >
              <TasteTraitCard
                trait={trait}
                prominent={index === 0}
                ordinal={index + 1}
              />
              {index === 0 ? <TasteRadarChart traits={traits} /> : null}
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

      {tracker ? <div>{tracker}</div> : null}
    </section>
  );
}
