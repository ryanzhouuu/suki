type RecommendationBannerBackdropProps = {
  bannerUrl: string | null;
  coverUrl: string | null;
};

/**
 * Soft banner halo behind the focused recommendation card — same DNA as the
 * anime detail hero, but contained and faded into the page rather than full-bleed.
 */
export function RecommendationBannerBackdrop({
  bannerUrl,
  coverUrl,
}: RecommendationBannerBackdropProps) {
  const imageUrl = bannerUrl ?? coverUrl;

  return (
    <div
      className="pointer-events-none absolute left-1/2 -top-6 bottom-14 z-0 w-[calc(100%+7rem)] -translate-x-1/2 overflow-hidden rounded-[calc(var(--radius-card)+0.75rem)] sm:-top-8 sm:bottom-16 sm:w-[calc(100%+9rem)]"
      aria-hidden
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full scale-105 object-cover object-[center_20%]"
        />
      ) : (
        <>
          <div className="h-full w-full bg-linear-to-br from-accent-soft via-surface-2 to-surface" />
          <div
            className="absolute inset-0 bg-linear-to-r from-accent/25 via-accent/8 to-transparent"
            aria-hidden
          />
        </>
      )}

      {/* Fade into page edges — lighter side fade so the wider banner stays visible */}
      <div className="absolute inset-0 bg-linear-to-r from-paper/65 via-transparent to-paper/65" />
      <div className="absolute inset-0 bg-linear-to-b from-paper/55 via-transparent to-paper/90" />

      {/* Detail-page style lift: banner dissolves into the card */}
      <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/55 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/25 to-transparent opacity-80" />

      {/* Soft vignette for depth */}
      <div className="absolute inset-0 shadow-[inset_0_0_80px_40px_rgb(var(--shadow-color)/0.12)]" />
    </div>
  );
}
