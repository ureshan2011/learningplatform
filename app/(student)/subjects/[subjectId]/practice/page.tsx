import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { SubjectPageShell } from "@/components/subject/SubjectShell";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await requirePageUser(`/subjects/${subjectId}/practice`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);

  return (
    <SubjectPageShell
      subjectId={subjectId}
      subjectName={subject.name}
      title="Practice & revision"
      subtitle="Questions that remember what you got wrong, and bring it back until it sticks."
      access={access}
      lockedBody="Practice adapts to the topics you keep losing marks on and schedules them to come back before you forget."
    >
      <div className="mx-auto max-w-2xl">
        <PracticeSession subjectId={subjectId} subjectName={subject.name} />
      </div>
    </SubjectPageShell>
  );
}
