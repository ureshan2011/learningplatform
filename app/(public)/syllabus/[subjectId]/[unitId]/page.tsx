import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, getUnit, listSubjectSessions } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { UnitSyllabusBody } from "@/components/syllabus/UnitSyllabusBody";
import { UNIT_SEO } from "@/lib/content/unit-seo";
import { localeAttrs } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { GRADES, MEDIUM_EN } from "@/lib/seo/site";
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

  const [subject, loc] = await Promise.all([getSubject(subjectId), localeAttrs()]);
  if (!subject) notFound();

  const unit = await getUnit(unitId);
  if (!unit || unit.subjectId !== subjectId) notFound();

  const sessions = await listSubjectSessions(subjectId).catch((err) => {
    console.error("[syllabus] class timetable failed to load", err);
    return [] as ClassSession[];
  });

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
      <main lang={loc.lang} className={`mx-auto max-w-3xl px-5 py-10 ${loc.className}`}>
        <Link
          href={`/syllabus/${subjectId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-ict-fg-mute transition-colors duration-[120ms] hover:text-ict-fg"
        >
          <Icon name="arrow_back" className="!text-base" />
          {subject.name} syllabus
        </Link>

        <UnitSyllabusBody subject={subject} unit={unit} sessions={sessions} />
      </main>
    </>
  );
}
