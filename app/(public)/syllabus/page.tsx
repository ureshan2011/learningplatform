import Link from "next/link";
import type { Metadata } from "next";
import { listSubjects, listUnits } from "@/lib/queries";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import type { Subject, Unit } from "@/lib/types";

export const metadata: Metadata = {
  title: "O/L & A/L ICT syllabus, unit by unit",
  description:
    "The full O/L and A/L ICT syllabus broken into units and lessons, with exam-targeted objectives and where marks concentrate — free, no sign-up needed.",
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
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold">
          <Icon name="auto_stories" className="!text-2xl text-(--color-awaken-accent)" />
          The full syllabus, unit by unit
        </h1>
        <p className="mt-3 text-(--color-awaken-ink-soft)">
          Every official unit and lesson, with exam-targeted objectives and where marks tend to
          concentrate. Free to browse — no sign-up needed.
        </p>

        {ready.length === 0 ? (
          <p className="mt-10 text-sm text-(--color-awaken-ink-soft)">Nothing published yet — check back soon.</p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ready.map(({ subject, units }) => (
              <li key={subject.id}>
                <Link
                  href={`/syllabus/${subject.id}`}
                  className="block rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
                >
                  <p className="font-bold">{subject.name}</p>
                  <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                    {units.length} units · {units.reduce((n, u) => n + u.lessons.length, 0)} lessons
                  </p>
                  <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-(--color-awaken-accent)">
                    Explore
                    <Icon name="chevron_right" className="!text-sm" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-14 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
          <h2 className="text-lg font-bold">Want the live class?</h2>
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
