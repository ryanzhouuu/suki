import type { ReactNode } from "react";

export const heroPrimaryClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong";

export const heroGhostClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20";

/**
 * Full-bleed hero shell. `app` leaves room for the mobile tab bar; `page` is
 * the signed-out landing, which has no tab bar.
 */
export function HeroFrame({
  src,
  edge,
  children,
}: {
  src: string | null;
  edge: "app" | "page";
  children: ReactNode;
}) {
  return (
    <section className={`artwork-hero ${edge === "page" ? "artwork-hero--page" : ""}`}>
      <ArtworkField src={src} />
      <div className="artwork-hero__copy px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          {children}
        </div>
      </div>
    </section>
  );
}

/** Banner treatment: left-weighted shade, a bottom fade into the page, and an edge vignette. */
export function ArtworkField({ src }: { src: string | null }) {
  return (
    <div className="artwork-field" aria-hidden="true">
      {src ? (
        // Banners are remote and decorative; the visible title is in the hero copy.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" className="artwork-field__image" />
      ) : (
        <div className="artwork-field__glow" />
      )}
      {src ? <div className="artwork-field__shade" /> : null}
    </div>
  );
}
