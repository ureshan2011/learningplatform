import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { CodeLab } from "@/components/lab/CodeLab";
import { SiteHeader } from "@/components/nav/SiteHeader";

export const dynamic = "force-dynamic";

export default async function LabPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}/lab`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="text-sm text-(--color-awaken-ink-soft) underline">
        ← {subject.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Code Lab</h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
        Actually run pseudocode, spreadsheet formulas and SQL — not just read about them.
      </p>

      {!access.allowed ? (
        <div className="mt-8 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5 text-sm">
          <p className="font-medium text-(--color-awaken-accent)">
            {access.reason === "expired"
              ? "Your subscription has ended."
              : "You are not enrolled in this subject."}
          </p>
          <p className="mt-1 text-(--color-awaken-ink-soft)">Subscribe to unlock the Code Lab.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
          >
            Subscribe
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <CodeLab />
        </div>
      )}
      </main>
    </>
  );
}
