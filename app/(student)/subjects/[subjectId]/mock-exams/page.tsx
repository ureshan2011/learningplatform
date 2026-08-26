import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, listMockExams, getMockExamAttempt } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { SiteHeader } from "@/components/nav/SiteHeader";
import type { MockExam, MockExamAttempt } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MockExamsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}/mock-exams`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  const exams = access.allowed ? await listMockExams(subjectId) : [];
  const attemptByExam = access.allowed ? await attemptsFor(user.uid, exams) : new Map<string, MockExamAttempt>();

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="text-sm text-(--color-awaken-ink-soft) underline">
        ← {subject.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Mock exams</h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        Full timed papers with negative marking, just like the real thing — not self-paced practice.
      </p>

      {!access.allowed ? (
        <div className="mt-8 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5 text-sm">
          <p className="font-medium text-(--color-awaken-accent)">
            {access.reason === "expired" ? "Your subscription has ended." : "You are not enrolled in this subject."}
          </p>
          <p className="mt-1 text-(--color-awaken-ink-soft)">Subscribe to unlock mock exams.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
          >
            Subscribe
          </Link>
        </div>
      ) : exams.length === 0 ? (
        <p className="mt-8 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
          No mock exams are ready yet for {subject.name}. Check back once your teacher has added one.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {exams.map((exam) => (
            <MockExamRow key={exam.id} subjectId={subjectId} exam={exam} attempt={attemptByExam.get(exam.id)} />
          ))}
        </ul>
      )}
      </main>
    </>
  );
}

async function attemptsFor(uid: string, exams: MockExam[]): Promise<Map<string, MockExamAttempt>> {
  const entries = await Promise.all(
    exams.map(async (exam) => [exam.id, await getMockExamAttempt(uid, exam.id)] as const),
  );
  return new Map(entries.filter((e): e is [string, MockExamAttempt] => e[1] !== null));
}

function MockExamRow({
  subjectId,
  exam,
  attempt,
}: {
  subjectId: string;
  exam: MockExam;
  attempt?: MockExamAttempt;
}) {
  const href = `/subjects/${subjectId}/mock-exams/${exam.id}`;
  return (
    <li className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-semibold">{exam.title}</h2>
        {attempt?.submittedAt ? (
          <span className="shrink-0 rounded-full bg-(--color-awaken-success-soft) px-2.5 py-0.5 text-xs font-semibold text-(--color-awaken-success)">
            {attempt.score} pts · rank {attempt.rank}/{attempt.totalAttempts}
          </span>
        ) : attempt ? (
          <span className="shrink-0 rounded-full bg-(--color-awaken-accent-soft) px-2.5 py-0.5 text-xs font-semibold text-(--color-awaken-accent)">
            In progress
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        {exam.questionIds.length} questions · {exam.durationMinutes} min
        {exam.negativeMarking > 0 ? ` · -${exam.negativeMarking} per wrong answer` : " · no negative marking"}
      </p>
      <Link
        href={href}
        className="mt-3 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
      >
        {attempt?.submittedAt ? "View results" : attempt ? "Resume" : "Start"}
      </Link>
    </li>
  );
}
