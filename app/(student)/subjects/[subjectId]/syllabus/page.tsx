import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, listUnits } from "@/lib/queries";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

/**
 * Full syllabus breakdown: every official unit, in order, with period counts
 * and lesson counts. Ungated like the flat syllabusTopics list on the main
 * subject page — this is planning/orientation info, not a paid resource, so
 * hasAccess() is not checked here (see lib/payments/entitlements.ts for what
 * IS gated).
 */
export default async function SyllabusPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}/syllabus`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const units = await listUnits(subjectId);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
        <Icon name="arrow_back" className="!text-base" />
        {subject.name}
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <Icon name="auto_stories" className="text-(--color-awaken-accent)" />
        Full syllabus breakdown
      </h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        Every unit and lesson from the official syllabus, with exam-targeted objectives and
        where marks tend to concentrate. Lesson content is added unit by unit — this page tracks
        what&apos;s planned, not what&apos;s finished.
      </p>

      {units.length === 0 ? (
        <p className="mt-8 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
          No syllabus breakdown has been loaded for {subject.name} yet.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {(Array.from(new Set(units.map((u) => u.gradeYear))) as (12 | 13)[])
            .sort((a, b) => a - b)
            .map((gradeYear) => (
              <section key={gradeYear}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">
                  Grade {gradeYear}
                </h2>
                <ul className="mt-3 space-y-3">
                  {units
                    .filter((u) => u.gradeYear === gradeYear)
                    .map((unit) => (
                      <li key={unit.id}>
                        <Link
                          href={`/subjects/${subjectId}/syllabus/${unit.id}`}
                          className="flex items-start justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-(--color-awaken-accent)/40"
                        >
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-semibold">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-indigo-soft) text-xs font-bold text-(--color-awaken-indigo)">
                                {unit.competencyNumber}
                              </span>
                              {unit.title}
                            </p>
                            <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{unit.competencyStatement}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <StatusPill tone="neutral">{unit.periods} periods</StatusPill>
                            <span className="text-xs text-(--color-awaken-ink-soft)">
                              {unit.lessons.length} lesson{unit.lessons.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </main>
  );
}
