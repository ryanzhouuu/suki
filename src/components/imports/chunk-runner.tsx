"use client";

import { useEffect, useRef, useState } from "react";

import { processImportChunk } from "@/actions/imports";
import { isPendingWorkStatus } from "@/lib/imports/status";
import type { ImportJobProgress } from "@/lib/imports/types";

import { ImportProgress } from "./import-progress";

type ChunkRunnerProps = {
  initialJob: ImportJobProgress;
  /** Called once the loop reaches a state with no automatic work left. */
  onStop?: (job: ImportJobProgress) => void;
};

/**
 * Drives the client-side chunk loop: repeatedly advances the job a chunk until
 * it reaches a state awaiting the user (needs_review) or terminal. Resumes
 * automatically whenever it mounts, so revisiting the page continues the work.
 */
export function ChunkRunner({ initialJob, onStop }: ChunkRunnerProps) {
  const [job, setJob] = useState(initialJob);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick(current: ImportJobProgress) {
      if (cancelled) return;
      if (!isPendingWorkStatus(current.status)) {
        if (!stoppedRef.current) {
          stoppedRef.current = true;
          onStop?.(current);
        }
        return;
      }
      const next = await processImportChunk(current.id);
      if (cancelled || !next) return;
      setJob(next);
      void tick(next);
    }

    void tick(job);
    return () => {
      cancelled = true;
    };
    // Run once on mount; the loop chains itself via tick().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ImportProgress job={job} />;
}
