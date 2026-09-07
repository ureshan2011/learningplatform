"use client";

import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber,
  type User as FirebaseUser,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import type { Send } from "./machine";

export type { FirebaseUser };

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

/**
 * A stuck reCAPTCHA challenge must not hold the "Sending…" state forever —
 * that is what made the old screen look hung. Twenty seconds is generous for
 * the invisible check; if Google actually escalates to a visible one the
 * student sees it in this window (the container renders in flow, right under
 * the button) or the screen tells them plainly to try again.
 */
const SEND_TIMEOUT_MS = 20_000;

class TimeoutError extends Error {
  constructor() {
    super("send_timeout");
    this.name = "TimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export { TimeoutError };

let verifier: RecaptchaVerifier | null = null;

/**
 * Tears the invisible reCAPTCHA down.
 *
 * A verifier is single-use, and this has to run after *every* send — success,
 * failure, or timeout — not only a failed one. Skipping it on the happy path
 * left a consumed widget behind that broke the very next send attempted from
 * the same mount (a resend, or "change number" and try again).
 */
function resetVerifier(): void {
  try {
    verifier?.clear();
  } catch {
    // Already torn down, or the container is gone. Nothing to recover.
  }
  verifier = null;
}

/**
 * Sends an OTP to `e164` and returns Firebase's verification id for it.
 *
 * The id — not a `ConfirmationResult` — is the only thing kept: it is a plain
 * string that survives a page refresh and can be redeemed later with
 * `PhoneAuthProvider.credential`, which is what lets a late SMS from an
 * earlier send still work after the student has already resent.
 */
export async function sendOtp(e164: string): Promise<string> {
  const auth = clientAuth();
  resetVerifier();
  verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, { size: "invisible" });
  try {
    const confirmation = await withTimeout(
      signInWithPhoneNumber(auth, e164, verifier),
      SEND_TIMEOUT_MS,
    );
    return confirmation.verificationId;
  } finally {
    resetVerifier();
  }
}

/** Redeems one stored verification id against a six-digit code. */
function verifyOtp(verificationId: string, code: string): Promise<FirebaseUser> {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return signInWithCredential(clientAuth(), credential).then((cred) => cred.user);
}

export type VerifyOutcome =
  | { ok: true; user: FirebaseUser }
  /** No send matched: `wrong` if at least one rejected as a bad code, `expired` only if every one did. */
  | { ok: false; kind: "wrong" | "expired" | "other"; error: unknown };

/**
 * Tries a code against every send this attempt has made, newest first.
 *
 * This is the fix for the two most confusing bugs in the old screen: a code
 * from the first SMS that arrives late, after a resend, is still tried and
 * still works; and a code that genuinely does not match any send comes back
 * as one clear, correctly-worded outcome rather than whatever the
 * last-tried send's error happened to be.
 */
export async function verifyAgainstSends(sends: Send[], code: string): Promise<VerifyOutcome> {
  if (sends.length === 0) {
    return { ok: false, kind: "expired", error: new Error("no_sends") };
  }

  const newestFirst = [...sends].reverse();
  let allExpired = true;
  let lastError: unknown = null;

  for (const send of newestFirst) {
    try {
      const user = await verifyOtp(send.verificationId, code);
      return { ok: true, user };
    } catch (err) {
      lastError = err;
      const errCode = String((err as { code?: string })?.code ?? "");
      if (errCode.includes("code-expired")) {
        continue; // Try the next older send — it may still be within its window.
      }
      if (errCode.includes("invalid-verification-code")) {
        allExpired = false;
        continue; // Try the next older send — it may still be the right one.
      }
      // Anything else (network, too-many-requests, ...) applies to every send
      // equally; trying an older one cannot change the outcome.
      return { ok: false, kind: "other", error: err };
    }
  }

  return { ok: false, kind: allExpired ? "expired" : "wrong", error: lastError };
}
