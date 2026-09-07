"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/env";
import { collectDeviceSignals } from "@/lib/auth/device-client";

const RENEWED_AT_KEY = "ictclass.sessionRenewedAt";

/** Matches SESSION_RENEW_AFTER_MS. Duplicated rather than imported: that module is server-only. */
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

function lastRenewedAt(): number {
  try {
    return Number(localStorage.getItem(RENEWED_AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function markRenewed(): void {
  try {
    localStorage.setItem(RENEWED_AT_KEY, String(Date.now()));
  } catch {
    // Private mode. We simply renew on every visit instead — still correct,
    // just slightly chattier.
  }
}

/**
 * Keeps the httpOnly session cookie alive so students stop being asked to sign
 * in again.
 *
 * ## The problem this solves
 *
 * The session cookie has a hard maximum life — Firebase allows fourteen days
 * and not a minute more — and nothing used to extend it. A student who used the
 * site every single day was still thrown back to the SMS gate the moment that
 * clock ran out, because the cookie's age had nothing to do with whether they
 * were active. Sign-in was, in effect, on a timer.
 *
 * The browser, meanwhile, has been holding a Firebase refresh token the whole
 * time. That token does not expire, is stored by the Firebase SDK, and can mint
 * a fresh ID token whenever asked. So the fix is to ask: send a fresh ID token
 * to `PUT /api/auth/session` about once a day and take a new fourteen-day
 * cookie back. No SMS is sent, nothing is billed, the student types nothing and
 * sees nothing. In practice they sign in once and stay signed in.
 *
 * ## Why it is bound to visibility, not a timer
 *
 * The audience is on Android phones on mobile data, where a background interval
 * is either throttled to nothing or wasting battery and bytes. Renewing when
 * the tab is actually looked at costs one small request a day and works
 * identically on a phone that was asleep for a week.
 *
 * Failures are silent on purpose. A renewal that cannot reach the network must
 * never interrupt a student mid-lesson — the existing cookie is still good for
 * days, and the next glance at the tab will try again.
 *
 * ## Standing down on the sign-in page
 *
 * `onIdTokenChanged` fires the instant an OTP is confirmed — before the
 * sign-in screen has posted its own exchange to `/api/auth/session`. That PUT
 * used to race the real POST: for a new student or a new device it found no
 * user document or no bound device yet, got a 401 or 403, and signed the
 * Firebase client back out. The POST still succeeded, so the student looked
 * signed in, but silent renewal could never run for that browser again — they
 * were back at the SMS gate in fourteen days. `/signin` owns its own exchange
 * end to end, so this component simply does nothing there.
 *
 * ## Never signing out on a 401
 *
 * A 401 from this route is `invalid_token` — a transient verification hiccup,
 * never grounds to end anyone's session — or `no_account`, which just means a
 * sign-in is genuinely still in progress somewhere. Only a 403
 * (`account_disabled` or `device_released`) is a real revocation.
 */
export function SessionKeeper() {
  const pathname = usePathname();
  const onSignInPage = pathname === "/signin";

  useEffect(() => {
    if (!isFirebaseConfigured() || onSignInPage) return;

    let cancelled = false;
    let inFlight = false;

    async function renew(force = false) {
      if (cancelled || inFlight) return;
      if (!force && Date.now() - lastRenewedAt() < RENEW_AFTER_MS) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;

      const user = clientAuth().currentUser;
      // No Firebase user means this browser genuinely has nothing to renew
      // from — either signed out, or a fresh browser. Not an error.
      if (!user) return;

      inFlight = true;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken, device: collectDeviceSignals() }),
        });
        if (res.ok) {
          markRenewed();
        } else if (res.status === 403) {
          // The account was disabled or this device's slot was released —
          // both real revocations. Keeping a half-signed-in Firebase user
          // around after that is what produces the "some pages think I'm in,
          // some think I'm out" confusion, so clear it and let the next
          // navigation redirect normally.
          markRenewed();
          await signOut(clientAuth()).catch(() => {});
        }
        // A 401 here is never a reason to sign anyone out — see the class
        // doc comment above.
      } catch {
        // Offline or a blip. The current cookie has days left; try again later.
      } finally {
        inFlight = false;
      }
    }

    // A token change means the SDK just refreshed (or the user signed in), so
    // this is the cheapest possible moment to take a new cookie.
    const unsubscribe = onIdTokenChanged(clientAuth(), (user) => {
      if (user) void renew();
    });

    function onVisible() {
      if (document.visibilityState === "visible") void renew();
    }
    function onOnline() {
      void renew(true);
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    void renew();

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [onSignInPage]);

  return null;
}
