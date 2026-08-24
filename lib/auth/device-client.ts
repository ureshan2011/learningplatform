"use client";

const CLIENT_ID_KEY = "ictclass.clientId";

/**
 * Stable per-browser id, generated once and persisted.
 *
 * Deliberately a random value rather than a fingerprint: it identifies "this
 * browser install" without profiling the student. Clearing site data resets it,
 * which costs the student a device slot — that's an acceptable trade against
 * collecting anything sensitive from minors.
 */
export function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    // Private mode or blocked storage — fall back to a per-tab id.
    return crypto.randomUUID();
  }
}

export function collectDeviceSignals() {
  return {
    clientId: getClientId(),
    userAgent: navigator.userAgent.slice(0, 400),
    platform: (navigator as Navigator & { platform?: string }).platform ?? undefined,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
