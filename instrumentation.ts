/**
 * Runs once when a server instance actually starts serving traffic — never
 * during `next build`. This is what keeps the practice question bank in
 * sync with `lib/content/question-seed.ts` without anyone clicking a
 * "seed" button: every deploy boots fresh instances, each one runs this,
 * and the latest code is live the moment the deploy finishes.
 *
 * Failures here must never take the app down — a sync that could not run is
 * far less costly than a server that will not start. Guarded on credentials
 * for the same reason `lib/firebase/admin.ts` guards its own initialisation:
 * a local `next dev` or a CI build with no service account should not hang
 * or fail waiting on Application Default Credentials it will never get.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { hasAdminCredentials } = await import("@/lib/firebase/admin");
  if (!hasAdminCredentials()) return;

  try {
    const [{ syncQuestionSeed }, { publicEnv }] = await Promise.all([
      import("@/lib/content/sync-seed"),
      import("@/lib/env"),
    ]);
    const count = await syncQuestionSeed(publicEnv.tenantId);
    console.log(`[instrumentation] synced ${count} practice questions`);
  } catch (err) {
    console.error("[instrumentation] question sync failed; the server is starting anyway", err);
  }
}
