import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";

type TasteSimilarityBadgeProps = {
  similarity: TasteSimilarityResult;
  size?: "sm" | "md";
};

const UNAVAILABLE_COPY: Record<
  Extract<TasteSimilarityResult, { status: "unavailable" }>["reason"],
  string
> = {
  not_configured: "Similarity unavailable",
  insufficient_data: "Need more data",
  not_friends: "—",
};

export function TasteSimilarityBadge({
  similarity,
  size = "sm",
}: TasteSimilarityBadgeProps) {
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  if (similarity.status === "unavailable") {
    return (
      <span
        className={`inline-flex rounded-full bg-surface-2 font-medium text-muted ${sizeClass}`}
        title={UNAVAILABLE_COPY[similarity.reason]}
      >
        {UNAVAILABLE_COPY[similarity.reason]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-accent-soft font-display font-semibold text-accent ${sizeClass}`}
      title={similarity.label}
    >
      <span>{similarity.score}%</span>
      <span className="font-sans font-normal text-muted">match</span>
    </span>
  );
}
