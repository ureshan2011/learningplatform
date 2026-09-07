import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, getUnit, listSubjectSessions } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { LessonAccordion } from "@/components/syllabus/LessonAccordion";
import { unitColors, unitIcon, isHighYield } from "@/lib/content/unit-visuals";
import { indexClassesBySyllabus } from "@/lib/content/topic-classes";
import { Card } from "@/components/ds-cream";
import type { ClassSession } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string; unitId: string }>;
}): Promise<Metadata> {
  const { subjectId, unitId } = await params;
  const unit = await getUnit(unitId);
  if (!unit) return {};
  return {
    title: `${unit.title} — exam objectives & focus areas`,
    description: `${unit.competencyStatement} ${unit.lessons.length} lessons with exam-targeted objectives and where marks concentrate.`,
    alternates: { canonical: `/syllabus/${subjectId}/${unitId}` },
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
          className="inline-flex items-center gap-1 text-sm text-ict-ink-400 transition-colors duration-[120ms] hover:text-ict-ink-900"
        >
          <Icon name="arrow_back" className="!text-base" />
          {subject.name} syllabus
        </Link>

        <Card radius="panel" className="relative mt-4 overflow-hidden p-6 sm:p-8">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: tone.gradTo }} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: tone.soft, color: tone.ink }}>
              Grade {unit.gradeYear}
            </span>
            <span className="rounded-full bg-ict-paper-200 px-2.5 py-1 text-xs font-semibold text-ict-ink-500">
              {unit.periods} periods
            </span>
            {isHighYield(unit.periods) ? (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide text-white uppercase"
                style={{ background: tone.gradTo }}
              >
                High-yield unit
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 flex items-center gap-3 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-ict-md text-white"
              style={{ background: tone.gradTo }}
            >
              <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
            </span>
            {unit.title}
          </h1>
          <p className="mt-2 text-sm text-ict-ink-400">{unit.competencyStatement}</p>
        </Card>

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
