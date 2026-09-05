import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { CodeLab } from "@/components/lab/CodeLab";
import { SubjectPageShell } from "@/components/subject/SubjectShell";

export const dynamic = "force-dynamic";

export default async function LabPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await requirePageUser(`/subjects/${subjectId}/lab`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);

  return (
    <SubjectPageShell
      subjectId={subjectId}
      subjectName={subject.name}
      title="Code Lab"
      subtitle="Actually run pseudocode, spreadsheet formulas and SQL — not just read about them."
      access={access}
      lockedBody="The Code Lab runs the pseudocode, spreadsheet formulas and SQL the paper asks you to trace, so you can check an answer instead of guessing."
    >
      <div className="mx-auto max-w-3xl">
        <CodeLab />
      </div>
    </SubjectPageShell>
  );
}
