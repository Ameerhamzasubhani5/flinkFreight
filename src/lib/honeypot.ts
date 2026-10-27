// Shared by the client forms (which render the decoy) and the API routes
// (which check it), so it lives apart from lib/rateLimit.ts — that module is
// server-only state and has no business in the browser bundle.

/**
 * Name of the hidden field both forms render. A real visitor never sees it and
 * so never fills it in; naive bots fill every input they find. A filled value
 * means "bot", and the route answers with a normal success message so the bot
 * has no signal to adapt to.
 */
export const HONEYPOT_FIELD = "company_website";

/** True when the honeypot was filled — i.e. the submission is almost certainly a bot. */
export function isHoneypotFilled(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.trim() !== "";
}
