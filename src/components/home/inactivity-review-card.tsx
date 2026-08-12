"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";

import { resolveInactivityPrompt } from "@/actions/inactivity";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { DueInactivityPrompt } from "@/lib/inactivity/queries";

function PromptRow({
  prompt,
  onResolved,
}: {
  prompt: DueInactivityPrompt;
  onResolved: (entryId: string) => void;
}) {
  const [state, formAction, pending] = useActionState(resolveInactivityPrompt, {});

  useEffect(() => {
    if (state.resolvedEntryId) onResolved(state.resolvedEntryId);
  }, [state.resolvedEntryId, onResolved]);

  return (
    <li className="flex gap-3 rounded-xl border border-line bg-surface p-3">
      <AnimePoster
        src={prompt.anime.coverImageUrl}
        alt={`${prompt.anime.title} cover`}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/anime/${prompt.anime.anilistId}`}
          className="font-medium text-ink hover:text-accent"
        >
          {prompt.anime.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          Paused since {new Date(prompt.pausedAt).toLocaleDateString()}
        </p>
        <form
          action={formAction}
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            const submitter = (event.nativeEvent as SubmitEvent)
              .submitter as HTMLButtonElement | null;
            if (
              submitter?.value === "drop" &&
              !window.confirm(`Drop ${prompt.anime.title}?`)
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="entry_id" value={prompt.id} />
          <Button
            type="submit"
            name="decision"
            value="keep_paused"
            variant="secondary"
            size="sm"
            disabled={pending}
          >
            Keep paused
          </Button>
          <Button
            type="submit"
            name="decision"
            value="drop"
            variant="danger"
            size="sm"
            disabled={pending}
          >
            Drop
          </Button>
        </form>
        {state.error ? (
          <p className="mt-2 text-xs text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function InactivityReviewCard({
  prompts: initialPrompts,
}: {
  prompts: DueInactivityPrompt[];
}) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState(initialPrompts);

  const removePrompt = useCallback((entryId: string) => {
    setPrompts((current) => current.filter((prompt) => prompt.id !== entryId));
  }, []);

  if (prompts.length === 0) return null;

  return (
    <>
      <section className="rounded-card border border-line bg-surface p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div>
          <p className="eyebrow">Library check-in</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            {prompts.length === 1
              ? "One paused anime needs your attention"
              : `${prompts.length} paused anime need your attention`}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Decide whether to drop each title or keep it paused for now.
          </p>
        </div>
        <Button
          type="button"
          className="mt-4 shrink-0 sm:mt-0"
          onClick={() => setOpen(true)}
        >
          Review paused anime
        </Button>
      </section>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Review paused anime"
        subtitle={`${prompts.length} ${prompts.length === 1 ? "title" : "titles"} waiting`}
        maxWidthClassName="max-w-2xl"
      >
        <ul className="space-y-3">
          {prompts.map((prompt) => (
            <PromptRow
              key={prompt.id}
              prompt={prompt}
              onResolved={removePrompt}
            />
          ))}
        </ul>
      </Dialog>
    </>
  );
}
