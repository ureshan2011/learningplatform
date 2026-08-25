const TONE: Record<string, string> = {
  default: "surface text-(--color-text-muted)",
  error: "rounded-2xl border border-(--color-danger)/30 bg-(--color-danger)/10 text-(--color-danger)",
  brand: "rounded-2xl border border-(--color-brand)/30 bg-(--color-brand)/10 text-(--color-text)",
};

/** Centered placeholder panel for loading / empty / error states — one shape used everywhere. */
export function EmptyState({
  children,
  tone = "default",
  role,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE;
  role?: "alert" | "status";
}) {
  return (
    <div role={role} className={`flex min-h-[220px] items-center justify-center p-8 text-center text-sm ${TONE[tone]}`}>
      <div>{children}</div>
    </div>
  );
}
