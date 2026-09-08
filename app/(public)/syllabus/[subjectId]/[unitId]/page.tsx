import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, getUnit, listSubjectSessions } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { LessonAccordion } from "@/components/syllabus/LessonAccordion";
import { unitColors, unitIcon, isHighYield } from "@/lib/content/unit-visuals";
import { indexClassesBySyllabus } from "@/lib/content/topic-classes";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { GRADES, MEDIUM_EN } from "@/lib/seo/site";
import { Card } from "@/components/ds-cream";
import type { ClassSession } from "@/lib/types";

export const revalidate = 300;

/**
 * A qualifier and the long-tail phrases a student actually types for each of
 * the 14 NIE competency levels — "learn python for AL ICT", "logic gates
 * notes AL" — so this one template ranks for each unit's own granular
 * queries instead of only the site-wide "A/L ICT" terms. Keyed by
 * `competencyNumber`, which is stable across syllabus years.
 */
const UNIT_SEO: Record<number, { qualifier?: string; keywords: string[] }> = {
  1: { keywords: ["concept of ICT notes A/L", "data vs information A/L ICT", "A/L ICT unit 1 notes"] },
  2: { keywords: ["computer generations A/L ICT", "von Neumann architecture A/L ICT", "computer hardware notes A/L ICT"] },
  3: {
    qualifier: "Number Systems",
    keywords: ["number systems A/L ICT", "binary to hexadecimal A/L ICT", "two's complement A/L ICT notes"],
  },
  4: {
    qualifier: "Logic Gates",
    keywords: ["logic gates notes AL", "logic gates notes A/L ICT", "truth tables A/L ICT", "Boolean algebra A/L ICT"],
  },
  5: { keywords: ["operating system notes A/L ICT", "types of operating systems A/L ICT"] },
  6: { keywords: ["networking notes A/L ICT", "OSI model A/L ICT", "data communication A/L ICT notes"] },
  7: { keywords: ["system analysis and design A/L ICT", "SDLC notes A/L ICT"] },
  8: {
    qualifier: "SQL & Databases",
    keywords: ["database management notes A/L ICT", "SQL notes A/L ICT", "ER diagram A/L ICT", "normalization A/L ICT"],
  },
  9: {
    qualifier: "Python",
    keywords: ["learn python for AL ICT", "python programming notes A/L ICT", "python past paper questions A/L ICT"],
  },
  10: { qualifier: "HTML5", keywords: ["HTML5 notes A/L ICT", "web development A/L ICT notes"] },
  11: { keywords: ["Internet of Things notes A/L ICT", "IoT A/L ICT"] },
  12: { keywords: ["ICT in business notes A/L", "e-commerce A/L ICT notes"] },
  13: { keywords: ["new trends in ICT A/L notes", "cloud computing and AI A/L ICT"] },
  14: { keywords: ["A/L ICT project guide", "ICT SBA project A/L"] },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string; unitId: string }>;
}): Promise<Metadata> {
  const { subjectId, unitId } = await params;
  const unit = await getUnit(unitId);
  if (!unit) return {};
  const seo = UNIT_SEO[unit.competencyNumber];
  const title = `${unit.title}${seo?.qualifier ? ` (${seo.qualifier})` : ""} — A/L ICT notes & exam objectives`;
  const description = `${unit.competencyStatement} Free A/L ICT ${GRADES} notes for this unit — ${unit.lessons.length} lessons with exam-targeted objectives and where marks concentrate, ${MEDIUM_EN}.`;
  return {
    title,
    description,
    alternates: { canonical: `/syllabus/${subjectId}/${unitId}` },
    keywords: [`A/L ICT ${unit.title}`, `${unit.title} A/L ICT syllabus`, ...(seo?.keywords ?? [])],
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
  const seo = UNIT_SEO[unit.competencyNumber];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Syllabus", path: "/syllabus" },
          { name: `${subject.name} syllabus`, path: `/syllabus/${subjectId}` },
          { name: unit.title, path: `/syllabus/${subjectId}/${unitId}` },
        ])}
      />
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
            {seo?.qualifier ? (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: tone.soft, color: tone.ink }}
              >
                {seo.qualifier}
              </span>
            ) : null}
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
