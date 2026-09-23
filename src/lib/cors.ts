import { NextResponse } from "next/server";

/**
 * CORS for the form endpoints.
 *
 * The website is served from STRATO while the API runs on a separate
 * deployment, so form submissions are cross-origin and the browser will block
 * them unless the API says which origins it trusts.
 *
 * Set ALLOWED_ORIGINS to a comma-separated list on the API deployment, e.g.
 *   ALLOWED_ORIGINS=https://flinkfreight.de,https://www.flinkfreight.de,https://flinkfreight.eu
 *
 * Anything not on the list is refused. Leaving it unset allows no cross-origin
 * caller at all, which is the safe default — same-origin requests (local dev,
 * or if the whole app is ever served from one place) never involve CORS.
 */
function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/** Headers to attach when the caller's origin is trusted. */
export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  const normalized = origin.replace(/\/+$/, "");
  if (!allowedOrigins().includes(normalized)) return {};
  return {
    "Access-Control-Allow-Origin": normalized,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    // Caches must not serve one origin's response to another.
    Vary: "Origin",
  };
}

/** Answers the browser's pre-flight check before a cross-origin POST. */
export function preflight(request: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** Copies CORS headers onto a response that is about to be returned. */
export function withCors(response: NextResponse, request: Request): NextResponse {
  for (const [key, value] of Object.entries(corsHeaders(request.headers.get("origin")))) {
    response.headers.set(key, value);
  }
  return response;
}
