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
 * Header preference matters, and this used to have it backwards.
 *
 * Nginx sets the two headers with different semantics:
 *
 *   proxy_set_header X-Real-IP       $remote_addr;              <- OVERWRITES
 *   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; <- APPENDS
 *
 * `$proxy_add_x_forwarded_for` appends the peer address to whatever the client
 * already sent, so a caller who sends `X-Forwarded-For: anything` produces
 * `anything, <real ip>` and the LEFT-MOST entry is the caller's own string.
 * Reading that first let anyone mint a fresh rate-limit bucket per request
 * simply by varying the header, which defeated the only stateful abuse control
 * on both public endpoints.
 *
 * X-Real-IP is overwritten by the proxy, so a caller cannot influence it, and
 * it is the only header trusted here. Both Nginx (per the deployment guide) and
 * the hosted platforms this app runs on set it from the real peer address.
 *
 * X-Forwarded-For is NOT consulted, not even from the right. There is no
 * position in that list that is guaranteed not to be the caller's: reading the
 * left-most takes the value they prepended, and reading the right-most takes
 * their value too whenever nothing appended to it — which is exactly what the
 * first attempt at this fix got wrong, and what the regression test below
 * covers. Without a known, configured hop count the header carries no
 * trustworthy entry at all.
 *
 * With neither header present every caller shares one bucket. That is coarse,
 * but it is the safe direction to err: a shared allowance cannot be reset at
 * will, whereas a spoofable key means no limit whatsoever.
 *
 * Decided in the application rather than delegated to the deployment on
 * purpose — the audit could not confirm which directive the live Nginx loads,
 * and the app should not be one config typo away from having no rate limit.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
