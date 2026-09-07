"use client";

/**
 * Spins while a phone verification round trip is in flight.
 *
 * Transform-only (a rotating border, not a redraw), so a cheap Android phone
 * still holds 60fps while it spins beside a button label.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        className ?? "size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
      }
    />
  );
}
