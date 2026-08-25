"use client";

import { useEffect, useRef, useState } from "react";
import { Watermark } from "./Watermark";

/**
 * Plays the RTMP simulcast of the Zoom class.
 *
 * This player is what makes class size independent of the Zoom licence: the
 * Zoom room holds the paid seats, and everyone beyond it — plus every mobile
 * student — watches here, with the full Live Arena beside them. Because the
 * interactivity lives in our app rather than in Zoom, an overflow student gets
 * the same experience, not a downgraded one.
 *
 * Safari plays HLS natively; everything else needs hls.js, which we import
 * lazily so the ~200KB never lands on students who do not need it.
 */
export function HlsPlayer({
  src,
  watermark,
  lowData = false,
}: {
  src: string;
  watermark: string;
  lowData?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroy: (() => void) | undefined;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    let cancelled = false;
    void (async () => {
      const { default: Hls } = await import("hls.js");
      if (cancelled || !Hls.isSupported()) {
        setError("This browser cannot play the class stream. Try Chrome.");
        return;
      }

      const hls = new Hls({
        // Sri Lankan mobile data is metered and expensive. Cap the ladder when
        // the student asks for low data rather than letting ABR pick 1080p.
        capLevelToPlayerSize: true,
        maxBufferLength: lowData ? 10 : 30,
        startLevel: lowData ? 0 : -1,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        // Network blips are constant on mobile data — recover rather than
        // dumping the student out of class.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else setError("Stream interrupted. Refresh to rejoin.");
      });

      destroy = () => hls.destroy();
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src, lowData]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        playsInline
        controls
        autoPlay
        // Autoplay is only permitted muted; students unmute with one tap.
        muted
        className="h-full w-full"
      />
      <Watermark label={watermark} />
      {error ? (
        <p className="material absolute inset-x-0 bottom-0 z-30 border-t border-(--color-danger)/30 p-2 text-center text-sm text-(--color-danger)">
          {error}
        </p>
      ) : null}
    </div>
  );
}
