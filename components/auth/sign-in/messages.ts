"use client";

import { interpolate } from "@/lib/i18n/dictionary";
import { publicEnv } from "@/lib/env";
import type { Notice } from "./machine";
import type { SignInCopy } from "./copy";
import { TimeoutError } from "./phone-auth";

/**
 * Turns anything that can go wrong sending a code, or a verify failure that
 * is not simply a wrong or expired code, into one notice a student can act
 * on. Never surfaces `err.message` — the unmapped case used to print "Failed
 * to fetch", in English, on the flakiest step of the whole flow, to a student
 * on mobile data who had just been told to check their connection by a
 * message that did not say so.
 */
export function errorNotice(err: unknown, copy: SignInCopy): Notice {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { tone: "warning", text: copy.offline };
  }

  const code = String((err as { code?: string })?.code ?? "");

  if (code.includes("too-many-requests")) return { tone: "warning", text: copy.rateLimited };
  if (code.includes("invalid-phone-number")) return { tone: "danger", text: copy.invalidPhone };
  if (code.includes("operation-not-allowed") || code.includes("quota-exceeded")) {
    return { tone: "danger", text: copy.smsUnavailable };
  }
  // INVALID_APP_CREDENTIAL, and the backend error the SDK falls back into
  // after it. Both mean the page is being served from a hostname Firebase has
  // not authorised for phone auth, so the reCAPTCHA token is rejected before
  // any SMS is sent — a configuration fault, not anything the student did,
  // and the one thing they can act on is the address.
  if (
    code.includes("invalid-app-credential") ||
    code.includes("captcha-check-failed") ||
    code.includes("internal-error")
  ) {
    return { tone: "danger", text: interpolate(copy.wrongHost, { url: publicEnv.appUrl }) };
  }
  if (err instanceof TimeoutError) return { tone: "warning", text: copy.timeout };
  if (err instanceof TypeError) return { tone: "warning", text: copy.connectionLost };

  return { tone: "danger", text: copy.genericError };
}
