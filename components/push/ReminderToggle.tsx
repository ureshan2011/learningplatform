"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Button, Card, Eyebrow, StatusChip } from "@/components/ds";
import { fetchWithSession } from "@/lib/auth/session-client";

type State = "checking" | "unsupported" | "off" | "on" | "blocked" | "working";

/** No external source to watch; the snapshot is read once per render. */
const subscribeNever = () => () => {};

function browserState(vapidKey: string): State {
  if (!vapidKey) return "unsupported";
  if (typeof window === "undefined") return "checking";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  // "granted" does not mean this browser is registered with us — site data may
  // have been cleared since. Treated as off until a token is in hand, and
  // re-asking costs nothing when permission is already granted.
  return "off";
}

/**
 * Turns class reminders on for this browser.
 *
 * The permission prompt is deliberately behind a button rather than fired on
 * page load. A prompt a student did not ask for is the one they dismiss, and
 * a dismissal on Android is not a "no for now" — it is remembered, and the
 * only way back is Chrome's site settings, which is not a place a sixteen-
 * year-old is going to find. Asking once, after they have said they want
 * this, is the difference between a feature that works and one that is
 * permanently blocked.
 *
 * Per browser, not per account: the token identifies this install, so a
 * student with a phone and a laptop turns it on twice, which is what they
 * would expect. Turning it off removes only this browser's token.
 */
export function ReminderToggle({
  vapidKey,
  labels,
}: {
  /** Empty when the Web Push certificate has not been pasted in yet. */
  vapidKey: string;
  labels: {
    title: string;
    body: string;
    on: string;
    off: string;
    enable: string;
    disable: string;
    blocked: string;
    unsupported: string;
    notConfigured: string;
  };
}) {
  // What this browser can do, read through `useSyncExternalStore` rather than
  // in an effect: the server has no `Notification` and the client does, and
  // this is the primitive that lets the two render different answers without
  // a hydration mismatch and without setting state on mount.
  //
  // Nothing to subscribe to — the permission only changes as a result of the
  // prompt below, and that path sets state directly.
  const supported = useSyncExternalStore(
    subscribeNever,
    () => browserState(vapidKey),
    () => "checking" as const,
  );
  const [acted, setActed] = useState<State | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const state = acted ?? supported;

  const enable = useCallback(async () => {
    setActed("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setActed(permission === "denied" ? "blocked" : "off");
        return;
      }

      // Imported here, not at module scope: `firebase/messaging` pulls in a
      // chunk nobody who never turns this on should have to download.
      const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
      if (!(await isSupported())) {
        setActed("unsupported");
        return;
      }

      const { clientApp } = await import("@/lib/firebase/client");
      // The app's own worker, rather than letting the SDK register a second
      // one at `firebase-messaging-sw.js`: two workers on one origin fight
      // over the fetch handler, and ours is the one with the offline page.
      const registration = await navigator.serviceWorker.ready;
      const next = await getToken(getMessaging(clientApp()), {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!next) {
        setActed("off");
        return;
      }

      const res = await fetchWithSession("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: next }),
      });
      if (!res.ok) throw new Error(String(res.status));

      setToken(next);
      setActed("on");
    } catch (err) {
      console.error("[push] could not enable reminders", err);
      setActed("off");
    }
  }, [vapidKey]);

  const disable = useCallback(async () => {
    if (!token) return setActed("off");
    setActed("working");
    try {
      await fetchWithSession("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch {
      // The row is gone from this student's point of view either way; a
      // stale token costs one wasted send and is pruned on the next one.
    }
    setToken(null);
    setActed("off");
  }, [token]);

  const note =
    state === "blocked"
      ? labels.blocked
      : state === "unsupported"
        ? vapidKey
          ? labels.unsupported
          : labels.notConfigured
        : labels.body;

  return (
    <Card radius="card" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{labels.title}</Eyebrow>
        {state === "on" ? <StatusChip tone="success">{labels.on}</StatusChip> : null}
      </div>
      <p className="mt-2 text-sm text-ict-fg-soft">{note}</p>

      {state === "off" || state === "working" ? (
        <Button
          variant="outline"
          size="sm"
          arrow="none"
          onClick={enable}
          disabled={state === "working"}
          className="mt-4"
        >
          {labels.enable}
        </Button>
      ) : null}

      {state === "on" ? (
        <Button variant="ghost" size="sm" arrow="none" onClick={disable} className="mt-4">
          {labels.disable}
        </Button>
      ) : null}
    </Card>
  );
}
