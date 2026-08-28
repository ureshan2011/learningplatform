import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, getUnit } from "@/lib/queries";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

/** One unit's lessons: exam objectives and exam-focus notes for each competency level. */
export default async function UnitPage({
  params,
}: {
  params: Promise<{ subjectId: string; unitId: string }>;
}) {
  const { subjectId, unitId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}/syllabus/${unitId}`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const unit = await getUnit(unitId);
  if (!unit || unit.subjectId !== subjectId) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/subjects/${subjectId}/syllabus`}
        className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline"
      >
        <Icon name="arrow_back" className="!text-base" />
        Full syllabus
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill tone="accent">Grade {unit.gradeYear}</StatusPill>
        <StatusPill tone="neutral">{unit.periods} periods</StatusPill>
      </div>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-indigo-soft) text-sm font-bold text-(--color-awaken-indigo)">
          {unit.competencyNumber}
        </span>
        {unit.title}
      </h1>
      <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{unit.competencyStatement}</p>

      <ol className="mt-8 space-y-5">
        {unit.lessons.map((lesson) => (
          <li
            key={lesson.id}
            className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">
                <span className="text-(--color-awaken-accent)">{lesson.id}</span> {lesson.title}
              </h2>
              <StatusPill tone="neutral">{lesson.periods} periods</StatusPill>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">
                Exam objectives
              </p>
              <ul className="mt-1.5 space-y-1">
                {lesson.examObjectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon name="check_circle" className="mt-0.5 !text-base shrink-0 text-(--color-awaken-success)" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">
                Important areas to cover
              </p>
              <ul className="mt-1.5 space-y-1">
                {lesson.importantAreas.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon name="priority_high" className="mt-0.5 !text-base shrink-0 text-(--color-awaken-accent)" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!lesson.content ? (
              <p className="mt-3 text-xs text-(--color-awaken-ink-soft)">Lesson content not added yet.</p>
            ) : null}
          </li>
        ))}
      </ol>
    </main>
  );
}
