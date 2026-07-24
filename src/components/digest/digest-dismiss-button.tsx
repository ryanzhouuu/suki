"use client";

import { useActionState } from "react";

import { dismissDigest } from "@/actions/digest";

export function DigestDismissButton({
  digestId,
  weekLabel,
}: {
  digestId: string;
  weekLabel: string;
}) {
  const [state, action, pending] = useActionState(dismissDigest, {});
  return (
    <form action={action}>
      <input type="hidden" name="digest_id" value={digestId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Dismiss weekly recap for ${weekLabel}`}
        className="rounded-full px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
      >
        {pending ? "Dismissing…" : "Dismiss"}
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
