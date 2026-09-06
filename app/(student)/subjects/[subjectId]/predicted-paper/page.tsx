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
import { Badge, Card, SectionBar } from "@/components/ds";

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
        <div className="space-y-6">
          <FocusAreasBriefing />
          <PredictedPaperAttempt />
          <PredictedPaperTwoViewer />
        </div>
      ) : (
        <ComingSoon />
      )}
    </SubjectPageShell>
  );
}

const FOCUS_BAND_TONE = { high: "success", medium: "warning", low: "neutral" } as const;
const FOCUS_BAND_LABEL = { high: "High", medium: "Medium", low: "Low" } as const;

function FocusAreasBriefing() {
  return (
    <section>
      <SectionBar
        title="Focus areas briefing"
        hint="Every syllabus competency, ranked by how likely it is to appear in 2027 — built from past-paper pattern and syllabus weighting, not a guess."
      />
      <ul className="space-y-2">
        {AL_ICT_2027_FOCUS_AREAS.map((f) => (
          <li key={f.competencyNumber}>
            <Card radius="md" className="p-3.5 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ict-paper-50">{f.topic}</p>
                <Badge tone={FOCUS_BAND_TONE[f.band]}>{FOCUS_BAND_LABEL[f.band]}</Badge>
              </div>
              <p className="mt-1 text-ict-ink-300">{f.rationale}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ComingSoon() {
  return (
    <Card radius="panel" className="p-6 text-center sm:p-10">
      <Icon name="auto_awesome" className="mx-auto !text-3xl text-ict-orange-400" />
      <h2 className="mt-3 font-display text-xl font-extrabold text-ict-paper-50">Almost ready</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ict-ink-300">
        Your teacher is doing a final read-through of the {PREDICTED_PAPER_EXAM_YEAR_TARGET} predicted paper before
        it goes live. Check back soon.
      </p>
    </Card>
  );
}
