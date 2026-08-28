import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSubject, listUnits } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StatTile";
import { UnitExplorer } from "@/components/syllabus/UnitExplorer";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}): Promise<Metadata> {
  const { subjectId } = await params;
  const subject = await getSubject(subjectId);
  if (!subject) return {};
  return {
    title: `${subject.name} syllabus — units, lessons & exam focus`,
    description: `Every unit and lesson in the ${subject.name} syllabus, with exam-targeted objectives and where marks concentrate. Free to browse.`,
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
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);
  const totalPeriods = units.reduce((n, u) => n + u.periods, 0);

  return (
    <>
      <SiteHeader user={null} />
      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <Link href="/syllabus" className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
          <Icon name="arrow_back" className="!text-base" />
          All syllabuses
        </Link>

        <div className="mt-4 rounded-2xl border border-(--color-awaken-line) bg-gradient-to-br from-(--color-awaken-card) to-(--color-awaken-accent-soft) p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            <Icon name="auto_stories" className="!text-2xl text-(--color-awaken-accent)" />
            {subject.name} syllabus
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-(--color-awaken-ink-soft)">
            Every official unit and competency-level lesson, with exam-targeted objectives and
            exam-focus notes for each — tap a unit to go deeper. Free to explore, no sign-up
            needed.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            <StatTile icon="auto_stories" label="Units" value={units.length} />
            <StatTile icon="description" label="Lessons" value={totalLessons} />
            <StatTile icon="schedule" label="Periods" value={totalPeriods} />
          </div>
        </div>

        <div className="mt-8">
          {units.length === 0 ? (
            <p className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
              No syllabus breakdown has been loaded for {subject.name} yet.
            </p>
          ) : (
            <UnitExplorer subjectId={subjectId} units={units} />
          )}
        </div>

        <section className="mt-14 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
          <h2 className="text-lg font-bold">Want live teaching on every unit?</h2>
          <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
            Live lessons in Sinhala, quizzes during class, an island-wide leaderboard and every
            past paper worked through step by step.
          </p>
          <Link
            href="/signin"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white"
          >
            <Icon name="videocam" className="!text-base" />
            Join a class
          </Link>
        </section>
      </main>
    </>
  );
}
