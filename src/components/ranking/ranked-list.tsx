import { AnimePoster } from "@/components/anime/anime-poster";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import type { Tables } from "@/types/database";

type RankedRow = Tables<"derived_rankings"> & { anime: Tables<"anime"> | null };

export function RankedList({ rankings }: { rankings: RankedRow[] }) {
  if (rankings.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Complete anime and compare them to build your ranking.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {rankings.map((row) => {
        const anime = row.anime;
        if (!anime) return null;
        const title = anime.english_title || anime.romaji_title;
        return (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
          >
            <span className="w-6 text-sm font-semibold text-zinc-400">
              {row.rank}
            </span>
            <AnimePoster src={anime.cover_image_url} alt={title} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{title}</p>
              <p className="text-xs text-zinc-500">
                {CONFIDENCE_LABELS[row.confidence]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
