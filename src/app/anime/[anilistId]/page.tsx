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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

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

  const meta = [anime.format, anime.season_year, anime.status]
    .filter(Boolean)
    .map(String);
  if (anime.episodes) meta.push(`${anime.episodes} eps`);

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

  return (
    <div className="pb-10">
      <div className="relative h-44 w-full overflow-hidden sm:h-64">
        {anime.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.banner_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface-2" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-6xl px-4 pt-5">
          <BackButton
            fallbackHref={user ? "/home" : "/"}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-3.5 py-1.5 text-sm font-medium text-ink backdrop-blur-md transition-colors hover:text-accent"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl min-w-0 space-y-9 px-4">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="-mt-16 w-fit shrink-0 overflow-hidden rounded-card border-4 border-paper shadow-[0_18px_50px_-26px_rgb(var(--shadow-color)/0.6)] sm:-mt-24">
            <AnimePoster src={anime.cover_image_url} alt={title} size="lg" />
          </div>
          <div className="min-w-0 flex-1 sm:pt-2">
            <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>
            {anime.native_title && anime.native_title !== title ? (
              <p className="mt-1 font-display text-lg text-muted">
                {anime.native_title}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              {meta.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-surface-2 px-2.5 py-1 font-medium uppercase tracking-wide text-muted"
                >
                  {m}
                </span>
              ))}
              {anime.average_score ? (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">
                  ★ {anime.average_score}
                </span>
              ) : null}
              {anime.trending != null && anime.trending > 0 ? (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-muted">
                  Trending #{anime.trending}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {anime.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {anime.genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted"
              >
                {g}
              </span>
            ))}
          </div>
        ) : null}

        {description ? (
          <p className="max-w-2xl leading-relaxed text-ink/85">
            {description.slice(0, 800)}
            {description.length > 800 ? "…" : ""}
          </p>
        ) : null}

        {/* Details */}
        {(startDateStr || endDateStr || duration || country || anime.source) ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              <DetailItem label="Format" value={anime.format} />
              <DetailItem label="Episodes" value={anime.episodes} />
              <DetailItem label="Duration" value={duration} />
              <DetailItem label="Source" value={anime.source} />
              <DetailItem label="Season" value={anime.season && anime.season_year ? `${anime.season} ${anime.season_year}` : (anime.season_year ? String(anime.season_year) : null)} />
              <DetailItem label="Start Date" value={startDateStr} />
              <DetailItem label="End Date" value={endDateStr} />
              <DetailItem label="Country" value={country} />
            </dl>
          </section>
        ) : null}

        {/* Community */}
        {(anime.mean_score || anime.popularity || anime.favourites || topRankings.length > 0) ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Community</h2>
            <div className="flex flex-wrap gap-3">
              {anime.mean_score ? (
                <div className="rounded-lg bg-surface-2 px-4 py-2 text-center">
                  <div className="text-xl font-bold text-ink">{anime.mean_score}</div>
                  <div className="text-xs text-muted">Mean Score</div>
                </div>
              ) : null}
              {anime.popularity ? (
                <div className="rounded-lg bg-surface-2 px-4 py-2 text-center">
                  <div className="text-xl font-bold text-ink">{anime.popularity.toLocaleString()}</div>
                  <div className="text-xs text-muted">Popularity</div>
                </div>
              ) : null}
              {anime.favourites ? (
                <div className="rounded-lg bg-surface-2 px-4 py-2 text-center">
                  <div className="text-xl font-bold text-ink">{anime.favourites.toLocaleString()}</div>
                  <div className="text-xs text-muted">Favourites</div>
                </div>
              ) : null}
              {topRankings.map((r) => (
                <div key={`${r.type}-${r.rank}`} className="rounded-lg bg-accent-soft px-4 py-2 text-center">
                  <div className="text-xl font-bold text-accent">#{r.rank}</div>
                  <div className="text-xs text-accent/70">{r.context}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Studios */}
        {studios.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Studios</h2>
            <div className="flex flex-wrap gap-2">
              {studios.map((edge) => {
                if (!edge.node) return null;
                return (
                  <span
                    key={edge.node.name}
                    className={`rounded-full px-3 py-1 text-sm ${edge.isMain ? "bg-accent-soft font-medium text-accent" : "border border-line-strong text-muted"}`}
                  >
                    {edge.node.siteUrl ? (
                      <a href={edge.node.siteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {edge.node.name}
                      </a>
                    ) : (
                      edge.node.name
                    )}
                  </span>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Themes / Tags */}
        {tags.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Themes</h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.name}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs text-muted"
                  title={tag.category ?? undefined}
                >
                  {tag.name}
                  {tag.rank ? <span className="ml-1 opacity-50">{tag.rank}%</span> : null}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Trailer */}
        {trailer ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Trailer</h2>
            <a
              href={`https://www.youtube.com/watch?v=${trailer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-block overflow-hidden rounded-card"
            >
              {trailer.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={trailer.thumbnail}
                  alt="Trailer thumbnail"
                  className="h-40 w-auto object-cover transition-opacity group-hover:opacity-80"
                />
              ) : null}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper/80 backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-0.5 text-ink">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </a>
          </section>
        ) : null}

        {/* Links */}
        {(anime.site_url || infoLinks.length > 0 || streamingLinks.length > 0) ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Links</h2>
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
              {streamingLinks.length > 0 ? (
                <div className="w-full">
                  <p className="mb-1.5 text-xs text-muted">Stream on:</p>
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
          </section>
        ) : null}

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
            <Link href="/auth/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>{" "}
            to track this anime.
          </p>
        )}
      </div>
    </div>
  );
}
