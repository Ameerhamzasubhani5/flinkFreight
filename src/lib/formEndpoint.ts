/**
 * Resolves where the forms POST to.
 *
 * The site ships in two shapes:
 *
 *   • Full Next.js app (local dev, and the deployment that runs the API) —
 *     the API lives at the same origin, so a relative path is correct.
 *
 *   • Static export on STRATO — those files are just HTML/CSS/JS with no
 *     server behind them, so the forms must call the API deployment by its
 *     absolute URL instead.
 *
 * Set NEXT_PUBLIC_FORM_API_BASE at build time for the static build, e.g.
 *   NEXT_PUBLIC_FORM_API_BASE=https://flinkfreight-api.vercel.app
 *
 * Leave it unset everywhere else and the relative path is used.
 */
const BASE = (process.env.NEXT_PUBLIC_FORM_API_BASE ?? "").replace(/\/+$/, "");

export function formEndpoint(path: `/api/${string}`): string {
  return BASE ? `${BASE}${path}` : path;
}
