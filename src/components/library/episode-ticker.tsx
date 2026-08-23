"use client";

import { Button } from "@/components/ui/button";
import {
  CheckGlyph,
  EpisodeFeedback,
  EyeGlyph,
  ProgressStrip,
  useEpisodeProgress,
} from "@/components/library/episode-progress";

export type EpisodeTickerProps = {
  entryId: string;
  progressEpisodes: number;
  totalEpisodes: number | null;
  variant?: "full" | "compact";
  title?: string;
  className?: string;
};

export function EpisodeTicker({
  entryId,
  progressEpisodes,
  totalEpisodes,
  variant = "full",
  title,
  className = "",
}: EpisodeTickerProps) {
  const {
    value,
    hasTotal,
    atTotal,
    chip,
    push,
    undoLast,
    retrySave,
  } = useEpisodeProgress({
    entryId,
    progressEpisodes,
    totalEpisodes,
  });
  const prefix = title ? `${title}: ` : "";
  const feedback = (
    <EpisodeFeedback chip={chip} onRetry={retrySave} onUndo={undoLast} />
  );

  if (variant === "compact") {
    return (
      <div className={`relative shrink-0 ${className}`}>
        {atTotal ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled
            className="px-2 text-[11px] sm:px-3 sm:text-xs"
          >
            <CheckGlyph /> Done
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => push(value + 1)}
            aria-label={title ? `${prefix}log next episode watched` : undefined}
            className="px-2 text-[11px] sm:px-3 sm:text-xs"
          >
            <EyeGlyph /> + Episode
          </Button>
        )}
        {chip ? (
          <p
            aria-live="polite"
            className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] shadow-sm"
          >
            {feedback}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-medium text-ink">
          EP {value}
          {hasTotal ? (
            <span className="ml-0.5 text-faint">/ {totalEpisodes}</span>
          ) : null}
        </span>
        {atTotal ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled
            className="shrink-0 px-2 text-[11px] sm:px-3 sm:text-xs"
          >
            <CheckGlyph /> Done
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => push(value + 1)}
            aria-label={title ? `${prefix}log next episode watched` : undefined}
            className="shrink-0 px-2 text-[11px] sm:px-3 sm:text-xs"
          >
            <EyeGlyph /> + Episode
          </Button>
        )}
      </div>

      <div className="mt-3 flex w-full">
        <ProgressStrip value={value} total={hasTotal ? totalEpisodes : null} />
      </div>

      <p aria-live="polite" className="mt-0.5 min-h-3 text-[11px]">
        {feedback}
      </p>
    </div>
  );
}

export function EpisodeProgressReadout({
  progressEpisodes,
  totalEpisodes,
  done = false,
  className = "",
}: {
  progressEpisodes: number;
  totalEpisodes: number | null;
  done?: boolean;
  className?: string;
}) {
  const hasTotal = totalEpisodes != null && totalEpisodes > 0;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex min-w-0 flex-1">
        <ProgressStrip
          value={progressEpisodes}
          total={hasTotal ? totalEpisodes : null}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-muted">
        {done ? (
          <span className="mr-1 inline-flex items-center gap-0.5 font-medium text-success">
            <CheckGlyph /> Done ·
          </span>
        ) : null}
        {progressEpisodes}
        {hasTotal ? ` / ${totalEpisodes}` : ""} episodes
      </span>
    </div>
  );
}
