import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/session";
import { getPredictedPaperSettings } from "@/lib/content/predicted-paper-settings";
import { PredictedPaperPublishToggle } from "@/components/teacher/PredictedPaperPublishToggle";
import { Icon } from "@/components/ui/Icon";
import {
  AL_ICT_2027_PREDICTED_PAPER1,
  PREDICTED_PAPER1_QUESTION_COUNT,
  PREDICTED_PAPER_EXAM_YEAR_TARGET,
} from "@/lib/content/al-ict-2027-predicted-paper1";
import { AL_ICT_2027_PREDICTED_PAPER2 } from "@/lib/content/al-ict-2027-predicted-paper2";
import { AL_ICT_2027_FOCUS_AREAS, PREDICTED_PAPER_FRAMING_EN } from "@/lib/content/al-ict-2027-focus-areas";

export const dynamic = "force-dynamic";

const BAND_LABEL = { high: "High", medium: "Medium", low: "Low" } as const;

export default async function TeacherPredictedPaperPage() {
  await requireStaffPage("/teacher/predicted-paper");
  const settings = await getPredictedPaperSettings();

  return (
    <main className="mx-auto max-w-[900px] px-4 py-5 sm:px-6 sm:py-6">
      <Link href="/teacher" className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
        <Icon name="arrow_back" className="!text-base" />
        Teacher console
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <Icon name="auto_awesome" className="text-(--color-awaken-accent)" />
        {PREDICTED_PAPER_EXAM_YEAR_TARGET} predicted paper — review before publishing
      </h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        An AI exam-pattern analysis run once against 25 real past-paper and syllabus files — not a real paper, not
        a leak. {PREDICTED_PAPER1_QUESTION_COUNT} Paper I MCQs plus {AL_ICT_2027_PREDICTED_PAPER2.length} Paper II
        structured/essay items. Nothing below is visible to students until you publish it.
      </p>

      <div className="mt-6">
        <PredictedPaperPublishToggle published={settings.published} />
      </div>

      <section className="mt-8 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-4 text-sm">
        <p className="font-semibold">Mandatory framing statement (shown to every student, always)</p>
        <p className="mt-1.5 text-(--color-awaken-ink-soft)">{PREDICTED_PAPER_FRAMING_EN}</p>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="insights" className="text-(--color-awaken-accent)" />
          Focus areas briefing
        </h2>
        <ul className="mt-3 space-y-2">
          {AL_ICT_2027_FOCUS_AREAS.map((f) => (
            <li key={f.competencyNumber} className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) p-3.5 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  C{f.competencyNumber} — {f.topic}
                </p>
                <BandBadge band={f.band} />
              </div>
              <p className="mt-1 text-(--color-awaken-ink-soft)">{f.rationale}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="quiz" className="text-(--color-awaken-accent)" />
          Paper I — {PREDICTED_PAPER1_QUESTION_COUNT} MCQs
        </h2>
        <ol className="mt-3 space-y-4">
          {AL_ICT_2027_PREDICTED_PAPER1.map((q, i) => (
            <li key={q.id} className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {i + 1}. {q.en.stem}
                </p>
                <BandBadge band={q.confidenceBand} />
              </div>
              <p className="mt-1 text-(--color-awaken-ink-soft)">{q.si.stem}</p>
              {q.code ? (
                <pre className="mt-2 overflow-x-auto rounded-md bg-(--color-awaken-bg) p-2 font-mono text-xs whitespace-pre">{q.code}</pre>
              ) : null}
              <ol className="mt-2 ml-4 list-decimal space-y-0.5">
                {q.en.options.map((opt, j) => (
                  <li key={j} className={j === q.correctIndex ? "font-semibold text-(--color-awaken-success)" : undefined}>
                    {opt}
                    {q.si.options[j] !== opt ? <span className="text-(--color-awaken-ink-soft)"> / {q.si.options[j]}</span> : null}
                    {j === q.correctIndex ? " ✓" : ""}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-(--color-awaken-ink-soft)">
                {q.topic} — {q.rationale}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="edit_note" className="text-(--color-awaken-accent)" />
          Paper II — structured & essay
        </h2>
        <ol className="mt-3 space-y-4">
          {AL_ICT_2027_PREDICTED_PAPER2.map((item) => (
            <li key={item.id} className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {item.id} ({item.marks} marks) — {item.topic}
                </p>
                <BandBadge band={item.confidenceBand} />
              </div>
              {item.en.scenario ? (
                <>
                  <p className="mt-1.5">{item.en.scenario}</p>
                  {item.si.scenario ? <p className="text-(--color-awaken-ink-soft)">{item.si.scenario}</p> : null}
                </>
              ) : null}
              <ol className="mt-2 space-y-1.5">
                {item.subparts.map((sp) => (
                  <li key={sp.label}>
                    <span className="font-medium">
                      ({sp.label}) {sp.en} [{sp.marks} marks]
                    </span>
                    {sp.si ? <span className="block text-(--color-awaken-ink-soft)">{sp.si}</span> : null}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-(--color-awaken-ink-soft)">Mark scheme: {item.markScheme}</p>
              <p className="mt-1 text-xs text-(--color-awaken-ink-soft)">{item.rationale}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function BandBadge({ band }: { band: "high" | "medium" | "low" }) {
  const tone =
    band === "high"
      ? "bg-(--color-awaken-success-soft) text-(--color-awaken-success)"
      : band === "medium"
        ? "bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)"
        : "bg-(--color-awaken-bg) text-(--color-awaken-ink-soft)";
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{BAND_LABEL[band]}</span>;
}
