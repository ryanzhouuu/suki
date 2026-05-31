"use client";

import { useTransition } from "react";

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
  const [pending, startTransition] = useTransition();

  function handleStatus(status: AnimeEntryStatus) {
    startTransition(async () => {
      await addAnimeEntry(anilistId, status);
    });
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      {ANIME_ENTRY_STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          variant={currentStatus === status ? "primary" : "secondary"}
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
