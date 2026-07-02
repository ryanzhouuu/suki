import type { createClient } from "@/lib/supabase/server";

import { evaluateActionThrottle, type ThrottleDecision } from "./evaluate";

export const IMPORT_START_COOLDOWN_MS = 2 * 60_000;
export const IMPORT_START_DAILY_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function checkImportStartThrottle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ThrottleDecision> {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { data, error } = await supabase
    .from("anime_import_jobs")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since);
  // Fail open on read errors: throttling is best-effort cost control.
  if (error || !data) return { allowed: true };
  return evaluateActionThrottle({
    recentTimestampsMs: data.map((r) => new Date(r.created_at).getTime()),
    nowMs: Date.now(),
    cooldownMs: IMPORT_START_COOLDOWN_MS,
    dailyLimit: IMPORT_START_DAILY_LIMIT,
  });
}
