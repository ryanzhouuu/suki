"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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
  const [displayStatus, setDisplayStatus] = useState(currentStatus ?? null);

  useEffect(() => {
    setDisplayStatus(currentStatus ?? null);
  }, [currentStatus]);

  function handleStatus(status: AnimeEntryStatus) {
    const previous = displayStatus;
    setDisplayStatus(status);
    startTransition(async () => {
      const result = await addAnimeEntry(anilistId, status);
      if (result.error) {
        setDisplayStatus(previous);
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
