"use client";

import { useEffect, useState } from "react";

import {
  getRecipientAnimeHint,
  sendAnimeRecommendation,
} from "@/actions/friend-recommendations";
import { Button } from "@/components/ui/button";
import { FRIEND_REC_NOTE_MAX } from "@/lib/friend-recommendations/view-model";

type RecommendComposerProps = {
  recipientUserId: string;
  anilistId: number;
  /** Title of the anime being sent, shown in the confirmation. */
  animeTitle: string;
  /** Display name of the recipient, shown in the confirmation. */
  recipientName: string;
  /** Render a control to go back and change the selection (optional). */
  onReset?: () => void;
  resetLabel?: string;
};

export function RecommendComposer({
  recipientUserId,
  anilistId,
  animeTitle,
  recipientName,
  onReset,
  resetLabel = "Change",
}: RecommendComposerProps) {
  const [note, setNote] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getRecipientAnimeHint(recipientUserId, anilistId);
      if (!cancelled) setHint(result.message);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipientUserId, anilistId]);

  async function handleSend() {
    setSubmitting(true);
    setError(null);
    const result = await sendAnimeRecommendation(
      recipientUserId,
      anilistId,
      note.trim() || null,
    );
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="mt-3 text-sm text-ink">
          Sent <span className="font-semibold">{animeTitle}</span> to{" "}
          <span className="font-semibold">{recipientName}</span>.
        </p>
      </div>
    );
  }

  const remaining = FRIEND_REC_NOTE_MAX - note.length;

  return (
    <div className="space-y-4">
      {hint ? (
        <p className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-xs font-medium text-accent">
          {hint}
        </p>
      ) : null}

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="rec-note"
            className="text-xs font-semibold uppercase tracking-wide text-faint"
          >
            Add a note
            <span className="ml-1.5 font-normal lowercase tracking-normal">
              (optional)
            </span>
          </label>
          <span
            className={`text-xs ${remaining < 0 ? "text-danger" : "text-faint"}`}
          >
            {remaining}
          </span>
        </div>
        <textarea
          id="rec-note"
          value={note}
          maxLength={FRIEND_REC_NOTE_MAX + 40}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Why they'll love it…"
          className="mt-2 w-full resize-none rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
        />
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {onReset ? (
          <Button variant="ghost" size="sm" type="button" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          disabled={submitting || remaining < 0}
          onClick={handleSend}
        >
          {submitting ? "Sending…" : "Send recommendation"}
        </Button>
      </div>
    </div>
  );
}
