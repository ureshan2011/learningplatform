"use client";

import { useEffect, useState } from "react";

/**
 * Drifting identity overlay.
 *
 * A browser cannot block screen recording, so we do not pretend to. Instead
 * every frame a student could capture carries their own name, which turns
 * "share the recording in the class WhatsApp group" from anonymous into
 * traceable. That is the behaviour change that actually protects fee income.
 *
 * It moves because a fixed watermark is trivially cropped out.
 */
export function Watermark({ label }: { label: string }) {
  const [pos, setPos] = useState({ top: "12%", left: "8%" });

  useEffect(() => {
    const move = () =>
      setPos({
        top: `${8 + Math.random() * 78}%`,
        left: `${5 + Math.random() * 70}%`,
      });
    move();
    const timer = setInterval(move, 9000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden"
    >
      <span
        className="absolute whitespace-nowrap text-xs font-medium text-white/25 transition-all duration-1000 ease-in-out sm:text-sm"
        style={{ top: pos.top, left: pos.left, textShadow: "0 1px 3px rgba(0,0,0,.6)" }}
      >
        {label}
      </span>
    </div>
  );
}
