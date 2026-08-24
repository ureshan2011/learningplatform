"use client";

import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/lib/env";
import { Watermark } from "./Watermark";

/**
 * Embedded Zoom Meeting SDK (Component View) — desktop only.
 *
 * The SDK is loaded from Zoom's CDN rather than npm on purpose: the
 * `@zoom/meetingsdk` package pins react@18.2.0 as a peer dependency and cannot
 * be installed alongside React 19. The CDN bundle is self-contained and has no
 * such constraint.
 */

interface ZoomEmbeddedClient {
  init(opts: Record<string, unknown>): Promise<void>;
  join(opts: Record<string, unknown>): Promise<void>;
  leave(): Promise<void>;
}

declare global {
  interface Window {
    ZoomMtgEmbedded?: { createClient(): ZoomEmbeddedClient };
  }
}

export interface ZoomJoinConfig {
  meetingNumber: string;
  signature: string;
  sdkKey: string;
  userName: string;
  watermark: string;
}

export function ZoomEmbed({ config }: { config: ZoomJoinConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ZoomEmbeddedClient | null>(null);
  const [status, setStatus] = useState<"loading" | "joining" | "joined" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await loadZoomSdk();
        if (cancelled || !containerRef.current) return;

        const client = window.ZoomMtgEmbedded?.createClient();
        if (!client) throw new Error("Zoom SDK failed to load.");
        clientRef.current = client;

        await client.init({
          zoomAppRoot: containerRef.current,
          language: "en-US",
          patchJsMedia: true,
          customize: {
            video: { isResizable: false, viewSizes: { default: { width: 960, height: 540 } } },
            // Zoom's own chat is switched off: chat lives in the Live Arena so
            // that overflow students on the simulcast are in the same room as
            // everyone else.
            chat: { popper: { disableDraggable: true } },
          },
        });

        if (cancelled) return;
        setStatus("joining");

        await client.join({
          sdkKey: config.sdkKey,
          signature: config.signature,
          meetingNumber: config.meetingNumber,
          userName: config.userName,
        });

        if (!cancelled) setStatus("joined");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Could not join the class.");
      }
    })();

    return () => {
      cancelled = true;
      void clientRef.current?.leave().catch(() => {});
    };
  }, [config]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      <div ref={containerRef} className="min-h-[420px] w-full" />
      <Watermark label={config.watermark} />

      {status !== "joined" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 text-sm">
          {status === "error" ? (
            <p className="max-w-sm px-6 text-center text-red-300">{error}</p>
          ) : (
            <p className="text-white/70">
              {status === "loading" ? "Loading class…" : "Joining class…"}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

let sdkPromise: Promise<void> | undefined;

/** Loads the CDN bundle once, even if several components mount. */
function loadZoomSdk(): Promise<void> {
  if (window.ZoomMtgEmbedded) return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const version = publicEnv.zoom.sdkVersion;
    const script = document.createElement("script");
    script.src = `https://source.zoom.us/${version}/zoom-meeting-embedded-${version}.min.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = undefined; // allow a retry on the next mount
      reject(new Error("Could not load the Zoom SDK. Check your connection."));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}
