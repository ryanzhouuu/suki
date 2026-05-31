"use client";

import { useActionState } from "react";

import {
  refreshRecommendations,
  type RecommendationsActionState,
} from "@/actions/recommendations";
import { Button } from "@/components/ui/button";

export function RefreshRecommendationsButton() {
  const [state, action, pending] = useActionState(
    async (): Promise<RecommendationsActionState> => refreshRecommendations(),
    {},
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Refreshing…" : "Refresh"}
        </Button>
      </form>
      {state.error ? (
        <p className="max-w-xs text-right text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-right text-sm text-muted">{state.message}</p>
      ) : null}
    </div>
  );
}
