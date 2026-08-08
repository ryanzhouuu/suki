import type { TasteFingerprint } from "@/lib/fingerprint";

import { TasteFamilyIcon } from "@/components/profile/taste-family-icon";

type TasteFingerprintTrait = TasteFingerprint["traits"][number];

type TasteTraitCardProps = {
  trait: TasteFingerprintTrait;
  prominent?: boolean;
  ordinal: number;
};

export function TasteTraitCard({
  trait,
  prominent = false,
  ordinal,
}: TasteTraitCardProps) {
  const headingId = `taste-trait-${trait.id}`;
  const strength = Math.round(Math.max(0, Math.min(1, trait.strength)) * 100);

  return (
    <article
      className={`group/trait relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border ${
        prominent
          ? "border-accent/55 bg-[linear-gradient(135deg,var(--accent-soft),var(--surface)_66%)] p-5 shadow-[0_22px_42px_-30px_rgb(var(--shadow-color)/0.65)] sm:p-6"
          : "border-line bg-surface/75 p-4 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_18px_30px_-26px_rgb(var(--shadow-color)/0.55)] motion-reduce:transition-none"
      }`}
    >
      <div className="relative flex items-start gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent ${prominent ? "h-12 w-12" : "h-10 w-10"}`}
        >
          <TasteFamilyIcon
            family={trait.family}
            className={prominent ? "h-6 w-6" : "h-5 w-5"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">
            <span>
              {prominent
                ? "Primary trait"
                : `Loadout ${String(ordinal).padStart(2, "0")}`}
            </span>
            <span className="text-accent">{trait.family}</span>
          </div>

          <h3
            id={headingId}
            className={`mt-2 font-display font-semibold leading-tight text-ink ${prominent ? "text-2xl sm:text-3xl" : "text-lg"}`}
          >
            {trait.label}
          </h3>
        </div>
      </div>
      <p className="relative mt-2 max-w-prose text-sm leading-relaxed text-muted">
        {trait.summary}
      </p>

      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
          <span>Signal strength</span>
          <span className="tabular-nums text-ink">{strength}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${trait.label} strength`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={strength}
          className="h-1.5 overflow-hidden rounded-full border border-line-strong bg-surface-2"
        >
          <span
            className="block h-full rounded-full bg-accent"
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <details
        data-fingerprint-trait-id={trait.id}
        className="group relative mt-4 border-t border-line/80 pt-2"
      >
        <summary
          aria-label={`Why this fits ${trait.label}`}
          className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium text-accent transition-colors hover:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 motion-reduce:transition-none"
        >
          <span>Why this fits</span>
          <span
            aria-hidden
            className="font-mono text-base leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none"
          >
            +
          </span>
        </summary>
        <div className="px-2 pb-1 pt-2">
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {trait.evidence.map((item, index) => (
              <li key={`${item.kind}-${index}`} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70"
                />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </article>
  );
}
