import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, listSubjectSessions, listUnits } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { SyllabusHero } from "@/components/syllabus/SyllabusHero";
import { SyllabusExplorer } from "@/components/syllabus/SyllabusExplorer";
import { indexClassesBySyllabus, toTopicClass } from "@/lib/content/topic-classes";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import { ButtonLink, Card } from "@/components/ds-cream";
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

  const classIndex = indexClassesBySyllabus(units, sessions);
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);
  const totalPeriods = units.reduce((n, u) => n + u.periods, 0);
  const nextClass = sessions[0] ? toTopicClass(sessions[0]) : undefined;

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
      <SiteHeader user={null} />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <Link
          href="/syllabus"
          className="inline-flex items-center gap-1 text-sm text-ict-ink-400 transition-colors duration-[120ms] hover:text-ict-ink-900"
        >
          <Icon name="arrow_back" className="!text-base" />
          All syllabuses
        </Link>

        <div className="mt-4">
          <SyllabusHero
            subjectId={subjectId}
            subjectName={subject.name}
            gradeLabel={`A/L · ${subject.medium[0].toUpperCase()}${subject.medium.slice(1)} medium`}
            unitCount={units.length}
            lessonCount={totalLessons}
            periodCount={totalPeriods}
            classCount={sessions.length}
            nextClass={nextClass}
          />
        </div>

        <div id="roadmap" className="mt-10 scroll-mt-4">
          {units.length === 0 ? (
            <Card radius="card" className="p-6 text-sm text-ict-ink-400">
              No syllabus breakdown has been loaded for {subject.name} yet.
            </Card>
          ) : (
            <SyllabusExplorer subjectId={subjectId} units={units} classIndex={classIndex} />
          )}
        </div>

        <Card variant="dark" radius="panel" className="mt-16 p-8 sm:p-12">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-paper-50 sm:text-3xl">
              Pick a topic. Sit in the class that teaches it.
            </h2>
            <p className="mt-3 leading-relaxed text-ict-ink-300">
              Live lessons in Sinhala, quizzes during class, an island-wide leaderboard
              and every past paper worked through step by step. Every subject starts
              with a free 7-day trial — no card needed.
            </p>
            <ButtonLink href={`/signin?next=/subjects/${subjectId}`} variant="primary" className="mt-6">
              Start my free trial
            </ButtonLink>
          </div>
        </Card>
      </main>
    </>
  );
}
