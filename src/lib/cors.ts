import { NextResponse } from "next/server";

/**
 * CORS helpers for the form endpoints.
 *
 * With the full Node.js deployment on STRATO, the pages and the API are
 * served from the same origin — so cross-origin requests are not expected
 * in normal operation. These helpers are kept as thin pass-throughs so the
 * API route code does not need to change, and in case the site is ever
 * served from more than one origin again.
 */

/** Headers to attach when the caller's origin is trusted. */
export function corsHeaders(_origin: string | null): Record<string, string> {
  // Same-origin: no CORS headers needed. If cross-origin support is ever
  // needed again, restore the ALLOWED_ORIGINS check from git history.
  return {};
}

/** Answers the browser's pre-flight check before a cross-origin POST. */
export function preflight(_request: Request): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/** Copies CORS headers onto a response that is about to be returned. */
export function withCors(response: NextResponse, _request: Request): NextResponse {
  return response;
}
