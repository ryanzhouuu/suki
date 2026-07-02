import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateActionThrottle, type ThrottleDecision } from "./evaluate";

export const RECOMMENDATION_REFRESH_COOLDOWN_MS = 60_000;
export const RECOMMENDATION_REFRESH_DAILY_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function checkRecommendationRefreshThrottle(
  userId: string,
  runKind: "personal" | "collaborative",
): Promise<ThrottleDecision> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { data, error } = await admin
    .from("recommendation_runs")
    .select("created_at")
    .eq("user_id", userId)
    .eq("run_kind", runKind)
    .gte("created_at", since);
  // Fail open on read errors: throttling is best-effort cost control.
  if (error || !data) return { allowed: true };
  return evaluateActionThrottle({
    recentTimestampsMs: data.map((r) => new Date(r.created_at).getTime()),
    nowMs: Date.now(),
    cooldownMs: RECOMMENDATION_REFRESH_COOLDOWN_MS,
    dailyLimit: RECOMMENDATION_REFRESH_DAILY_LIMIT,
  });
}
