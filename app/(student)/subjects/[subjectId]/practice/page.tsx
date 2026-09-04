import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { Icon } from "@/components/ui/Icon";

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
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
        <Icon name="arrow_back" className="!text-base" />
        {subject.name}
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <Icon name="quiz" className="text-(--color-awaken-accent)" />
        Practice &amp; revision
      </h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        Questions that remember what you got wrong, and bring it back until it sticks.
      </p>

      {!access.allowed ? (
        <div className="mt-8 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5 text-sm">
          <p className="font-medium text-(--color-awaken-accent)">
            {access.reason === "expired"
              ? "Your subscription has ended."
              : "You are not enrolled in this subject."}
          </p>
          <p className="mt-1 text-(--color-awaken-ink-soft)">Subscribe to unlock practice and spaced revision.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
          >
            Subscribe
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <PracticeSession subjectId={subjectId} subjectName={subject.name} />
        </div>
      )}
    </main>
  );
}
