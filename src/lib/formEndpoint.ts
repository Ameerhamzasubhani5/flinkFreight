/**
 * Resolves where the forms POST to.
 *
 * With the full Node.js deployment, the API lives at the same origin,
 * so a relative path is always correct.
 */
export function formEndpoint(path: `/api/${string}`): string {
  return path;
}
