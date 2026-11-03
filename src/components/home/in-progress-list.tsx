import Link from "next/link";

import { SectionHeading } from "@/components/home/credit-line";
import { EpisodeTicker } from "@/components/library/episode-ticker";
import { formatEpisodeCredit } from "@/lib/home/featured";
import type { LibraryEntry } from "@/lib/library/queries";

const PREVIEW_COUNT = 6;

function titleOf(entry: LibraryEntry): string {
  return entry.anime.english_title || entry.anime.romaji_title || entry.anime.native_title || "Unknown";
}

/** Landscape cards for the shows the user is logging, capped as a home preview. */
export function InProgressList({ entries }: { entries: LibraryEntry[] }) {
  const preview = entries.slice(0, PREVIEW_COUNT);
  return (
    <section>
      <SectionHeading label="Your tracker" title="In progress" href="/library?status=watching" />
      {preview.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface/40 p-8 text-center">
          <p className="text-sm text-muted">
            Nothing in progress yet.{" "}
            <Link href="/search" className="font-semibold text-accent hover:underline">
              Search for anime
            </Link>{" "}
            to start your list.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {preview.map((entry) => {
            const title = titleOf(entry);
            const total = entry.anime.episodes;
            const art = entry.anime.banner_image_url || entry.anime.cover_image_url;
            const pct =
              total && total > 0
                ? Math.min(100, Math.round((entry.progress_episodes / total) * 100))
                : null;
            return (
              <li key={entry.id} className="min-w-0">
                <article className="relative overflow-hidden rounded-xl bg-surface-2">
                  <Link href={`/anime/${entry.anime.anilist_id}`} className="block">
                    <div className="relative aspect-video">
                      {art ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={art} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-surface-2" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 pr-28">
                        <p className="truncate font-medium text-white">{title}</p>
                        <p className="credit-line credit-line--on-art mt-1">
                          {formatEpisodeCredit(entry.progress_episodes, total)}
                        </p>
                      </div>
                      {pct != null ? (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20" aria-hidden="true">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      ) : null}
                    </div>
                  </Link>
                  <div className="absolute right-3 bottom-3 z-10">
                    <EpisodeTicker
                      variant="compact"
                      entryId={entry.id}
                      progressEpisodes={entry.progress_episodes}
                      totalEpisodes={total}
                      title={title}
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
