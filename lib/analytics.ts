"use client";

import { logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { clientAnalytics } from "@/lib/firebase/client";
import type { Role } from "@/lib/types";

/**
 * Fire-and-forget GA4 event. No-ops until Analytics is configured and ready
 * (see `clientAnalytics`) — callers never need to check first, and a slow or
 * blocked network can't delay the interaction that triggered the event.
 */
export function track(name: string, params?: Record<string, unknown>): void {
  clientAnalytics().then((analytics) => {
    if (!analytics) return;
    try {
      logEvent(analytics, name, params);
    } catch {
      // Telemetry must never break the app it's watching.
    }
  });
}

/** Ties events to a signed-in user so GA can report per-role, not just per-session. */
export function identify(uid: string, role: Role): void {
  clientAnalytics().then((analytics) => {
    if (!analytics) return;
    try {
      setUserId(analytics, uid);
      setUserProperties(analytics, { role });
    } catch {
      // Telemetry must never break the app it's watching.
    }
  });
}
