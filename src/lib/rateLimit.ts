// Spam defences for the two public form endpoints.
//
// ── Know what this does and does not buy you ─────────────────────────────────
// The store is an in-process Map. With a single long-running Node.js process
// behind PM2, this is exact: one process handles every request, so the
// counter is reliable. If the app is ever scaled to multiple PM2 instances
// (cluster mode), the real ceiling becomes 5 per IP per window *per instance*.
//
// This stops the cheap case — one script hammering the endpoint — which is
// what casual form spam actually looks like. It is not a defence against a
// distributed or patient attacker.
//
// To make it exact across multiple instances, the counter would need to live
// somewhere shared: Redis, or a rate-limit rule in Nginx.
// The honeypot in lib/honeypot.ts is the guard that does not depend on any of this.

/** Requests allowed per window, per IP, per endpoint. */
const MAX_REQUESTS = 5;
/** Sliding window length. */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

/**
 * Drops expired buckets so a long-running process doesn't accumulate one entry
 * per IP that ever touched the site. Called on each check — the map stays small
 * enough that a full sweep is cheaper than scheduling a timer.
 */
function sweep(now: number) {
  // forEach rather than for..of: the project compiles to ES5, where iterating a
  // Map directly needs downlevelIteration. Deleting during forEach is defined
  // behaviour — an entry removed before it is reached is simply not visited.
  buckets.forEach((hit, key) => {
    if (hit.resetAt <= now) buckets.delete(key);
  });
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may try again. Only meaningful when !ok. */
  retryAfter: number;
}

/**
 * Counts one request against `scope` for `ip`.
 *
 * Returns ok:false once an IP is over the limit, with the number of seconds to
 * wait — the caller turns that into a 429 and a Retry-After header.
 */
export function rateLimit(scope: string, ip: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${scope}:${ip}`;
  const hit = buckets.get(key);

  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  hit.count += 1;
  if (hit.count > MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.ceil((hit.resetAt - now) / 1000) };
  }

  return { ok: true, retryAfter: 0 };
}

/**
 * Best-effort client IP.
 *
 * Behind nginx (the production setup) X-Forwarded-For is set by our own proxy,
 * so its left-most entry is the real client. Direct traffic has no such header
 * and falls back to a single shared bucket, which is the safe direction to err:
 * unidentified callers share one allowance rather than each getting a fresh one.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
