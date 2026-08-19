/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — 2026-08-19.
 *
 * This coordinated two delivery channels (database + email) and accepted a
 * submission if either succeeded. With the database gone there is only one
 * channel left, so the API routes now simply await the email directly.
 *
 * Kept commented out in case it is needed again. To restore: uncomment
 * everything below and re-enable src/lib/mongodb.ts and the models.
 * ───────────────────────────────────────────────────────────────────────── */

/*
/**
 * Shared delivery strategy for the public forms (contact + career).
 *
 * A submission is stored in MongoDB *and* emailed to the team. Those are two
 * independent delivery channels, so we treat the submission as successful when
 * either one lands. That way a transient Atlas outage — or a missing Resend
 * key — can never silently lose a customer enquiry or a job application.
 *
 * Only when both channels fail does the caller get an error and a chance to
 * resend.
 *\/

// Hard ceiling on how long the database channel may hold the visitor's
// request open. The two channels run in parallel, so when Atlas is unreachable
// the email has already been sent by the time this fires — there is nothing to
// gain from making the visitor wait for the driver's own timeouts to unwind.
const STORE_TIMEOUT_MS = 8_000;

export interface DeliveryResult {
  stored: boolean;
  emailed: boolean;
  delivered: boolean;
}

function withTimeout<T>(task: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    task(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function deliverSubmission(
  label: string,
  store: () => Promise<unknown>,
  notify: () => Promise<unknown>
): Promise<DeliveryResult> {
  const [storeResult, notifyResult] = await Promise.allSettled([
    withTimeout(store, STORE_TIMEOUT_MS),
    notify(),
  ]);

  const stored = storeResult.status === "fulfilled";
  const emailed = notifyResult.status === "fulfilled";

  if (!stored) {
    console.error(`[${label}] database write failed:`, storeResult.reason);
  }
  if (!emailed) {
    console.error(`[${label}] email dispatch failed:`, notifyResult.reason);
  }
  if (stored !== emailed) {
    // Surfaced so the operator can reconcile: one channel has the submission
    // and the other does not.
    console.warn(
      `[${label}] partial delivery — stored: ${stored}, emailed: ${emailed}`
    );
  }

  return { stored, emailed, delivered: stored || emailed };
}

*/
