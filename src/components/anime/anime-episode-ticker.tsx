"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CaretGlyph,
  CheckGlyph,
  EpisodeFeedback,
  EyeGlyph,
  ProgressStrip,
  useEpisodeProgress,
} from "@/components/library/episode-progress";

export type AnimeEpisodeTickerProps = {
  entryId: string;
  progressEpisodes: number;
  totalEpisodes: number | null;
  title?: string;
  className?: string;
};

export function AnimeEpisodeTicker({
  entryId,
  progressEpisodes,
  totalEpisodes,
  title,
  className = "",
}: AnimeEpisodeTickerProps) {
  const {
    value,
    hasTotal,
    atTotal,
    chip,
    editorOpen,
    editorDraft,
    setEditorDraft,
    push,
    undoLast,
    retrySave,
    toggleEditor,
    submitEditor,
    handleEditorKeyDown,
  } = useEpisodeProgress({
    entryId,
    progressEpisodes,
    totalEpisodes,
  });
  const prefix = title ? `${title}: ` : "";
  const feedback = (
    <EpisodeFeedback chip={chip} onRetry={retrySave} onUndo={undoLast} />
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleEditor}
          aria-expanded={editorOpen}
          aria-label={`${prefix}set episodes watched`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line-strong bg-surface px-2.5 py-1 font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <span className="text-xs">
            EP {value}
            {hasTotal ? (
              <span className="ml-0.5 text-faint">/ {totalEpisodes}</span>
            ) : null}
          </span>
          <CaretGlyph open={editorOpen} />
        </button>
        <ProgressStrip value={value} total={hasTotal ? totalEpisodes : null} />
      </div>

      <div className="mt-1.5">
        {atTotal ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled
            className="w-full"
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
            className="w-full"
          >
            <EyeGlyph /> + Episode
          </Button>
        )}
      </div>

      {editorOpen ? (
        <div
          className="mt-1.5 animate-fade rounded-lg border border-line bg-surface p-2"
          onKeyDown={handleEditorKeyDown}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
            Set episodes watched
          </p>
          <form
            className="mt-1.5 flex items-center gap-1.5"
            onSubmit={submitEditor}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={editorDraft}
              onChange={(event) => setEditorDraft(event.target.value)}
              aria-label={`${prefix}episode count`}
              className="min-h-0 flex-1 px-2.5 py-1.5 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="shrink-0"
            >
              Set
            </Button>
          </form>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {hasTotal ? (
              <button
                type="button"
                onClick={() => push(totalEpisodes ?? 0)}
                className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent hover:text-on-accent"
              >
                Finish ({totalEpisodes})
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => push(0)}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:text-ink"
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}

      <p aria-live="polite" className="mt-1 min-h-4 text-[11px]">
        {feedback}
      </p>
    </div>
  );
}
