"use client";

import { clientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/env";
import { collectDeviceSignals } from "@/lib/auth/device-client";

/**
 * Client-side session recovery.
 *
 * A 401 from one of our API routes almost never means "this person is not who
 * they say they are". It means the session cookie lapsed while the browser was
 * still holding a perfectly good Firebase refresh token — so the right response
 * is to quietly mint a new cookie and retry, not to throw the student out.
 *
 * That distinction is what turned a lapsed cookie into a lost mock exam:
 * submitting a finished paper got a 401, the runner reported "Could not submit.
 * Check your connection and try again", and every retry failed the same way
 * while the student's answers sat in memory waiting to be lost on refresh.
 */

let inFlight: Promise<boolean> | null = null;

/**
 * Mints a fresh session cookie from the browser's Firebase refresh token.
 *
 * Concurrent callers share one request: a page that fires three gated fetches
 * at once should renew once, not three times.
 */
export function renewSession(): Promise<boolean> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    if (!isFirebaseConfigured()) return false;
    try {
      const user = clientAuth().currentUser;
      if (!user) return false;
      const idToken = await user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, device: collectDeviceSignals() }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Cleared on the next tick so a burst of callers still share this result.
      queueMicrotask(() => {
        inFlight = null;
      });
    }
  })();

  return inFlight;
}

/**
 * `fetch`, but a lapsed session is repaired and the request retried once.
 *
 * Use this for every call to a route that requires a signed-in user. The retry
 * is deliberately capped at one: if renewal did not fix it, the session is
 * genuinely gone and the caller should say so rather than loop.
 */
export async function fetchWithSession(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;
  if (!(await renewSession())) return res;
  return fetch(input, init);
}

/** Where to send someone whose session really is gone, so they come back to this exact page. */
export function signInHref(reason: "expired" | "device_released" = "expired"): string {
  const next = typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;
  return `/signin?next=${encodeURIComponent(next)}&reason=${reason}`;
}
