import type { Metadata } from "next";
import { listSubjects, listUnits } from "@/lib/queries";
import { ButtonLink, Card, CardLink, EmptyState, PageHeader } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import type { Subject, Unit } from "@/lib/types";

export const metadata: Metadata = {
  title: "A/L ICT syllabus, unit by unit",
  description:
    "The full A/L ICT syllabus (Grades 12 and 13) broken into units and lessons, with exam-targeted objectives and where marks concentrate — free, no sign-up needed.",
  alternates: { canonical: "/syllabus" },
};

// Same reasoning as /notes: this is public, crawlable content, so it renders
// from a cached, guest-only pass rather than a per-visitor session read.
export const revalidate = 3600;

export default async function SyllabusIndexPage() {
  const subjects = await listSubjects().catch(() => [] as Subject[]);
  const withUnits = await Promise.all(
    subjects.map(async (s) => ({ subject: s, units: await listUnits(s.id).catch(() => [] as Unit[]) })),
  );
  const ready = withUnits.filter((s) => s.units.length > 0);

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free to browse · no sign-up"
          title="The full syllabus, unit by unit"
          subtitle="Every official unit and lesson, with exam-targeted objectives and where marks tend to concentrate."
        />

        {ready.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon="auto_stories"
              title="Nothing published yet"
              body="Check back soon — units are being added."
            />
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ready.map(({ subject, units }) => (
              <li key={subject.id}>
                <CardLink href={`/syllabus/${subject.id}`} className="p-5">
                  <p className="font-display font-bold text-ict-fg">{subject.name}</p>
                  <p className="mt-1 text-sm text-ict-fg-mute">
                    {units.length} units · {units.reduce((n, u) => n + u.lessons.length, 0)} lessons
                  </p>
                  <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-ict-accent-fg">
                    Explore
                    <Icon name="chevron_right" className="!text-sm" />
                  </span>
                </CardLink>
              </li>
            ))}
          </ul>
        )}

        <Card variant="feature" radius="panel" className="mt-14 p-6 sm:p-8">
          <h2 className="font-display text-lg font-extrabold text-ict-on-feature">Want the live class?</h2>
          <p className="mt-2 text-sm text-ict-on-feature-soft">
            Live lessons in Sinhala, quizzes during class, an island-wide leaderboard and every
            past paper worked through step by step.
          </p>
          <ButtonLink href="/go?do=trial&subject=al-ict" variant="primary" className="mt-5">
            Join a class
          </ButtonLink>
        </Card>
      </main>
    </>
  );
}
