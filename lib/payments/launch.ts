/**
 * Trial-only launch mode — the temporary state where nobody is charged.
 *
 * While this is on, ICT Campus takes no money from students at all: card
 * checkout and bank-slip upload are refused at the API, every "Pay" and
 * "Subscribe" control disappears from the student screens, and the only way in
 * is the free trial. Public pages say so plainly rather than quoting a price
 * the student cannot pay yet.
 *
 * ## Why a flag and not a deletion
 *
 * This is a launch decision, not a change of product. The prices, the PayHere
 * plumbing, the receipt series and the bank-slip flow all stay exactly as they
 * are, tested and working, so opening payments is one line here rather than a
 * re-implementation under time pressure.
 *
 * ## Turning payments on
 *
 * Set `TRIAL_ONLY_LAUNCH` to `false`, commit, push to `main`. App Hosting
 * redeploys and every payment route and button comes back on its own. Nothing
 * else has to be changed, and no Firestore document has to be edited.
 *
 * It is annotated `: boolean` deliberately — without it TypeScript narrows the
 * constant to the literal `true` and reports the `false` branches, which are
 * the branches the whole platform runs on after launch, as dead code.
 *
 * ## What this flag does NOT switch off
 *
 * - **The PayHere notification handler.** A notification that lands while this
 *   is on must still be logged and honoured. Refusing one would take a
 *   student's money and give them nothing, which is the single worst outcome
 *   this codebase has to avoid.
 * - **The teacher console.** Manual entry, slip approval and the ledger keep
 *   working: the teacher may still record a cash payment taken in person, and
 *   the books have to stay complete either way.
 */
export const TRIAL_ONLY_LAUNCH: boolean = true;

/** True while students must not be asked for money. */
export function paymentsPaused(): boolean {
  return TRIAL_ONLY_LAUNCH;
}

/**
 * Error code returned by the payment routes while payments are paused.
 *
 * Its own code rather than reusing `not_configured`: PayHere may well be
 * configured and working, and a teacher reading the logs should be able to
 * tell "we switched this off for launch" from "the credentials are missing".
 */
export const PAYMENTS_PAUSED_ERROR = "payments_paused";

/**
 * The launch message, in one place so every screen says the same thing.
 *
 * English only, because the public marketing pages are English. The signed-in
 * screens take their wording from `lib/i18n/dictionary.ts` under `launch.*`,
 * which carries the Sinhala.
 */
export const LAUNCH_NOTE = {
  eyebrow: "Final phase of launch",
  title: "Free trial is open. Payments are not.",
  body:
    "ICT Campus is in the final phase of launch, so we are not taking any payments yet. Start the free trial now — no payment required — and you will be told the day paid classes open.",
  short: "We are not taking payments yet — the free trial is open, no payment required.",
  cta: "Start free — no payment required",
} as const;
