"use client";

import { useState, useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { heroPrimaryClass } from "@/components/home/hero-frame";

/** Adds the featured trending show to the signed-in user's plan-to-watch list. */
export function AddToListButton({ anilistId }: { anilistId: number }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (added) {
    return (
      <span className="inline-flex min-h-11 items-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white">
        On your list
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className={heroPrimaryClass}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await addAnimeEntry(anilistId, "plan_to_watch");
            if (result.error) {
              setError(result.error);
              return;
            }
            setAdded(true);
          });
        }}
      >
        {pending ? "Adding…" : "Add to list"}
      </button>
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </span>
  );
}
