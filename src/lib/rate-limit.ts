/**
 * Simple in-memory rate limiter for API routes.
 *
 * NOTE: In-memory state resets on cold starts (serverless).
 * For production, consider Redis (Upstash) or Vercel KV.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Cleans up expired entries every 60 seconds at most. */
let lastCleanup = 0;

function cleanExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Unique key for this rate limit bucket (e.g. "analyze:{ip}"). */
  key: string;
  /** Max requests within the window. */
  limit: number;
  /** Window duration in seconds. */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  cleanExpired();

  const now = Date.now();
  const entry = store.get(config.key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(config.key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/** Extracts a client identifier from a NextRequest. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitResponse(remaining: number, resetAt: number) {
  const headers = new Headers();
  headers.set("X-RateLimit-Remaining", String(remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  return new Response(
    JSON.stringify({ error: "请求过于频繁，请稍后再试。" }),
    { status: 429, headers: { "Content-Type": "application/json", ...Object.fromEntries(headers) } }
  );
}
