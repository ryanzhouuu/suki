import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";

export type TopRankedSeries = {
  id: string;
  rank: number;
  title: string;
  anilistId: number;
  coverUrl: string | null;
};

/**
 * The profile's top five ranked series as large posters with outlined rank
 * numerals, the same treatment as the home page's ranked rows.
 */
export function ProfileTopRanked({ series }: { series: TopRankedSeries[] }) {
  if (series.length === 0) return null;
  return (
    <section aria-labelledby="profile-top-ranked-title" className="min-w-0">
      <h2
        id="profile-top-ranked-title"
        className="font-display text-3xl font-medium text-ink sm:text-4xl"
      >
        {series.length >= 5 ? "Top five" : "Top ranked"}
      </h2>
      <ol className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5">
        {series.slice(0, 5).map((item) => (
          <li key={item.id} className="min-w-0">
            <Link href={`/anime/${item.anilistId}`} className="group block">
              <div className="relative pl-5 sm:pl-7">
                <AnimePoster
                  src={item.coverUrl}
                  alt={item.title}
                  fill
                  className="rounded-md ring-1 ring-white/10 transition-opacity group-hover:opacity-85"
                />
                <span aria-hidden="true" className="rank-numeral">
                  {item.rank}
                </span>
              </div>
              <span className="sr-only">Rank {item.rank}. </span>
              <p className="mt-2 line-clamp-2 pl-5 text-sm leading-snug text-ink/90 transition-colors group-hover:text-accent sm:pl-7">
                {item.title}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
