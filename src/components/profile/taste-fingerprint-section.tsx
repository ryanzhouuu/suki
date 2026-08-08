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
    <header className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-accent">
          Player identity matrix
        </p>
        <h2
          id="taste-fingerprint-title"
          className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl"
        >
          Taste fingerprint
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          A live readout built from the patterns behind this anime history.
        </p>
      </div>
      <div className="flex items-center gap-3 self-start rounded-lg border border-line-strong bg-surface/75 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted sm:self-auto">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${ready ? "bg-success shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_14%,transparent)]" : "bg-faint"}`}
        />
        <span>{ready ? "Sync complete" : "Awaiting data"}</span>
        <span aria-hidden className="h-3 w-px bg-line-strong" />
        <span className="tabular-nums text-ink">{sourceSeriesCount} series</span>
      </div>
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
    <div className="relative mt-5 rounded-xl border border-dashed border-line-strong bg-surface/65 p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
            Signal acquisition
          </p>
          <p className="mt-2 text-base font-medium text-ink" role="status">
            This fingerprint is still forming.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {isOwnProfile
              ? copy.message
              : "There is not quite enough history to produce a reliable readout yet."}
          </p>
        </div>
        <div aria-hidden className="flex gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className="flex h-9 w-9 items-center justify-center rounded border border-line-strong bg-surface-2 font-mono text-[0.6rem] text-faint"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>
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
    <div className="relative mt-5 rounded-xl border border-dashed border-line-strong bg-surface/65 p-5 sm:p-6">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-danger">
        Readout interrupted
      </p>
      <p className="mt-2 text-base font-medium text-ink" role="status">
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
      className="relative min-w-0 overflow-hidden rounded-card border border-line-strong bg-surface-2/45 p-5 shadow-[0_22px_44px_-32px_rgb(var(--shadow-color)/0.65)] sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--line) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--line) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, black, transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--accent),color-mix(in_srgb,var(--accent)_20%,transparent)_55%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r border-t border-accent/45"
      />

      <FingerprintHeading
        sourceSeriesCount={fingerprint?.sourceSeriesCount ?? 0}
        ready={state === "ready"}
      />

      {state === "ready" ? (
        <ol
          aria-label="Taste traits"
          className="relative mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {traits.map((trait, index) => (
            <li
              key={trait.id}
              className={`min-w-0 ${
                index === 0
                  ? "grid gap-3 sm:col-span-2 lg:col-span-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]"
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

      {tracker ? <div className="relative">{tracker}</div> : null}
    </section>
  );
}
