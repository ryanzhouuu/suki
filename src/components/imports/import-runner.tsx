"use client";

import { useRouter } from "next/navigation";

import type { ImportJobProgress } from "@/lib/imports/types";

import { ChunkRunner } from "./chunk-runner";

/** Runs the chunk loop on the import page and re-renders when a stage completes. */
export function ImportRunner({ job }: { job: ImportJobProgress }) {
  const router = useRouter();
  return <ChunkRunner initialJob={job} onStop={() => router.refresh()} />;
}
