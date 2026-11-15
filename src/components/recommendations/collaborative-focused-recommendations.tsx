import { FocusedRecommendations } from "@/components/recommendations/focused-recommendations";
import type { RecommendationRow } from "@/lib/recommendations/types";

type CollaborativeFocusedRecommendationsProps = {
  items: RecommendationRow[];
  artwork?: Record<number, string>;
};

export function CollaborativeFocusedRecommendations({
  items,
  artwork,
}: CollaborativeFocusedRecommendationsProps) {
  return (
    <FocusedRecommendations
      items={items}
      artwork={artwork}
      contextLabel="Shared recommendation"
      whyLabel="Why this works for both of you"
    />
  );
}
