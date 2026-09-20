import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject, listUnits, listSubjectSessions } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { SubjectSyllabusBody } from "@/components/syllabus/SubjectSyllabusBody";
import { SubjectTabs } from "@/components/subject/SubjectTabs";
import { PageHeader } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import { getT } from "@/lib/i18n/server";
import type { ClassSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The syllabus roadmap, inside the app.
 *
 * The rail's "Syllabus" link used to go to `/syllabus/{subjectId}` — a public,
 * statically generated page in the cream world, with the marketing header on
 * top and a "Sign in" button on it. A signed-in student tapped a dark rail and
 * landed on a white page with no rail at all and no way back but the browser's
 * back button. That single link is most of what "the design is completely
 * different over there" meant.
 *
 * The public page stays exactly where it is: it is the SEO funnel, it caches
 * for everyone rather than rendering per visitor, and reading a session here
 * would cost it that. This is the same roadmap, from the same
 * `SubjectSyllabusBody`, rendered inside `AppShell` instead — which is only
 * possible because that component asks for role tokens rather than colours.
 *
 * Not gated. The syllabus is free to browse for anyone, subscribed or not; the
 * subject tabs above it carry the lock where a lock belongs.
 */
export default async function StudentSyllabusPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const user = await requirePageUser(`/subjects/${subjectId}/syllabus`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const [units, access, t] = await Promise.all([
    listUnits(subjectId),
    hasAccess(user.uid, subjectId),
    getT(),
  ]);

  // A broken timetable must not take the syllabus down with it — the syllabus
  // is the page, the classes are the invitation on top of it.
  const sessions = await listSubjectSessions(subjectId).catch((err) => {
    console.error("[syllabus] class timetable failed to load", err);
    return [] as ClassSession[];
  });

  return (
    <PageShell>
      <PageHeader eyebrow={subject.name} title={t("nav.syllabus")} />

      <div className="mt-5">
        <SubjectTabs
          subjectId={subjectId}
          locked={!access.allowed}
          labels={{
            overview: t("subject.overview"),
            practice: t("nav.practice"),
            mockExams: t("nav.mockExams"),
            predictedPaper: t("nav.predictedPaper"),
            codeLab: t("nav.codeLab"),
            syllabus: t("nav.syllabus"),
            certificate: t("nav.certificate"),
          }}
        />
      </div>

      <div className="mt-5">
        {/* A subscriber has already bought; the closing pitch is noise to them. */}
        <SubjectSyllabusBody
          subject={subject}
          units={units}
          sessions={sessions}
          unitHrefBase={`/subjects/${subjectId}/syllabus`}
          trialCta={!access.allowed}
        />
      </div>
    </PageShell>
  );
}
