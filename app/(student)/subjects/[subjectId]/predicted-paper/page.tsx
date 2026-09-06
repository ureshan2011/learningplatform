import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getPredictedPaperSettings } from "@/lib/content/predicted-paper-settings";
import { SubjectPageShell } from "@/components/subject/SubjectShell";
import { PredictedPaperAttempt } from "@/components/papers/PredictedPaperAttempt";
import { PredictedPaperTwoViewer } from "@/components/papers/PredictedPaperTwoViewer";
import { AL_ICT_2027_FOCUS_AREAS } from "@/lib/content/al-ict-2027-focus-areas";
import { PREDICTED_PAPER_EXAM_YEAR_TARGET } from "@/lib/content/al-ict-2027-predicted-paper1";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default async function PredictedPaperPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await requirePageUser(`/subjects/${subjectId}/predicted-paper`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const [access, settings] = await Promise.all([hasAccess(user.uid, subjectId), getPredictedPaperSettings()]);

  return (
    <SubjectPageShell
      subjectId={subjectId}
      subjectName={subject.name}
      title={`A/L ICT ${PREDICTED_PAPER_EXAM_YEAR_TARGET} predicted paper`}
      subtitle="An AI exam-pattern analysis of every question, unit and mark scheme most likely to appear — built by Dr. Yasas Sri Wickramasinghe."
      access={access}
      lockedBody="Your teacher's AI-predicted 2027 focus paper — 50 MCQs and 10 structured/essay questions, ranked by confidence and tagged with why each one was chosen."
    >
      {settings.published ? (
        <div className="space-y-8">
          <FocusAreasBriefing />
          <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 sm:p-6">
            <PredictedPaperAttempt />
          </div>
          <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 sm:p-6">
            <PredictedPaperTwoViewer />
          </div>
        </div>
      ) : (
        <ComingSoon />
      )}
    </SubjectPageShell>
  );
}

function FocusAreasBriefing() {
  return (
    <section className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Icon name="insights" className="text-(--color-awaken-accent)" />
        Focus areas briefing
      </h2>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        Every syllabus competency, ranked by how likely it is to appear in 2027 — built from past-paper pattern and
        syllabus weighting, not a guess.
      </p>
      <ul className="mt-4 space-y-2">
        {AL_ICT_2027_FOCUS_AREAS.map((f) => (
          <li key={f.competencyNumber} className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-3.5 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{f.topic}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  f.band === "high"
                    ? "bg-(--color-awaken-success-soft) text-(--color-awaken-success)"
                    : f.band === "medium"
                      ? "bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)"
                      : "bg-(--color-awaken-card) text-(--color-awaken-ink-soft)"
                }`}
              >
                {f.band === "high" ? "High" : f.band === "medium" ? "Medium" : "Low"}
              </span>
            </div>
            <p className="mt-1 text-(--color-awaken-ink-soft)">{f.rationale}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ComingSoon() {
  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-6 text-center sm:p-10">
      <Icon name="auto_awesome" className="mx-auto !text-3xl text-(--color-awaken-accent)" />
      <h2 className="mt-3 text-xl font-bold">Almost ready</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-(--color-awaken-ink-soft)">
        Your teacher is doing a final read-through of the {PREDICTED_PAPER_EXAM_YEAR_TARGET} predicted paper before
        it goes live. Check back soon.
      </p>
    </div>
  );
}
