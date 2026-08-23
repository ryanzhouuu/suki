"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { updateAnimeEntry } from "@/actions/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_TICKS = 26;
const MAX_UNKNOWN_HEAD_TICKS = 12;
const CHIP_VISIBLE_MS = 4000;

type FeedbackChip =
  | { kind: "saved"; value: number }
  | { kind: "error"; value: number }
  | null;

type EpisodeTickerProps = {
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<{
    value: number;
    baseline: number;
  } | null>(null);
  const [chip, setChip] = useState<FeedbackChip>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState("");
  const value =
    optimistic && progressEpisodes === optimistic.baseline
      ? optimistic.value
      : progressEpisodes;

  const inFlightRef = useRef(false);
  const queuedRef = useRef<number | null>(null);

  const hasTotal = totalEpisodes != null && totalEpisodes > 0;
  const atTotal = hasTotal && value >= totalEpisodes;
  const prefix = title ? `${title}: ` : "";

  useEffect(() => {
    if (chip?.kind !== "saved") return;
    const id = window.setTimeout(() => setChip(null), CHIP_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [chip]);

  function clampProgress(candidate: number): number {
    if (!Number.isFinite(candidate)) return progressEpisodes;
    const bounded = Math.max(0, Math.floor(candidate));
    const total = hasTotal ? (totalEpisodes ?? 0) : 0;
    return total > 0 ? Math.min(bounded, total) : bounded;
  }

  function push(next: number) {
    const target = clampProgress(next);
    setOptimistic({ value: target, baseline: progressEpisodes });
    setEditorOpen(false);
    setChip(null);

    if (inFlightRef.current) {
      queuedRef.current = target;
      return;
    }
    inFlightRef.current = true;
    startTransition(async () => {
      let sent = target;
      let result = await updateAnimeEntry(entryId, { progressEpisodes: sent });
      while (queuedRef.current !== null) {
        sent = queuedRef.current;
        queuedRef.current = null;
        result = await updateAnimeEntry(entryId, { progressEpisodes: sent });
      }
      inFlightRef.current = false;

      if (result.error) {
        setOptimistic(null);
        setChip({ kind: "error", value: sent });
        return;
      }

      router.refresh();
      setChip({ kind: "saved", value: sent });
    });
  }

  function undoLast() {
    const baseline = chip?.kind === "saved" ? chip.value : value;
    push(baseline - 1);
  }

  function retrySave() {
    if (chip?.kind === "error") push(chip.value);
  }

  function toggleEditor() {
    setEditorDraft(String(value));
    setEditorOpen((open) => !open);
  }

  function submitEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number.parseInt(editorDraft, 10);
    if (Number.isNaN(parsed)) {
      setEditorOpen(false);
      return;
    }
    push(parsed);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") setEditorOpen(false);
  }

  const feedback = (() => {
    if (chip?.kind === "error") {
      return (
        <span className="text-danger">
          Couldn’t save{" "}
          <button
            type="button"
            onClick={retrySave}
            className="font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </span>
      );
    }
    if (chip?.kind === "saved") {
      return (
        <span className="text-muted">
          Ep {chip.value} logged{" "}
          <button
            type="button"
            onClick={undoLast}
            className="font-medium text-accent underline underline-offset-2"
          >
            Undo
          </button>
        </span>
      );
    }
    return null;
  })();

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
        {feedback ? (
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
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => push(value - 1)}
          disabled={value <= 0}
          aria-label={`${prefix}step back one episode`}
          className="min-h-7 w-7 shrink-0 self-stretch px-0 sm:min-h-0"
        >
          <MinusGlyph />
        </Button>
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
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
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

function ProgressStrip({
  value,
  total,
}: {
  value: number;
  total: number | null;
}) {
  const hasTotal = total != null && total > 0;

  if (hasTotal && total <= MAX_TICKS) {
    return (
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(value, total)}
        aria-label={`${Math.min(value, total)} of ${total} episodes watched`}
        className="flex min-w-6 flex-1 items-center gap-[2px]"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-[1px] ${
              index < value ? "bg-accent" : "bg-surface-2"
            }`}
          />
        ))}
      </div>
    );
  }

  if (hasTotal) {
    const pct = Math.min(100, Math.round((value / total) * 100));
    return (
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(value, total)}
        aria-label={`${Math.min(value, total)} of ${total} episodes watched`}
        className="h-1 min-w-6 flex-1 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  const head = Math.min(Math.max(value, 0), MAX_UNKNOWN_HEAD_TICKS);
  return (
    <div aria-hidden className="flex min-w-6 flex-1 items-center gap-[2px]">
      {Array.from({ length: head }, (_, index) => (
        <span key={`head-${index}`} className="h-1 flex-1 rounded-[1px] bg-accent" />
      ))}
      {Array.from({ length: 4 }, (_, index) => (
        <span
          key={`tail-${index}`}
          className="h-1 flex-1 rounded-[1px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--line-strong) 0 2px, transparent 2px 4px)",
          }}
        />
      ))}
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
      <ProgressStrip
        value={progressEpisodes}
        total={hasTotal ? totalEpisodes : null}
      />
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

function EyeGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 8S4.2 3.9 8 3.9 14.5 8 14.5 8s-2.7 4.1-6.5 4.1S1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2.1" />
    </svg>
  );
}

function CaretGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6.5 4 4 4-4" />
    </svg>
  );
}

function MinusGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M3.5 8h9" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3.5 8.6 3 3L12.5 5" />
    </svg>
  );
}
