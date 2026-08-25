/** Pulsing live indicator — the pulse pauses under prefers-reduced-motion (see globals.css). */
export function LiveDot({ label = "live now" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-(--color-success)">
      <span aria-hidden className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-success)" />
      {label}
    </span>
  );
}
