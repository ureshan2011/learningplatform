"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/env";

// Duplicated from lib/auth/session.ts, which is server-only and cannot be
// imported into a client bundle — same pattern as SessionKeeper.tsx.
const SIGNED_IN_HINT_COOKIE = "ictclass_ui";

function hasSignedInHintCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${SIGNED_IN_HINT_COOKIE}=1`);
}

/**
 * Whether this browser is signed in, read purely client-side so a page can
 * stay statically generated for SEO (see `/notes`'s own comment on why it
 * never reads the session server-side).
 *
 * Checks the plain `ictclass_ui` cookie first — synchronous, and set by the
 * server alongside the real session cookie (see `SIGNED_IN_HINT_COOKIE`).
 * That matters because Firebase Auth's own client-side persistence is
 * script-written (IndexedDB) and asynchronous, and some real browsing
 * contexts — an in-app webview opened from another app, Safari's storage
 * restrictions on cross-app or infrequently-visited origins — can fail to
 * restore it even though the visitor genuinely has a valid session. A
 * first-party cookie set via `Set-Cookie` survives those far more reliably.
 * `onAuthStateChanged` stays as a backstop for a session that predates this
 * cookie.
 *
 * `knownSignedIn` lets a caller that already resolved the real session
 * server-side skip the client check entirely and just trust that — the hook
 * then returns it unchanged instead of checking anything.
 */
export function useSignedInClient(knownSignedIn: boolean): boolean {
  const [signedIn, setSignedIn] = useState(knownSignedIn);

  useEffect(() => {
    if (knownSignedIn) return;
    if (hasSignedInHintCookie()) {
      // Deliberately synchronous: the cookie is read once, right after mount,
      // specifically to flip out of the SSR-matched guest state as early as
      // possible — there is no external source to "subscribe" to here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSignedIn(true);
      return;
    }
    if (!isFirebaseConfigured()) return;
    return onAuthStateChanged(clientAuth(), (user) => setSignedIn(Boolean(user)));
  }, [knownSignedIn]);

  return signedIn;
}
