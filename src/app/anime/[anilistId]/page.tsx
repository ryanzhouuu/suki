import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimeLibrarySection } from "@/components/anime/anime-library-section";
import { AnimePoster } from "@/components/anime/anime-poster";
import { BackButton } from "@/components/anime/back-button";
import { RecommendFromAnimeButton } from "@/components/friend-recommendations/recommend-from-anime-button";
import { getAuthUser } from "@/lib/auth/session";
import { getAnimeForDisplay } from "@/lib/anime/get-for-display";
import {
  formatFuzzyDate,
  getEnabledLinks,
  getFilteredTags,
  getSortedStudios,
  getTopRankings,
  getYoutubeTrailer,
  type FuzzyDate,
} from "@/lib/anime/detail-helpers";
import { listAcceptedFriends } from "@/lib/friends/queries";
import { getUserEntryForAnime } from "@/lib/library/queries";

type AnimeDetailPageProps = {
  params: Promise<{ anilistId: string }>;
};

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { anilistId: anilistIdParam } = await params;
  const anilistId = Number(anilistIdParam);

  if (!Number.isFinite(anilistId)) {
    notFound();
  }

  const [animeResult, user] = await Promise.all([
    getAnimeForDisplay(anilistId).then(
      (value) => ({ ok: true as const, anime: value }),
      () => ({ ok: false as const }),
    ),
    getAuthUser(),
  ]);

  if (!animeResult.ok) {
    notFound();
  }

  const anime = animeResult.anime;
  const [entry, friends] =
    user && anime.id
      ? await Promise.all([
          getUserEntryForAnime(user.id, anime.id),
          listAcceptedFriends(user.id),
        ])
      : [null, []];

  const title = anime.english_title || anime.romaji_title;

  const description = anime.description
    ? anime.description.replace(/<[^>]*>/g, "")
    : null;

  const startDateStr = formatFuzzyDate(anime.start_date as FuzzyDate | null);
  const endDateStr = formatFuzzyDate(anime.end_date as FuzzyDate | null);
  const duration = anime.duration_minutes ? `${anime.duration_minutes} min` : null;
  const country = anime.country_of_origin ?? null;

  const studios = getSortedStudios(anime.studios);
  const tags = getFilteredTags(anime.tags);
  const links = getEnabledLinks(anime.external_links);
  const topRankings = getTopRankings(anime.rankings);
  const trailer = getYoutubeTrailer(anime.trailer);

  const streamingLinks = links.filter((l) => l.type === "STREAMING");
  const infoLinks = links.filter((l) => l.type !== "STREAMING");

  const heroMeta = [
    anime.format,
    anime.season && anime.season_year
      ? `${anime.season} ${anime.season_year}`
      : anime.season_year
        ? String(anime.season_year)
        : null,
    anime.status,
    anime.episodes ? `${anime.episodes} eps` : null,
  ].filter(Boolean) as string[];

  const detailRows = (
    [
      { label: "Format", value: anime.format ?? null },
      { label: "Episodes", value: anime.episodes != null ? String(anime.episodes) : null },
      { label: "Duration", value: duration },
      { label: "Source", value: anime.source ?? null },
      {
        label: "Season",
        value:
          anime.season && anime.season_year
            ? `${anime.season} ${anime.season_year}`
            : anime.season_year
              ? String(anime.season_year)
              : null,
      },
      { label: "Start", value: startDateStr },
      { label: "End", value: endDateStr },
      { label: "Country", value: country },
    ] as Array<{ label: string; value: string | null }>
  ).filter((r): r is { label: string; value: string } => r.value != null);

  const communityItems: Array<{ label: string; value: string; accent: boolean }> = [];
  if (anime.mean_score != null)
    communityItems.push({ label: "Mean Score", value: String(anime.mean_score), accent: false });
  if (anime.popularity != null)
    communityItems.push({ label: "Users", value: anime.popularity.toLocaleString(), accent: false });
  if (anime.favourites != null)
    communityItems.push({ label: "Favourites", value: anime.favourites.toLocaleString(), accent: false });
  topRankings.forEach((r) =>
    communityItems.push({ label: r.context, value: `#${r.rank}`, accent: true }),
  );

  return (
    <div>
      {/* ── CINEMATIC HERO ──────────────────────────────── */}
      <section className="relative flex min-h-[44svh] flex-col justify-end overflow-hidden sm:min-h-[50svh]">
        {/* Background: banner → blurred cover → solid ink */}
        {anime.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.banner_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : anime.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl brightness-50 saturate-150"
          />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}

        {/* Double scrim: bottom-up for text, left-right for wide titles */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/55 to-ink/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/65 via-ink/25 to-transparent sm:from-ink/50 sm:via-ink/10" />

        {/* Paper dissolve at the bottom edge — blends hero into page */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-paper to-transparent" />

        {/* Back button */}
        <div className="absolute inset-x-0 top-0 z-10 mx-auto max-w-8xl px-4 pt-5">
          <BackButton
            fallbackHref={user ? "/home" : "/"}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
          />
        </div>

        {/* Poster stamp — bottom-right of hero on all screen sizes */}
        <div className="absolute bottom-16 right-4 z-10 sm:bottom-20 sm:right-6">
          <div className="relative">
            {/* Vermilion ambient glow bleeds out behind the poster */}
            <div className="absolute -inset-4 rounded-4xl bg-accent/30 blur-2xl" />
            <div className="relative w-20 overflow-hidden rounded-card border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_24px_60px_-6px_rgba(0,0,0,0.9)] sm:w-32 lg:w-36">
              <AnimePoster src={anime.cover_image_url} alt={title} fill />
            </div>
          </div>
        </div>

        {/* Title block — right padding keeps text clear of the poster at all sizes */}
        <div className="relative z-10 mx-auto w-full max-w-8xl px-4 pb-14 pr-28 sm:pb-20 sm:pr-40 lg:pr-44">
          {heroMeta.length > 0 ? (
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/50">
              {heroMeta.join(" · ")}
            </p>
          ) : null}

          <h1 className="font-display text-[2.5rem] font-semibold leading-[0.95] tracking-tight text-white [text-wrap:balance] sm:text-5xl lg:text-6xl xl:text-[5rem]">
            {title}
          </h1>

          {anime.native_title && anime.native_title !== title ? (
            <p className="mt-2 font-display text-base text-white/35 sm:text-xl">
              {anime.native_title}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
            {anime.average_score ? (
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-semibold text-white">
                  ★ {anime.average_score}
                </span>
                <span className="text-[0.7rem] text-white/40">/ 100</span>
              </span>
            ) : null}
            {topRankings.slice(0, 2).map((r) => (
              <span key={`${r.type}-${r.rank}`} className="text-xs text-white/55">
                #{r.rank} {r.context}
              </span>
            ))}
            {anime.trending != null && anime.trending > 0 ? (
              <span className="text-xs text-white/55">Trending #{anime.trending}</span>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── GENRE RAIL ──────────────────────────────────── */}
      {anime.genres.length > 0 ? (
        <div className="border-b border-line-strong">
          <div className="mx-auto max-w-8xl overflow-x-auto">
            <div className="flex items-center px-4 py-3.5">
              {anime.genres.map((g, i) => (
                <span key={g} className="flex shrink-0 items-center">
                  {i > 0 ? (
                    <span className="mx-3 select-none text-faint" aria-hidden="true">
                      ·
                    </span>
                  ) : null}
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    {g}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── PAGE BODY ───────────────────────────────────── */}
      <div className="mx-auto max-w-8xl px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] lg:gap-x-14">

          {/* MAIN — first in DOM so mobile reads description before metadata */}
          <main className="min-w-0 space-y-10 pt-10 lg:col-start-2 lg:row-start-1">
            {/* Description in display serif — literary review feel */}
            {description ? (
              <p className="font-display text-[1.1rem] leading-[1.8] text-ink/80 sm:text-[1.2rem] sm:leading-[1.75]">
                {description.slice(0, 700)}
                {description.length > 700 ? "…" : ""}
              </p>
            ) : null}

            {/* Trailer */}
            {trailer ? (
              <div>
                <p className="eyebrow mb-4">Trailer</p>
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block max-w-[500px] overflow-hidden rounded-card"
                >
                  {trailer.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trailer.thumbnail}
                      alt="Trailer thumbnail"
                      className="aspect-video w-full object-cover transition-opacity duration-200 group-hover:opacity-80"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-surface-2" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper/85 shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6 translate-x-0.5 text-ink"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </a>
              </div>
            ) : null}

            {/* Themes / Tags */}
            {tags.length > 0 ? (
              <div>
                <p className="eyebrow mb-3">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="rounded-full border border-line-strong px-3 py-1 text-xs text-muted"
                      title={tag.category ?? undefined}
                    >
                      {tag.name}
                      {tag.rank ? (
                        <span className="ml-1 opacity-45">{tag.rank}%</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Links */}
            {(anime.site_url || infoLinks.length > 0 || streamingLinks.length > 0) ? (
              <div>
                <p className="eyebrow mb-3">Links</p>
                <div className="space-y-3">
                  {(anime.site_url || infoLinks.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {anime.site_url ? (
                        <a
                          href={anime.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          AniList
                        </a>
                      ) : null}
                      {infoLinks.map((link) => (
                        <a
                          key={`${link.site}-${link.url}`}
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          {link.site}
                          {link.language ? ` (${link.language})` : ""}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {streamingLinks.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs text-faint">Stream on</p>
                      <div className="flex flex-wrap gap-2">
                        {streamingLinks.map((link) => (
                          <a
                            key={`${link.site}-${link.url}`}
                            href={link.url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent transition-opacity hover:opacity-80"
                          >
                            {link.site}
                            {link.language ? ` (${link.language})` : ""}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Library / Auth */}
            {user ? (
              <div className="space-y-4">
                <AnimeLibrarySection
                  anilistId={anilistId}
                  entry={entry}
                  anime={anime}
                />
                <RecommendFromAnimeButton
                  anilistId={anilistId}
                  animeTitle={title}
                  friends={friends.map((f) => ({
                    userId: f.profile.user_id,
                    username: f.profile.username,
                    displayName: f.profile.display_name,
                    avatarUrl: f.profile.avatar_url,
                  }))}
                />
              </div>
            ) : (
              <p className="text-sm text-muted">
                <Link
                  href="/auth/login"
                  className="font-semibold text-accent hover:underline"
                >
                  Sign in
                </Link>{" "}
                to track this anime.
              </p>
            )}
          </main>

          {/* SIDEBAR — second in DOM (below main on mobile), left column on desktop */}
          <aside className="space-y-8 pt-10 lg:col-start-1 lg:row-start-1 lg:sticky lg:top-8 lg:self-start">
            {/* Details ledger */}
            {detailRows.length > 0 ? (
              <div>
                <p className="eyebrow mb-4">Details</p>
                <dl className="space-y-2.5">
                  {detailRows.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5 last:border-b-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-xs text-faint">{label}</dt>
                      <dd className="text-right text-sm text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {/* Studios */}
            {studios.length > 0 ? (
              <div>
                <p className="eyebrow mb-3">Studios</p>
                <ul className="space-y-2">
                  {studios.map((edge) => {
                    if (!edge.node) return null;
                    return (
                      <li key={edge.node.name} className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${edge.isMain ? "bg-accent" : "bg-line-strong"}`}
                        />
                        {edge.node.siteUrl ? (
                          <a
                            href={edge.node.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm transition-colors hover:text-accent ${edge.isMain ? "font-medium text-ink" : "text-muted"}`}
                          >
                            {edge.node.name}
                          </a>
                        ) : (
                          <span
                            className={`text-sm ${edge.isMain ? "font-medium text-ink" : "text-muted"}`}
                          >
                            {edge.node.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {/* Community stats ledger */}
            {communityItems.length > 0 ? (
              <div>
                <p className="eyebrow mb-4">Community</p>
                <dl className="space-y-2.5">
                  {communityItems.map(({ label, value, accent }) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-xs text-faint">{label}</dt>
                      <dd className={`font-semibold ${accent ? "text-accent" : "text-ink"}`}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
