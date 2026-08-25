export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-(--color-text-muted)">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-(--color-text-faint)">{hint}</span> : null}
    </label>
  );
}
