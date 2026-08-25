import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { PracticeSession } from "@/components/practice/PracticeSession";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}/practice`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="text-sm text-white/50 underline">
        ← {subject.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Practice &amp; revision</h1>
      <p className="mt-1 text-sm text-white/55">
        Questions that remember what you got wrong, and bring it back until it sticks.
      </p>

      {!access.allowed ? (
        <div className="mt-8 rounded-xl border border-[--color-brand]/30 bg-[--color-brand]/10 p-5 text-sm">
          <p className="font-medium text-[--color-brand]">
            {access.reason === "expired"
              ? "Your subscription has ended."
              : "You are not enrolled in this subject."}
          </p>
          <p className="mt-1 text-white/70">Subscribe to unlock practice and spaced revision.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block rounded-lg bg-[--color-brand] px-4 py-2 font-semibold text-black"
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
