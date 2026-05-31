import { AnimePoster } from "@/components/anime/anime-poster";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import type { Tables } from "@/types/database";

type RankedRow = Tables<"derived_rankings"> & { anime: Tables<"anime"> | null };

export function RankedList({ rankings }: { rankings: RankedRow[] }) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
        <p className="text-sm text-muted">
          Complete anime and compare them to build your ranking.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {rankings.map((row) => {
        const anime = row.anime;
        if (!anime) return null;
        const title = anime.english_title || anime.romaji_title;
        const top = row.rank <= 3;
        return (
          <li
            key={row.id}
            className="group flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 transition-colors hover:border-accent"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold tabular-nums ${
                top
                  ? "bg-accent text-on-accent"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {row.rank}
            </span>
            <AnimePoster src={anime.cover_image_url} alt={title} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    row.confidence === "high"
                      ? "bg-success"
                      : row.confidence === "medium"
                        ? "bg-accent"
                        : "bg-faint"
                  }`}
                />
                {CONFIDENCE_LABELS[row.confidence]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
