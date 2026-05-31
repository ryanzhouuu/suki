import Link from "next/link";

import { loadRecommendationsForUser, logRecommendationViewed } from "@/actions/recommendations";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RefreshRecommendationsButton } from "@/components/recommendations/refresh-recommendations-button";
import { requireProfile } from "@/lib/auth/session";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";

export default async function RecommendationsPage() {
  const { user } = await requireProfile();

  if (!isEmbeddingConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pb-24 sm:pb-10">
        <p className="eyebrow">For you</p>
        <h1 className="text-4xl font-semibold">Recommendations</h1>
        <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">
          Recommendations need <code className="text-ink">OPENAI_API_KEY</code>{" "}
          in your server environment. Add it to <code>.env.local</code> and
          restart the dev server.
        </p>
      </div>
    );
  }

  const { items } = await loadRecommendationsForUser(user.id);
  await logRecommendationViewed();

  return (
    <div className="space-y-8 pb-24 sm:pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">For you</p>
          <h1 className="mt-1.5 text-4xl font-semibold">Recommendations</h1>
          <p className="mt-2 max-w-xl text-muted">
            Picked from your rankings, watchlist, and completed anime using
            semantic matching.
          </p>
        </div>
        <RefreshRecommendationsButton />
      </div>

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">Not enough signal yet</p>
          <p className="mt-2 text-sm text-muted">
            Complete and rank a few series, or add anime to your library so we
            can learn your taste. We also need embedded anime in the catalog — try{" "}
            <Link href="/search" className="font-semibold text-accent hover:underline">
              searching
            </Link>{" "}
            and adding titles first.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((row) => (
            <RecommendationCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
