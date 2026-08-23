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

const MAX_TICKS = 26;
const MAX_UNKNOWN_HEAD_TICKS = 12;
const CHIP_VISIBLE_MS = 4000;

export type FeedbackChip =
  | { kind: "saved"; value: number }
  | { kind: "error"; value: number }
  | null;

type EpisodeProgressOptions = {
  entryId: string;
  progressEpisodes: number;
  totalEpisodes: number | null;
};

export function useEpisodeProgress({
  entryId,
  progressEpisodes,
  totalEpisodes,
}: EpisodeProgressOptions) {
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

  return {
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
  };
}

export function EpisodeFeedback({
  chip,
  onRetry,
  onUndo,
}: {
  chip: FeedbackChip;
  onRetry: () => void;
  onUndo: () => void;
}) {
  if (chip?.kind === "error") {
    return (
      <span className="text-danger">
        Couldn’t save{" "}
        <button
          type="button"
          onClick={onRetry}
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
          onClick={onUndo}
          className="font-medium text-accent underline underline-offset-2"
        >
          Undo
        </button>
      </span>
    );
  }
  return null;
}

export function ProgressStrip({
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

export function EyeGlyph() {
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

export function CaretGlyph({ open }: { open: boolean }) {
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

export function MinusGlyph() {
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

export function CheckGlyph() {
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
