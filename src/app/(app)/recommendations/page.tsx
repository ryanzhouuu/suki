import Link from "next/link";
import { after } from "next/server";

import { loadRecommendationsForUser, logRecommendationViewed } from "@/actions/recommendations";
import { ControlRail, WidePageFrame } from "@/components/layout/page-frame";
import { FocusedRecommendations } from "@/components/recommendations/focused-recommendations";
import { RecommendationPreferencesForm } from "@/components/recommendations/recommendation-preferences-form";
import { requireProfile } from "@/lib/auth/session";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import {
  FOCUSED_RECOMMENDATION_LIMIT,
  STORED_RECOMMENDATION_LIMIT,
} from "@/lib/recommendations/constants";
import { getRecommendationPoolStats } from "@/lib/recommendations/pool-stats";

export default async function RecommendationsPage() {
  const { user } = await requireProfile();

  if (!isEmbeddingConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
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

  after(() => {
    void logRecommendationViewed();
  });

  const pool =
    items.length < Math.min(8, STORED_RECOMMENDATION_LIMIT)
      ? await getRecommendationPoolStats(user.id)
      : null;
  const showPoolHint =
    pool !== null &&
    pool.eligibleCount <= items.length + 2;

  return (
    <WidePageFrame>
      <ControlRail
        sidebarLabel="Recommendation preferences"
        mobileDefaultOpen={items.length === 0}
        sidebar={
          <div className="space-y-4">
            <RecommendationPreferencesForm title="Recommendations" />

            {showPoolHint ? (
              <div className="rounded-card border border-line bg-surface-2/50 p-4 text-sm text-muted">
                <p className="font-medium text-ink">Small recommendation pool</p>
                <p className="mt-1.5 leading-relaxed">
                  Recommendations only come from anime we have embedded for
                  search ({pool.embeddedCount} titles). Your library excludes{" "}
                  {pool.libraryCount} of those, leaving about{" "}
                  <strong className="font-semibold text-ink">
                    {pool.eligibleCount}
                  </strong>{" "}
                  eligible match{pool.eligibleCount === 1 ? "" : "es"} right now
                  (up to {STORED_RECOMMENDATION_LIMIT} per refresh).
                </p>
                <p className="mt-2 leading-relaxed">
                  Grow the pool: run{" "}
                  <code className="text-ink">npm run seed:catalog</code>{" "}
                  locally, or search and open more anime in the app (each title
                  gets embedded when cached). Then use{" "}
                  <strong className="text-ink">Get recommendations</strong>{" "}
                  above.
                </p>
              </div>
            ) : null}
          </div>
        }
      >
        {items.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
            <p className="font-display text-xl text-ink">
              No recommendations yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Add and rank anime in your library, then use{" "}
              <strong className="text-ink">Get recommendations</strong> to
              generate suggestions (this can take a few seconds). You can also{" "}
              <Link href="/search" className="font-semibold text-accent hover:underline">
                search
              </Link>{" "}
              to grow the embedded catalog.
            </p>
          </div>
        ) : (
          <FocusedRecommendations
            items={items.slice(0, FOCUSED_RECOMMENDATION_LIMIT)}
          />
        )}
      </ControlRail>
    </WidePageFrame>
  );
}
