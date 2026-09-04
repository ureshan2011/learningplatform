import Link from "next/link";
import { col } from "@/lib/firebase/admin";
import { requireStaffPage } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { publicEnv } from "@/lib/env";
import { CreateMockExamForm } from "@/components/teacher/CreateMockExamForm";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import type { MockExam, MockExamAttempt } from "@/lib/types";

export const dynamic = "force-dynamic";

/** How many mock-exam attempt documents to scan before narrowing in memory — see lib/queries.ts. */
const SCAN_WINDOW = 500;

export default async function TeacherMockExamsPage() {
  const user = await requireStaffPage("/teacher/mock-exams");

  const subjects = await listSubjects();
  const exams = await allMockExams();
  const stats = await statsByExam(exams.map((e) => e.id));
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/teacher" className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
        <Icon name="arrow_back" className="!text-base" />
        Teacher console
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <Icon name="schedule" className="text-(--color-awaken-accent)" />
        Mock exams
      </h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        Full timed papers, scored with negative marking, drawn from your question bank.
      </p>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="add_task" className="text-(--color-awaken-accent)" />
          Create a mock exam
        </h2>
        {subjects.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">Add a subject first.</p>
        ) : (
          <div className="mt-4">
            <CreateMockExamForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
          </div>
        )}
      </section>

      <section className="mt-10 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="receipt_long" className="text-(--color-awaken-accent)" />
          Existing mock exams
        </h2>
        {exams.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {exams.map((exam) => {
              const stat = stats.get(exam.id);
              return (
                <li
                  key={exam.id}
                  className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{exam.title}</p>
                    <span className="rounded-full bg-(--color-awaken-indigo-soft) px-2.5 py-0.5 text-xs font-semibold text-(--color-awaken-indigo)">
                      {subjectName.get(exam.subjectId) ?? exam.subjectId}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                    {exam.questionIds.length} questions · {exam.durationMinutes} min
                    {exam.negativeMarking > 0 ? ` · -${exam.negativeMarking} per wrong answer` : " · no negative marking"}
                  </p>
                  <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                    {stat ? `${stat.attempts} submitted · average score ${stat.avgScore}` : "No submissions yet"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </main>
    </>
  );
}

/** Single tenantId equality filter — automatically indexed, no composite index needed. */
async function allMockExams(): Promise<MockExam[]> {
  const snap = await col.mockExams().where("tenantId", "==", publicEnv.tenantId).limit(200).get();
  return snap.docs.map((d) => d.data() as MockExam).sort((a, b) => b.createdAt - a.createdAt);
}

async function statsByExam(examIds: string[]): Promise<Map<string, { attempts: number; avgScore: number }>> {
  if (examIds.length === 0) return new Map();
  const wanted = new Set(examIds);

  const snap = await col.mockExamAttempts().where("tenantId", "==", publicEnv.tenantId).limit(SCAN_WINDOW).get();
  const scoresByExam = new Map<string, number[]>();
  for (const doc of snap.docs) {
    const attempt = doc.data() as MockExamAttempt;
    if (attempt.submittedAt === undefined || !wanted.has(attempt.mockExamId)) continue;
    const scores = scoresByExam.get(attempt.mockExamId) ?? [];
    scores.push(attempt.score ?? 0);
    scoresByExam.set(attempt.mockExamId, scores);
  }

  const out = new Map<string, { attempts: number; avgScore: number }>();
  for (const [examId, scores] of scoresByExam) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    out.set(examId, { attempts: scores.length, avgScore: Math.round(avg * 10) / 10 });
  }
  return out;
}
