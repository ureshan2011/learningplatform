"use client";

import { useState } from "react";
import { fetchWithSession } from "@/lib/auth/session-client";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ds";

/**
 * Asks the server for a Google Meet link and opens it.
 *
 * The link is fetched at the moment of the tap, not printed into the page, so
 * it exists in the browser only for someone who passed `hasAccess` inside the
 * join window. A window is opened first, synchronously, because a phone's
 * browser blocks a new tab opened after an `await`; the link is then put into
 * it. If that window was blocked anyway, the page itself goes to the link —
 * on Android that hands over to the Meet app.
 */
export function JoinMeetButton({
  endpoint,
  labels,
  variant = "primary",
}: {
  endpoint: string;
  labels: {
    join: string;
    joining: string;
    /** Contains `{time}`, filled with when the window opens. */
    notOpen: string;
    noLink: string;
    cancelled: string;
    failed: string;
  };
  variant?: "primary" | "secondary";
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setMessage(null);
    const pending = window.open("", "_blank");
    try {
      const res = await fetchWithSession(endpoint, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; opensAt?: number };
      if (res.ok && data.url) {
        track("exam_pack_join", { endpoint });
        if (pending) pending.location.href = data.url;
        else window.location.href = data.url;
        return;
      }
      pending?.close();
      if (data.error === "not_open" && data.opensAt) {
        const time = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Colombo",
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(data.opensAt));
        setMessage(labels.notOpen.replace("{time}", time));
      } else if (data.error === "cancelled") {
        setMessage(labels.cancelled);
      } else if (data.error === "no_link") {
        setMessage(labels.noLink);
      } else {
        setMessage(labels.failed);
      }
    } catch {
      pending?.close();
      setMessage(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button onClick={join} disabled={busy} variant={variant} arrow="up-right">
        {busy ? labels.joining : labels.join}
      </Button>
      {message ? <p className="mt-2 text-sm opacity-80">{message}</p> : null}
    </div>
  );
}
