"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ZoomEmbed, type ZoomJoinConfig } from "@/components/player/ZoomEmbed";
import { HlsPlayer } from "@/components/player/HlsPlayer";

type JoinResponse =
  | ({ mode: "zoom" } & ZoomJoinConfig & { joinUrl: string })
  | { mode: "hls"; hlsUrl: string; delaySeconds: number; watermark: string };

/**
 * Decides how a student watches the class, then joins.
 *
 * Desktop gets the embedded Zoom room. Mobile gets the simulcast, because the
 * Meeting SDK is unreliable in mobile browsers and the simulcast is genuinely
 * the better experience there: less data, no app switch, and the interactive
 * panel stays on screen instead of being buried behind the Zoom app.
 */
export function JoinClass({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "ready"; data: JoinResponse } | { kind: "error"; message: string; reason?: string }
  >({ kind: "loading" });
  const [lowData, setLowData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/join`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ preferHls: prefersHls() }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState({
            kind: "error",
            message: messageForJoinError(data.reason ?? data.error),
            reason: data.reason ?? data.error,
          });
          return;
        }
        setState({ kind: "ready", data: data as JoinResponse });
      } catch {
        if (!cancelled) {
          setState({ kind: "error", message: "Could not reach the class. Check your connection." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state.kind === "loading") {
    return <Panel>Getting you into class…</Panel>;
  }

  if (state.kind === "error") {
    return (
      <Panel tone="error">
        <p>{state.message}</p>
        {state.reason === "expired" || state.reason === "not_enrolled" ? (
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-[--color-brand] px-4 py-2 text-sm font-semibold text-black"
          >
            Renew to join
          </Link>
        ) : null}
      </Panel>
    );
  }

  if (state.data.mode === "hls") {
    return (
      <div>
        <HlsPlayer src={state.data.hlsUrl} watermark={state.data.watermark} lowData={lowData} />
        <label className="mt-3 flex items-center gap-2 text-sm text-white/60">
          <input
            type="checkbox"
            checked={lowData}
            onChange={(e) => setLowData(e.target.checked)}
            className="size-4"
          />
          Low data mode (lower quality, saves your data)
        </label>
      </div>
    );
  }

  return <ZoomEmbed config={state.data} />;
}

/**
 * Mobile browsers cannot reliably run the embedded Meeting SDK's media stack,
 * so route them to the simulcast rather than letting them fail at join time.
 */
function prefersHls(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isNarrow = window.innerWidth < 900;
  return isMobile || isNarrow;
}

function messageForJoinError(reason?: string): string {
  switch (reason) {
    // Zoom has not been connected yet. Not an error the student caused, so do
    // not word it as one.
    case "not_configured":
      return "Live classes are not set up yet. Your teacher is still getting things ready.";
    case "expired":
      return "Your subscription for this subject has ended. Renew to join the class.";
    case "not_enrolled":
      return "You are not enrolled in this subject yet.";
    case "suspended":
      return "Your access is on hold. Please contact your teacher.";
    case "stream_not_ready":
      return "The class stream has not started yet. Try again in a moment.";
    case "cancelled":
      return "This class was cancelled.";
    default:
      return "You cannot join this class right now.";
  }
}

function Panel({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div
      className={`flex min-h-[240px] items-center justify-center rounded-xl border p-6 text-center text-sm ${
        tone === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-white/10 bg-white/[0.03] text-white/60"
      }`}
    >
      <div>{children}</div>
    </div>
  );
}
