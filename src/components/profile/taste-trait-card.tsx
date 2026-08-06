import type { TasteFingerprint } from "@/lib/fingerprint";

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

  return (
    <article
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-card border p-4 shadow-[0_16px_28px_-26px_rgb(var(--shadow-color)/0.5)] sm:p-5 ${
        prominent
          ? "border-accent/45 bg-accent-soft/45"
          : "border-line bg-surface"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full border border-accent/20"
      />

      <div className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">
        <span className="font-display text-sm text-accent">
          {String(ordinal).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px w-6 bg-line-strong" />
        <span>Trait</span>
      </div>

      <h3
        id={headingId}
        className={`relative mt-3 font-display font-semibold leading-tight text-ink ${
          prominent ? "text-2xl sm:text-3xl" : "text-xl"
        }`}
      >
        {trait.label}
      </h3>
      <p className="relative mt-2 max-w-prose text-sm leading-relaxed text-muted">
        {trait.summary}
      </p>

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
            className="text-lg leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none"
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
