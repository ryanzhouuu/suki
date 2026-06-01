import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";

import { TasteSimilarityBadge } from "./taste-similarity-badge";

const CONFIDENCE_COPY = {
  low: "Based on limited library data — compare more shows to sharpen this score.",
  medium: "Based on your libraries and rankings — still refining.",
  high: "Well-supported by both libraries and ranking activity.",
} as const;

type TasteSimilarityMeterProps = {
  similarity: TasteSimilarityResult;
  friendDisplayName: string;
};

export function TasteSimilarityMeter({
  similarity,
  friendDisplayName,
}: TasteSimilarityMeterProps) {
  if (similarity.status === "unavailable") {
    const messages = {
      not_configured:
        "Taste similarity requires server embedding configuration (OPENAI_API_KEY).",
      insufficient_data: `Build your taste profile first — complete a few anime and run comparisons. Ask ${friendDisplayName} to do the same.`,
      not_friends: "You must be friends to compare taste.",
    };

    return (
      <div className="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
        <p className="font-display text-xl text-ink">Taste match unavailable</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {messages[similarity.reason]}
        </p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (similarity.score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 rounded-card border border-line bg-surface p-8 sm:flex-row sm:items-center sm:gap-10">
      <div className="relative h-36 w-36 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface-2"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-accent transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold text-ink">
            {similarity.score}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted">match</span>
        </div>
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <TasteSimilarityBadge similarity={similarity} size="md" />
        <p className="mt-2 text-lg font-medium text-ink">{similarity.label}</p>
        <p className="mt-1 text-sm text-muted">
          {CONFIDENCE_COPY[similarity.confidence]}
        </p>
      </div>
    </div>
  );
}
