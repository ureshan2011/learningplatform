import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject, getMockExam, getMockExamAttempt } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getMockExamResult } from "@/lib/mockexams/engine";
import { MockExamRunner } from "@/components/mockexams/MockExamRunner";
import { Icon } from "@/components/ui/Icon";
import { SubjectLocked } from "@/components/subject/SubjectShell";
import { Card, PageHeader, ProgressBar, StatCard, StatusChip } from "@/components/ds";

export const dynamic = "force-dynamic";

export default async function MockExamPage({
  params,
}: {
  params: Promise<{ subjectId: string; mockExamId: string }>;
}) {
  const { subjectId, mockExamId } = await params;

  const user = await requirePageUser(`/subjects/${subjectId}/mock-exams/${mockExamId}`);

  const [subject, exam] = await Promise.all([getSubject(subjectId), getMockExam(mockExamId)]);
  if (!subject || !exam || exam.subjectId !== subjectId) notFound();

  const access = await hasAccess(user.uid, subjectId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">
      <Link
        href={`/subjects/${subjectId}/mock-exams`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ict-ink-300 transition-colors duration-[120ms] hover:text-ict-orange-400"
      >
        <Icon name="arrow_back" className="!text-base" />
        Mock exams
      </Link>

      <div className="mt-4">
        {!access.allowed ? (
          <SubjectLocked
            subjectId={subjectId}
            access={access}
            body="Timed papers scored the way the real one is, with negative marking and your rank against everyone else who sat it."
          />
        ) : (
          <MockExamBody uid={user.uid} subjectId={subjectId} mockExamId={mockExamId} />
        )}
      </div>
    </main>
  );
}

async function MockExamBody({
  uid,
  subjectId,
  mockExamId,
}: {
  uid: string;
  subjectId: string;
  mockExamId: string;
}) {
  const attempt = await getMockExamAttempt(uid, mockExamId);

  if (!attempt?.submittedAt) {
    return <MockExamRunner subjectId={subjectId} mockExamId={mockExamId} />;
  }

  const result = await getMockExamResult(uid, mockExamId);
  if (!result) notFound();

  return (
    <div>
      <PageHeader
        title={result.title}
        actions={<StatusChip tone="success">Submitted</StatusChip>}
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatCard icon="bolt" label="Score" value={result.score} tone="brand" />
        <StatCard icon="grade" label="Rank" value={`${result.rank}/${result.totalAttempts}`} />
        <StatCard icon="insights" label="Percentile" value={`${result.percentile}%`} tone="success" />
      </div>

      <p className="mt-4 text-sm text-ict-ink-300">
        {result.correctCount} correct · {result.wrongCount} wrong · {result.unansweredCount} unanswered
        {result.negativeMarking > 0 ? ` (each wrong answer cost −${result.negativeMarking})` : ""}
        {result.xpAwarded > 0 ? ` · +${result.xpAwarded} XP` : ""}
      </p>

      <h2 className="mt-8 font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
        By topic
      </h2>
      <ul className="mt-3 space-y-2">
        {Object.entries(result.topicBreakdown).map(([topic, s]) => (
          <li key={topic}>
            <Card radius="md" className="p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-ict-paper-50">{topic}</span>
                <span className="text-xs text-ict-ink-300">
                  {s.correct}/{s.total}
                </span>
              </div>
              <ProgressBar
                value={s.total > 0 ? (s.correct / s.total) * 100 : 0}
                showLabel={false}
                className="mt-2.5"
              />
            </Card>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
        Review
      </h2>
      <div className="mt-3 space-y-2">
        {result.questions.map((q, i) => {
          const correct = q.yourChoice === q.correctIndex;
          const skipped = q.yourChoice === undefined;
          return (
            <details
              key={q.id}
              className="rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-4 shadow-ict-inset [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <span className="text-sm text-ict-paper-50">
                  <span className="text-ict-ink-300">Q{i + 1}. </span>
                  {q.text}
                </span>
                <span className="shrink-0">
                  <StatusChip tone={correct ? "success" : skipped ? "neutral" : "danger"}>
                    {correct ? "Correct" : skipped ? "Skipped" : "Wrong"}
                  </StatusChip>
                </span>
              </summary>
              <ul className="mt-3 space-y-1.5 text-sm">
                {q.options.map((option, oi) => {
                  const isCorrectOption = oi === q.correctIndex;
                  const isYourWrongChoice = oi === q.yourChoice && !correct;
                  return (
                    <li
                      key={oi}
                      className={
                        isCorrectOption
                          ? "flex items-center gap-2 font-semibold text-ict-green-500"
                          : isYourWrongChoice
                            ? "flex items-center gap-2 font-semibold text-[#f0685a]"
                            : "flex items-center gap-2 text-ict-ink-300"
                      }
                    >
                      {isCorrectOption ? (
                        <Icon name="done" className="!text-sm" strokeWidth={2.4} />
                      ) : isYourWrongChoice ? (
                        <Icon name="cancel" className="!text-sm" strokeWidth={2.4} />
                      ) : (
                        <span className="size-1.5 shrink-0 rounded-full bg-ict-ink-500" />
                      )}
                      {option}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-sm text-ict-ink-300">{q.explanation}</p>
            </details>
          );
        })}
      </div>
    </div>
  );
}
