import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * KPI card — icon, uppercase label, bold metric. Used on the student
 * dashboard and the teacher console header row.
 */
export function StatTile({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warn";
}) {
  const toneClass = {
    default: "text-(--color-awaken-ink-soft)",
    accent: "text-(--color-awaken-accent)",
    success: "text-(--color-awaken-success)",
    warn: "text-(--color-awaken-warn)",
  }[tone];

  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${toneClass}`}>
        <Icon name={icon} className="!text-base" />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-(--color-awaken-ink)">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-(--color-awaken-ink-soft)">{hint}</p> : null}
    </div>
  );
}
