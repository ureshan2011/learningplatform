"use client";

import type { Attempt, Send } from "./machine";

const KEY = "ictclass_otp_attempt";

/**
 * How long a stored attempt is worth restoring on refresh.
 *
 * Firebase's own codes expire well inside this window in practice, but the
 * real reason for a ceiling is different: past this age the student has
 * almost certainly moved on, and showing a ten-minute-old "sent to" timer
 * reads as broken rather than helpful. Past it, the screen simply starts at
 * the phone step instead.
 */
const MAX_AGE_MS = 10 * 60_000;

/**
 * Restores the in-progress code attempt across a refresh.
 *
 * The `ConfirmationResult` object the old screen kept in a ref could not
 * survive a reload; this keeps only what actually needs to — the
 * verification ids — so a refreshed tab still redeems whichever SMS arrives,
 * without asking Firebase for anything new.
 */
export function readAttempt(): Attempt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Attempt> | null;
    if (!parsed || typeof parsed.phone !== "string" || !Array.isArray(parsed.sends)) return null;

    const sends = parsed.sends.filter(
      (s): s is Send =>
        Boolean(s) && typeof s.verificationId === "string" && typeof s.sentAt === "number",
    );
    if (sends.length === 0) return null;

    const newestSentAt = Math.max(...sends.map((s) => s.sentAt));
    if (Date.now() - newestSentAt > MAX_AGE_MS) return null;

    return { phone: parsed.phone, sends, wrongAttempts: Number(parsed.wrongAttempts) || 0 };
  } catch {
    // Private mode, blocked storage, or corrupt JSON. Starting at the phone
    // step is a far better failure than throwing from a render.
    return null;
  }
}

export function writeAttempt(attempt: Attempt | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!attempt) {
      window.sessionStorage.removeItem(KEY);
      return;
    }
    window.sessionStorage.setItem(KEY, JSON.stringify(attempt));
  } catch {
    // Storage full or blocked — the in-memory state still carries this tab.
  }
}

export function clearAttempt(): void {
  writeAttempt(null);
}
