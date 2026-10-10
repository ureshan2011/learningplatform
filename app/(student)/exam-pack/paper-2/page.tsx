import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { requireExamPackPage } from "@/lib/exam-pack/page-gate";
import { AL_ICT_2027_FOCUS_AREAS } from "@/lib/content/al-ict-2027-focus-areas";
import { PredictedPaperTwoViewer } from "@/components/papers/PredictedPaperTwoViewer";
import { PredictedPaperDisclaimer } from "@/components/papers/PredictedPaperDisclaimer";
import { Icon } from "@/components/ui/Icon";
import { Badge, Card, PageHeader, SectionBar } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";

export const dynamic = "force-dynamic";

const BAND_TONE = { high: "success", medium: "warning", low: "neutral" } as const;
const BAND_LABEL = {
  high: { en: "High", si: "ඉහළ" },
  medium: { en: "Medium", si: "මධ්‍යම" },
  low: { en: "Low", si: "අඩු" },
} as const;

/**
 * The 2027 predicted Paper II with its mark scheme, and the focus-areas
 * briefing behind both predicted papers. Paper II is not auto-marked — no
 * essay on this platform is — so this is attempted on paper and checked
 * against the scheme, the way a real Paper II booklet is.
 */
export default async function ExamPackPaperTwoPage() {
  await requireExamPackPage("/exam-pack/paper-2");
  const locale = await getLocale();

  return (
    <PageShell width="reading">
      <Link
        href="/exam-pack"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ict-fg-soft transition-colors duration-[120ms] hover:text-ict-accent-fg"
      >
        <Icon name="arrow_back" className="!text-base" />
        Exam Pack
      </Link>

      <div className="mt-4">
        <PageHeader
          title="2027 predicted Paper II"
          subtitle={
            locale === "si"
              ? "Paper එකේ ලියලා, mark scheme එකෙන් check කරන්න. Print කරන්න ඕන නම් Downloads බලන්න."
              : "Write your answers on paper, then check them against the mark scheme. To print it, use Downloads."
          }
        />
      </div>

      <div className="mt-5 space-y-6">
        <PredictedPaperDisclaimer lang={locale} />
        <PredictedPaperTwoViewer />

        <section>
          <SectionBar
            title="Focus areas briefing"
            hint={
              locale === "si"
                ? "2027 එන්න තියෙන ඉඩ අනුව හැම competency එකක්ම — past paper pattern සහ syllabus weighting එකෙන්."
                : "Every syllabus competency, ranked by how likely it is to appear in 2027 — from past-paper pattern and syllabus weighting."
            }
          />
          <ul className="space-y-2">
            {AL_ICT_2027_FOCUS_AREAS.map((f) => (
              <li key={f.competencyNumber}>
                <Card radius="md" className="p-3.5 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ict-fg">{f.topic}</p>
                    <Badge tone={BAND_TONE[f.band]}>{BAND_LABEL[f.band][locale]}</Badge>
                  </div>
                  <p className="mt-1 text-ict-fg-soft">{f.rationale}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
