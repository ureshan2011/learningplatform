import { SyllabusHero } from "@/components/syllabus/SyllabusHero";
import { SyllabusExplorer } from "@/components/syllabus/SyllabusExplorer";
import { indexClassesBySyllabus, toTopicClass } from "@/lib/content/topic-classes";
import { ButtonLink, Card } from "@/components/ds";
import type { ClassSession, Subject, Unit } from "@/lib/types";

/**
 * A subject's whole syllabus: the hero, the roadmap, and the invitation.
 *
 * Extracted from `/syllabus/[subjectId]` so the same roadmap can appear on a
 * signed-in screen without being written twice. It names no palette colour of
 * its own — everything comes from `components/ds/` and the role tokens — so it
 * renders as white cards on the public page and as near-black panels inside
 * `.ict-app`, from one file.
 *
 * `trialCta` is off for a student who is already subscribed: the public page's
 * closing pitch is noise to someone who has already bought, and it is the only
 * part of this screen that differs between the two.
 */
export function SubjectSyllabusBody({
  subject,
  units,
  sessions,
  trialCta = true,
}: {
  subject: Subject;
  units: Unit[];
  sessions: ClassSession[];
  trialCta?: boolean;
}) {
  const classIndex = indexClassesBySyllabus(units, sessions);
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);
  const totalPeriods = units.reduce((n, u) => n + u.periods, 0);
  const nextClass = sessions[0] ? toTopicClass(sessions[0]) : undefined;

  return (
    <>
      <SyllabusHero
        subjectId={subject.id}
        subjectName={subject.name}
        gradeLabel={`A/L · ${subject.medium[0].toUpperCase()}${subject.medium.slice(1)} medium`}
        unitCount={units.length}
        lessonCount={totalLessons}
        periodCount={totalPeriods}
        classCount={sessions.length}
        nextClass={nextClass}
      />

      <div id="roadmap" className="mt-10 scroll-mt-4">
        {units.length === 0 ? (
          <Card radius="card" className="p-6 text-sm text-ict-fg-mute">
            No syllabus breakdown has been loaded for {subject.name} yet.
          </Card>
        ) : (
          <SyllabusExplorer subjectId={subject.id} units={units} classIndex={classIndex} />
        )}
      </div>

      {trialCta ? (
        <Card variant="feature" radius="panel" className="mt-16 p-8 sm:p-12">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-on-feature sm:text-3xl">
              Pick a topic. Sit in the class that teaches it.
            </h2>
            <p className="mt-3 leading-relaxed text-ict-on-feature-soft">
              Live lessons in Sinhala, quizzes during class, an island-wide leaderboard
              and every past paper worked through step by step. Every subject starts
              with a free 7-day trial — no card needed.
            </p>
            <ButtonLink href={`/go?do=trial&subject=${subject.id}`} variant="primary" className="mt-6">
              Start my free trial
            </ButtonLink>
          </div>
        </Card>
      ) : null}
    </>
  );
}
