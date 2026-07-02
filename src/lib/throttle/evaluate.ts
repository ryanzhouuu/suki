export type ThrottleDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cooldown + rolling 24h cap over past event timestamps (any order). */
export function evaluateActionThrottle(options: {
  recentTimestampsMs: number[];
  nowMs: number;
  cooldownMs: number;
  dailyLimit: number;
}): ThrottleDecision {
  const { recentTimestampsMs, nowMs, cooldownMs, dailyLimit } = options;
  const dayAgo = nowMs - DAY_MS;
  const withinDay = recentTimestampsMs.filter((t) => t > dayAgo && t <= nowMs);

  if (withinDay.length >= dailyLimit) {
    const oldest = Math.min(...withinDay);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest - dayAgo) / 1000)) };
  }

  const latest = withinDay.length > 0 ? Math.max(...withinDay) : null;
  if (latest !== null && nowMs - latest < cooldownMs) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((cooldownMs - (nowMs - latest)) / 1000)),
    };
  }
  return { allowed: true };
}
