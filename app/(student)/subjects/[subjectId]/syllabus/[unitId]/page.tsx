import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject, getUnit, listSubjectSessions } from "@/lib/queries";
import { UnitSyllabusBody } from "@/components/syllabus/UnitSyllabusBody";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/ds/PageShell";
import type { ClassSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * One unit's lessons, inside the app.
 *
 * The in-app counterpart to `/syllabus/{subjectId}/{unitId}`, which stays put
 * for search traffic. Same `UnitSyllabusBody`, rendered on near-black.
 *
 * The link back to the unit list is a breadcrumb within a section, not the
 * "back to console" link the navigation rules rule out: the rail's Syllabus
 * entry is already highlighted on this page, so it reads as "you are here"
 * rather than as a way up.
 */
export default async function StudentUnitSyllabusPage({
  params,
}: {
  params: Promise<{ subjectId: string; unitId: string }>;
}) {
  const { subjectId, unitId } = await params;
  await requirePageUser(`/subjects/${subjectId}/syllabus/${unitId}`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const unit = await getUnit(unitId);
  if (!unit || unit.subjectId !== subjectId) notFound();

  const sessions = await listSubjectSessions(subjectId).catch((err) => {
    console.error("[syllabus] class timetable failed to load", err);
    return [] as ClassSession[];
  });

  return (
    <PageShell width="reading">
      <Link
        href={`/subjects/${subjectId}/syllabus`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-ict-fg-mute transition-colors duration-[120ms] hover:text-ict-fg"
      >
        <Icon name="arrow_back" className="!text-base" />
        {subject.name} syllabus
      </Link>

      <UnitSyllabusBody subject={subject} unit={unit} sessions={sessions} />
    </PageShell>
  );
}
