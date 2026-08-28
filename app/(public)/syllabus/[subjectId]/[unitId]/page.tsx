import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, getUnit, listSubjectSessions } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { LessonAccordion } from "@/components/syllabus/LessonAccordion";
import { unitColors, unitIcon, isHighYield } from "@/lib/content/unit-visuals";
import { indexClassesBySyllabus } from "@/lib/content/topic-classes";
import type { ClassSession } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string; unitId: string }>;
}): Promise<Metadata> {
  const { unitId } = await params;
  const unit = await getUnit(unitId);
  if (!unit) return {};
  return {
    title: `${unit.title} — exam objectives & focus areas`,
    description: `${unit.competencyStatement} ${unit.lessons.length} lessons with exam-targeted objectives and where marks concentrate.`,
  };
}

export default async function UnitSyllabusPage({
  params,
}: {
  params: Promise<{ subjectId: string; unitId: string }>;
}) {
  const { subjectId, unitId } = await params;

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const unit = await getUnit(unitId);
  if (!unit || unit.subjectId !== subjectId) notFound();

  const sessions = await listSubjectSessions(subjectId).catch((err) => {
    console.error("[syllabus] class timetable failed to load", err);
    return [] as ClassSession[];
  });
  // Matching against this unit alone keeps a class titled after another unit
  // from being pulled in here by a loose text match.
  const classIndex = indexClassesBySyllabus([unit], sessions);
  const unitClasses = classIndex.byUnit[unit.id] ?? [];

  const tone = unitColors(unit.competencyNumber);

  return (
    <>
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link
          href={`/syllabus/${subjectId}`}
          className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) transition-colors hover:text-(--color-awaken-ink)"
        >
          <Icon name="arrow_back" className="!text-base" />
          {subject.name} syllabus
        </Link>

        <div
          className="awaken-rise relative mt-4 overflow-hidden rounded-3xl border bg-(--color-awaken-card) p-6 sm:p-8"
          style={{
            borderColor: tone.line,
            boxShadow: `0 20px 50px -30px rgba(${tone.rgb}, 0.7)`,
          }}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ backgroundImage: `linear-gradient(90deg, ${tone.gradFrom}, ${tone.gradTo})` }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: tone.soft, color: tone.ink }}
            >
              Grade {unit.gradeYear}
            </span>
            <span className="rounded-full bg-(--color-awaken-bg) px-2.5 py-1 text-xs font-semibold text-(--color-awaken-ink-soft)">
              {unit.periods} periods
            </span>
            {isHighYield(unit.periods) ? (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide text-white uppercase"
                style={{ backgroundImage: `linear-gradient(120deg, ${tone.gradFrom}, ${tone.gradTo})` }}
              >
                High-yield unit
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
            <span
              className="syl-float flex size-12 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundImage: `linear-gradient(140deg, ${tone.gradFrom}, ${tone.gradTo})` }}
            >
              <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
            </span>
            {unit.title}
          </h1>
          <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{unit.competencyStatement}</p>
        </div>

        <div className="mt-8">
          <LessonAccordion
            lessons={unit.lessons}
            tone={tone}
            subjectId={subjectId}
            classesByLesson={classIndex.byLesson}
            unitClasses={unitClasses}
          />
        </div>
      </main>
    </>
  );
}
