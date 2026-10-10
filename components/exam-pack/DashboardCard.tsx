import { ButtonLink, Card, IconBadge, StatusChip } from "@/components/ds";
import { formatLKR } from "@/lib/format";
import { EXAM_PACK, pick } from "@/lib/exam-pack/config";

/**
 * The Exam Pack on the student dashboard: a buy prompt while it is on sale, or
 * a way back in for someone who owns it. Not shown at all otherwise — the
 * dashboard does not carry a card for a product nobody can buy.
 */
export function ExamPackDashboardCard({
  owned,
  feeLKR,
  locale,
}: {
  owned: boolean;
  feeLKR: number;
  locale: "en" | "si";
}) {
  return (
    <Card radius="card" className="flex flex-wrap items-center gap-4 p-5">
      <IconBadge icon="workspace_premium" tone="soft" size={44} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-bold text-ict-fg">{EXAM_PACK.name}</span>
          {owned ? <StatusChip tone="success">{locale === "si" ? "ඔයාගේ" : "Yours"}</StatusChip> : null}
        </p>
        <p className="mt-1 text-sm text-ict-fg-soft">{pick(EXAM_PACK.tagline, locale)}</p>
      </div>
      <ButtonLink href={EXAM_PACK.appPath} variant={owned ? "outline" : "primary"} size="sm">
        {owned
          ? locale === "si"
            ? "Open කරන්න"
            : "Open"
          : locale === "si"
            ? `බලන්න — ${formatLKR(feeLKR)}`
            : `See inside — ${formatLKR(feeLKR)}`}
      </ButtonLink>
    </Card>
  );
}
