import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, listSubjectSessions, listUnits } from "@/lib/queries";
import { Icon } from "@/components/ui/Icon";
import { SubjectSyllabusBody } from "@/components/syllabus/SubjectSyllabusBody";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import type { ClassSession } from "@/lib/types";

/**
 * Public, crawlable, and cached for everyone rather than rendered per visitor
 * — the same posture as /notes. Five minutes rather than an hour because the
 * class timetable is on this page now; anything finer-grained than that
 * (a countdown, "live now") is computed on the client from the timestamps, so
 * a cached copy is never wrong, only slightly behind on which classes exist.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}): Promise<Metadata> {
  const { subjectId } = await params;
  const subject = await getSubject(subjectId);
  if (!subject) return {};
  return {
    title: `${subject.name} syllabus — every unit, lesson and live class`,
    description: `The full ${subject.name} syllabus as an interactive roadmap: every unit and competency level, exam-targeted objectives, where marks concentrate — and the live class for each topic. Free to browse.`,
    alternates: { canonical: `/syllabus/${subjectId}` },
  };
}

export default async function SubjectSyllabusPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const units = await listUnits(subjectId);

  // A missing or broken timetable must not take the syllabus down with it —
  // the syllabus is the page, the classes are the invitation on top of it.
  const sessions = await listSubjectSessions(subjectId).catch((err) => {
    console.error("[syllabus] class timetable failed to load", err);
    return [] as ClassSession[];
  });

  return (
    <>
      <JsonLd
        data={graphJsonLd([
          courseJsonLd({
            name: subject.name,
            description: subject.description,
            priceLKR: subject.priceLKR,
            path: `/syllabus/${subjectId}`,
          }),
        ])}
      />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <Link
          href="/syllabus"
          className="inline-flex items-center gap-1 text-sm text-ict-fg-mute transition-colors duration-[120ms] hover:text-ict-fg"
        >
          <Icon name="arrow_back" className="!text-base" />
          All syllabuses
        </Link>

        <div className="mt-4">
          <SubjectSyllabusBody
            subject={subject}
            units={units}
            sessions={sessions}
            unitHrefBase={`/syllabus/${subjectId}`}
          />
        </div>
      </main>
    </>
  );
}
