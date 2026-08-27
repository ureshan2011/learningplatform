import { clsx } from "clsx";

const TONES = {
  success: "bg-(--color-awaken-success-soft) text-(--color-awaken-success)",
  danger: "bg-(--color-awaken-danger-soft) text-(--color-awaken-danger)",
  warn: "bg-(--color-awaken-warn-soft) text-(--color-awaken-warn)",
  accent: "bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)",
  neutral: "bg-(--color-awaken-indigo-soft) text-(--color-awaken-indigo)",
} as const;

/** Small pill for statuses — enrollment state, session state, payment state. */
export function StatusPill({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", TONES[tone])}>
      {children}
    </span>
  );
}
