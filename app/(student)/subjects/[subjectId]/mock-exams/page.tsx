import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject, listMockExams, getMockExamAttempt } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { SubjectPageShell } from "@/components/subject/SubjectShell";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  IconBadge,
  StatusChip,
} from "@/components/ds";
import type { MockExam, MockExamAttempt } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MockExamsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await requirePageUser(`/subjects/${subjectId}/mock-exams`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  const exams = access.allowed ? await listMockExams(subjectId) : [];
  const attemptByExam = access.allowed
    ? await attemptsFor(user.uid, exams)
    : new Map<string, MockExamAttempt>();

  const sat = exams.filter((e) => attemptByExam.get(e.id)?.submittedAt).length;

  return (
    <SubjectPageShell
      subjectId={subjectId}
      subjectName={subject.name}
      title="Mock exams"
      subtitle="Full timed papers with negative marking, just like the real thing — not self-paced practice."
      access={access}
      lockedBody="Timed papers scored the way the real one is, with negative marking and your rank against everyone else who sat it."
    >
      {exams.length === 0 ? (
        <EmptyState
          icon="schedule"
          title="No papers yet"
          body={`Nothing is ready for ${subject.name} yet. Your teacher publishes a paper here when it is set.`}
          action={
            <ButtonLink
              href={`/subjects/${subjectId}/practice`}
              variant="outline"
              size="sm"
              arrow="right"
            >
              Practise instead
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              {exams.length} paper{exams.length === 1 ? "" : "s"}
            </Badge>
            {sat > 0 ? <Badge tone="success">{sat} sat</Badge> : null}
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {exams.map((exam) => (
              <li key={exam.id}>
                <MockExamCard
                  subjectId={subjectId}
                  exam={exam}
                  attempt={attemptByExam.get(exam.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </SubjectPageShell>
  );
}

async function attemptsFor(uid: string, exams: MockExam[]): Promise<Map<string, MockExamAttempt>> {
  const entries = await Promise.all(
    exams.map(async (exam) => [exam.id, await getMockExamAttempt(uid, exam.id)] as const),
  );
  return new Map(entries.filter((e): e is [string, MockExamAttempt] => e[1] !== null));
}

function MockExamCard({
  subjectId,
  exam,
  attempt,
}: {
  subjectId: string;
  exam: MockExam;
  attempt?: MockExamAttempt;
}) {
  const done = Boolean(attempt?.submittedAt);
  return (
    <Card radius="card" className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <IconBadge icon={done ? "military_tech" : "timer"} tone={done ? "soft" : "dark"} size={40} round />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold text-ict-paper-50">{exam.title}</h2>
          <p className="mt-1 text-xs text-ict-ink-300">
            {exam.questionIds.length} questions · {exam.durationMinutes} min
            {exam.negativeMarking > 0
              ? ` · −${exam.negativeMarking} per wrong answer`
              : " · no negative marking"}
          </p>
        </div>
      </div>

      {done && attempt ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusChip tone="success">{attempt.score} pts</StatusChip>
          {attempt.rank && attempt.totalAttempts ? (
            <span className="text-xs text-ict-ink-300">
              Rank {attempt.rank} of {attempt.totalAttempts}
            </span>
          ) : null}
        </div>
      ) : attempt ? (
        <div className="mt-4">
          <StatusChip tone="warning">In progress</StatusChip>
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <ButtonLink
          href={`/subjects/${subjectId}/mock-exams/${exam.id}`}
          variant={done ? "outline" : "primary"}
          size="sm"
          arrow="right"
        >
          {done ? "View results" : attempt ? "Resume" : "Start paper"}
        </ButtonLink>
      </div>
    </Card>
  );
}
