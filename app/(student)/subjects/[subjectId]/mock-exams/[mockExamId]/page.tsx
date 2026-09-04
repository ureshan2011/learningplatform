import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject, getMockExam, getMockExamAttempt } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getMockExamResult } from "@/lib/mockexams/engine";
import { MockExamRunner } from "@/components/mockexams/MockExamRunner";
import { Icon } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StatTile";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link
        href={`/subjects/${subjectId}/mock-exams`}
        className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline"
      >
        <Icon name="arrow_back" className="!text-base" />
        Mock exams
      </Link>

      {!access.allowed ? (
        <div className="mt-6 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5 text-sm">
          <p className="font-medium text-(--color-awaken-accent)">
            {access.reason === "expired" ? "Your subscription has ended." : "You are not enrolled in this subject."}
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
          >
            Subscribe
          </Link>
        </div>
      ) : (
        <MockExamBody uid={user.uid} subjectId={subjectId} mockExamId={mockExamId} />
      )}
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
    return (
      <div className="mt-6">
        <MockExamRunner subjectId={subjectId} mockExamId={mockExamId} />
      </div>
    );
  }

  const result = await getMockExamResult(uid, mockExamId);
  if (!result) notFound();

  return (
    <div className="mt-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Icon name="military_tech" className="text-(--color-awaken-accent)" />
        {result.title}
      </h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatTile icon="bolt" label="Score" value={result.score} tone="accent" />
        <StatTile icon="grade" label="Rank" value={`${result.rank}/${result.totalAttempts}`} />
        <StatTile icon="insights" label="Percentile" value={`${result.percentile}%`} tone="success" />
      </div>

      <p className="mt-4 text-sm text-(--color-awaken-ink-soft)">
        {result.correctCount} correct · {result.wrongCount} wrong · {result.unansweredCount} unanswered
        {result.negativeMarking > 0 ? ` (each wrong answer cost -${result.negativeMarking})` : ""}
        {result.xpAwarded > 0 ? ` · +${result.xpAwarded} XP` : ""}
      </p>

      <h2 className="mt-8 text-lg font-semibold">By topic</h2>
      <ul className="mt-3 space-y-3">
        {Object.entries(result.topicBreakdown).map(([topic, s]) => (
          <li key={topic} className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{topic}</span>
              <span className="text-(--color-awaken-ink-soft)">
                {s.correct}/{s.total}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar percent={s.total > 0 ? (s.correct / s.total) * 100 : 0} />
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Review</h2>
      <div className="mt-3 space-y-3">
        {result.questions.map((q, i) => {
          const correct = q.yourChoice === q.correctIndex;
          return (
            <details
              key={q.id}
              className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 open:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 marker:content-none">
                <span className="text-sm">
                  <span className="text-(--color-awaken-ink-soft)">Q{i + 1}. </span>
                  {q.text}
                </span>
                <span className="shrink-0">
                  <StatusPill tone={correct ? "success" : q.yourChoice === undefined ? "neutral" : "danger"}>
                    {correct ? "Correct" : q.yourChoice === undefined ? "Skipped" : "Wrong"}
                  </StatusPill>
                </span>
              </summary>
              <ul className="mt-3 space-y-1.5 text-sm">
                {q.options.map((option, oi) => {
                  let style = "text-(--color-awaken-ink-soft)";
                  if (oi === q.correctIndex) style = "font-medium text-(--color-awaken-success)";
                  else if (oi === q.yourChoice) style = "font-medium text-(--color-awaken-danger)";
                  return (
                    <li key={oi} className={style}>
                      {oi === q.correctIndex ? "✓ " : oi === q.yourChoice ? "✗ " : "· "}
                      {option}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{q.explanation}</p>
            </details>
          );
        })}
      </div>
    </div>
  );
}
