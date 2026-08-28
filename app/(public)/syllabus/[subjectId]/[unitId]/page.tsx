import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, getUnit } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { LessonAccordion } from "@/components/syllabus/LessonAccordion";
import { unitIcon, unitTone, TONE_CLASSES, isHighYield } from "@/lib/content/unit-visuals";

export const revalidate = 3600;

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

  const tone = unitTone(unit.competencyNumber);
  const toneClass = TONE_CLASSES[tone];

  return (
    <>
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link
          href={`/syllabus/${subjectId}`}
          className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline"
        >
          <Icon name="arrow_back" className="!text-base" />
          {subject.name} syllabus
        </Link>

        <div className={`mt-4 rounded-2xl border ${toneClass.border} bg-(--color-awaken-card) p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full ${toneClass.bg} ${toneClass.fg} px-2.5 py-1 text-xs font-semibold`}>
              Grade {unit.gradeYear}
            </span>
            <span className="rounded-full bg-(--color-awaken-bg) px-2.5 py-1 text-xs font-semibold text-(--color-awaken-ink-soft)">
              {unit.periods} periods
            </span>
            {isHighYield(unit.periods) ? (
              <span className={`rounded-full ${toneClass.bg} ${toneClass.fg} px-2.5 py-1 text-xs font-bold uppercase tracking-wide`}>
                High-yield unit
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 flex items-center gap-3 text-2xl font-extrabold tracking-tight">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClass.bg} ${toneClass.fg}`}>
              <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
            </span>
            {unit.title}
          </h1>
          <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{unit.competencyStatement}</p>
        </div>

        <div className="mt-8">
          <LessonAccordion lessons={unit.lessons} tone={tone} />
        </div>
      </main>
    </>
  );
}
