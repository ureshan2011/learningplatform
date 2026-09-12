/**
 * When the policy set last changed.
 *
 * Lives in a module with no React in it because two very different places need
 * it: the four policy pages print it at the top, and `provisionUser` stamps it
 * onto an account as the version of the terms that account agreed to. Without
 * the second, "they accepted the terms" means nothing a year later — the terms
 * will have been edited twice by then, and nobody could say which wording a
 * particular student was shown.
 *
 * Bump both constants together whenever the wording of the Terms, the Privacy
 * policy or the Refund policy materially changes. That is what makes an old
 * acceptance visibly old.
 */
export const POLICY_VERSION = "2026-09-12";

/** The same date, written the way the policy pages print it. */
export const POLICY_UPDATED = "12 September 2026";
