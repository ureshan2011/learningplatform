"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/env";

/**
 * Whether this browser has a signed-in Firebase user, read purely
 * client-side from the SDK's locally persisted auth state — no network
 * round trip, so it's safe to call from a page that stays statically
 * generated for SEO (see `/notes`'s own comment on why it never reads the
 * session server-side).
 *
 * `knownSignedIn` lets a caller that already resolved the real session
 * server-side skip the client check entirely and just trust that — the
 * hook then returns it unchanged instead of waiting on Firebase.
 */
export function useSignedInClient(knownSignedIn: boolean): boolean {
  const [signedIn, setSignedIn] = useState(knownSignedIn);

  useEffect(() => {
    if (knownSignedIn || !isFirebaseConfigured()) return;
    return onAuthStateChanged(clientAuth(), (user) => setSignedIn(Boolean(user)));
  }, [knownSignedIn]);

  return signedIn;
}
