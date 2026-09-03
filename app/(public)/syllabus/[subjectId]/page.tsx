import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, listSubjectSessions, listUnits } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { SyllabusHero } from "@/components/syllabus/SyllabusHero";
import { SyllabusExplorer } from "@/components/syllabus/SyllabusExplorer";
import { indexClassesBySyllabus, toTopicClass } from "@/lib/content/topic-classes";
import { publicEnv } from "@/lib/env";
import type { ClassSession, Subject } from "@/lib/types";

/** Makes the subject eligible for Google's Course rich result — price, provider, mode, all real. */
function courseJsonLd(subject: Subject) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: subject.name,
    description: subject.description,
    provider: { "@type": "EducationalOrganization", name: "ICT Campus", url: publicEnv.appUrl },
    inLanguage: subject.medium === "sinhala" ? "si" : "en",
    educationalLevel: "Advanced Level",
    offers: {
      "@type": "Offer",
      price: subject.priceLKR,
      priceCurrency: "LKR",
      category: "subscription",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "P1M",
    },
  };
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd(subject)) }}
      />
      <SiteHeader user={null} />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <Link
          href="/syllabus"
          className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) transition-colors hover:text-(--color-awaken-ink)"
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
            <p className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-6 text-sm text-(--color-awaken-ink-soft)">
              No syllabus breakdown has been loaded for {subject.name} yet.
            </p>
          ) : (
            <SyllabusExplorer subjectId={subjectId} units={units} classIndex={classIndex} />
          )}
        </div>

        <section className="relative mt-16 overflow-hidden rounded-[2rem] bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) p-8 text-white sm:p-12">
          <div
            aria-hidden
            className="awaken-blob pointer-events-none absolute -top-20 -right-10 size-64 rounded-full bg-white/20 blur-3xl"
          />
          <div className="relative max-w-xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">
              Pick a topic. Sit in the class that teaches it.
            </h2>
            <p className="mt-3 leading-relaxed text-white/90">
              Live lessons in Sinhala, quizzes during class, an island-wide leaderboard
              and every past paper worked through step by step. Every subject starts
              with a free 7-day trial — no card needed.
            </p>
            <Link
              href={`/signin?next=/subjects/${subjectId}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-(--color-awaken-accent) shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99]"
            >
              <Icon name="videocam" className="!text-lg" />
              Start my free trial
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
