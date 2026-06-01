"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { Button } from "@/components/ui/button";
import {
  ANIME_ENTRY_STATUSES,
  STATUS_LABELS,
  type AnimeEntryStatus,
} from "@/lib/constants";

type StatusPickerProps = {
  anilistId: number;
  currentStatus?: AnimeEntryStatus | null;
  compact?: boolean;
};

export function StatusPicker({
  anilistId,
  currentStatus,
  compact = false,
}: StatusPickerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] =
    useState<AnimeEntryStatus | null>(null);

  if (
    optimisticStatus !== null &&
    currentStatus != null &&
    currentStatus === optimisticStatus
  ) {
    setOptimisticStatus(null);
  }

  const displayStatus = optimisticStatus ?? currentStatus ?? null;

  function handleStatus(status: AnimeEntryStatus) {
    setOptimisticStatus(status);
    startTransition(async () => {
      const result = await addAnimeEntry(anilistId, status);
      if (result.error) {
        setOptimisticStatus(null);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      {ANIME_ENTRY_STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          variant={displayStatus === status ? "primary" : "secondary"}
          size={compact ? "sm" : "md"}
          disabled={pending}
          onClick={() => handleStatus(status)}
        >
          {STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}
