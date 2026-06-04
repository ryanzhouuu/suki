import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import { getUserRecommendations } from "@/lib/recommendations/queries";

type RecommendationsPreviewProps = {
  userId: string;
};

export async function RecommendationsPreview({
  userId,
}: RecommendationsPreviewProps) {
  if (!isEmbeddingConfigured()) return null;

  const items = await getUserRecommendations(userId);
  const preview = items.slice(0, 4);
  if (preview.length === 0) return null;

  return (
    <section className="animate-rise [animation-delay:200ms]">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">For you</p>
          <h2 className="mt-1 text-2xl font-semibold">Recommended next</h2>
        </div>
        <Link
          href="/recommendations"
          className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          See all →
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {preview.map((row) => {
          const title =
            row.anime.english_title || row.anime.romaji_title || "Unknown";
          return (
            <li key={row.id}>
              <Link
                href={`/anime/${row.anime.anilist_id}`}
                className="group flex gap-3 rounded-card border border-line bg-surface p-3 transition-all hover:border-accent"
              >
                <AnimePoster
                  src={row.anime.cover_image_url}
                  alt={title}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="line-clamp-1 font-medium text-ink group-hover:text-accent">
                    {title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {row.parsedExplanationDetails?.primaryReason ?? row.explanation}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
