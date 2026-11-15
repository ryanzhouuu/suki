import type { TasteFingerprint } from "@/lib/fingerprint";

import { TasteFamilyIcon } from "@/components/profile/taste-family-icon";

type TasteFingerprintTrait = TasteFingerprint["traits"][number];

type TasteTraitCardProps = {
  trait: TasteFingerprintTrait;
  prominent?: boolean;
  /** Position by strength, matching the radar's vertex numbers. */
  ordinal: number;
};

/**
 * One taste trait. The prominent (strongest) trait reads as a large
 * statement; the rest are compact columns under a hairline.
 */
export function TasteTraitCard({
  trait,
  prominent = false,
  ordinal,
}: TasteTraitCardProps) {
  const headingId = `taste-trait-${trait.id}`;
  const strength = Math.round(Math.max(0, Math.min(1, trait.strength)) * 100);

  return (
    <article className="flex h-full min-w-0 flex-col" aria-labelledby={headingId}>
      <div className="flex items-center gap-2 text-sm text-muted">
        <TasteFamilyIcon
          family={trait.family}
          className={`shrink-0 text-accent ${prominent ? "h-5 w-5" : "h-4 w-4"}`}
        />
        <span>{prominent ? "Primary trait" : `No. ${ordinal}`}</span>
        <span aria-hidden className="text-faint">
          /
        </span>
        <span className="capitalize">{trait.family}</span>
      </div>

      <h3
        id={headingId}
        className={`mt-2 font-display font-medium leading-[1.05] text-ink ${
          prominent ? "text-4xl sm:text-5xl" : "text-xl"
        }`}
      >
        {trait.label}
      </h3>
      <p
        className={`mt-3 leading-relaxed text-muted ${
          prominent ? "max-w-xl text-base" : "text-sm"
        }`}
      >
        {trait.summary}
      </p>

      <div className={`mt-auto pt-4 ${prominent ? "max-w-md" : ""}`}>
        <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted">
          <span>Strength</span>
          <span className="tabular-nums text-ink">{strength}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${trait.label} strength`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={strength}
          className="h-1 overflow-hidden rounded-full bg-white/[0.06]"
        >
          <span
            className="block h-full rounded-full bg-accent"
            style={{ width: `${strength}%` }}
          />
        </div>

        <details data-fingerprint-trait-id={trait.id} className="group mt-3">
          <summary
            aria-label={`Why this fits ${trait.label}`}
            className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink/80 transition-colors hover:text-accent motion-reduce:transition-none [&::-webkit-details-marker]:hidden"
          >
            <span>Why this fits</span>
            <span
              aria-hidden
              className="text-base leading-none text-accent transition-transform group-open:rotate-45 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <ul className="space-y-2 pb-1 text-sm leading-relaxed text-muted">
            {trait.evidence.map((item, index) => (
              <li key={`${item.kind}-${index}`} className="border-l border-line-strong pl-3">
                {item.text}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </article>
  );
}
