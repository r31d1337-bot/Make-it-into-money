/**
 * In-memory per-user (or per-IP) rate limiter with a rolling window.
 *
 * Good enough for a single-instance deployment (Railway/DO droplet). If you
 * scale to multiple processes, swap this for Redis/Upstash — same interface.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type Category = "monetize" | "pro-tool" | "share";

export type RateLimit = { limit: number; windowMs: number; name: string };

const DAY_MS = 24 * 60 * 60 * 1000;

export const LIMITS: Record<Category, RateLimit> = {
  // Free tool — keep it generous but cap so one loop can't burn your API bill.
  monetize: { limit: 20, windowMs: DAY_MS, name: "monetize" },
  // Pro tools — "unlimited" feel, hard cap so a runaway client can't drain Opus credits.
  "pro-tool": { limit: 100, windowMs: DAY_MS, name: "pro-tool" },
  share: { limit: 30, windowMs: DAY_MS, name: "share" },
};

export type RateCheck =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; message: string };

/**
 * Check-and-increment. Returns ok:false if the caller has exceeded the daily
 * cap. Buckets are lazily expired — no background timer needed.
 */
export function checkRateLimit(key: string, category: Category): RateCheck {
  const rule = LIMITS[category];
  const fullKey = `${category}:${key}`;
  const now = Date.now();
  const bucket = buckets.get(fullKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(fullKey, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, remaining: rule.limit - 1, resetAt: now + rule.windowMs };
  }

  if (bucket.count >= rule.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      ok: false,
      retryAfterSec,
      message: `Daily limit reached (${rule.limit}/${hoursFromMs(rule.windowMs)}h). Try again in ${humanizeSec(retryAfterSec)}.`,
    };
  }

  bucket.count++;
  return { ok: true, remaining: rule.limit - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Build a stable rate-limit key from the request. Prefers signed-in user id;
 * falls back to the first X-Forwarded-For / X-Real-IP IP if anonymous.
 */
export function rateLimitKey(userId: string | null, req: Request): string {
  if (userId) return `u:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `ip:${ip}`;
}

export function rateLimitResponse(check: Extract<RateCheck, { ok: false }>): Response {
  return new Response(check.message, {
    status: 429,
    headers: {
      "Retry-After": String(check.retryAfterSec),
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function hoursFromMs(ms: number): number {
  return Math.round(ms / (60 * 60 * 1000));
}

function humanizeSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.ceil(sec / 60)}m`;
  return `${Math.ceil(sec / 3600)}h`;
}
