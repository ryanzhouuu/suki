/**
 * Process-local token-bucket limiter. Pure and injectable: it never sleeps —
 * `reserve()` returns the number of milliseconds the caller should wait before
 * proceeding, so it can be unit-tested with an injected clock and no real timers.
 *
 * A burst up to `capacity` proceeds immediately; beyond that, reservations are
 * paced out at `refillPerMs`. Reserved-but-not-yet-available tokens push the
 * bucket negative so a burst is spread across time rather than slammed at once.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefillMs: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.tokens = capacity;
    this.lastRefillMs = now();
  }

  /** Reserve one token; returns ms to wait before using it (0 if available now). */
  reserve(): number {
    const nowMs = this.now();
    this.tokens = Math.min(
      this.capacity,
      this.tokens + (nowMs - this.lastRefillMs) * this.refillPerMs,
    );
    this.lastRefillMs = nowMs;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return 0;
    }

    const waitMs = (1 - this.tokens) / this.refillPerMs;
    this.tokens -= 1;
    return waitMs;
  }
}
