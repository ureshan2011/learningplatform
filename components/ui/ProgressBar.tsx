/**
 * 6px track used for topic mastery / module progress. Colour follows the
 * design system's threshold: red below 50%, amber to 70%, emerald above.
 */
export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= 70
      ? "bg-(--color-awaken-success)"
      : clamped >= 50
        ? "bg-(--color-awaken-accent)"
        : "bg-(--color-awaken-danger)";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-awaken-line)"
    >
      <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
