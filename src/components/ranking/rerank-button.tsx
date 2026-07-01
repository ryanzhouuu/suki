"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetSeriesRanking } from "@/actions/ranking";
import { Button } from "@/components/ui/button";

type RerankButtonProps = {
  seriesId: string;
  title: string;
};

export function RerankButton({ seriesId, title }: RerankButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function rerank() {
    if (
      !confirm(
        `Re-rank "${title}"? This clears your comparisons for it and asks fresh ones.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetSeriesRanking(seriesId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={rerank}
        disabled={pending}
        className="min-h-8 px-2.5 text-xs opacity-100 transition-opacity sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
      >
        {pending ? "Re-ranking…" : "Re-rank"}
      </Button>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
