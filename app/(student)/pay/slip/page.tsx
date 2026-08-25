import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import { SlipUploadForm } from "@/components/payments/SlipUploadForm";
import { SiteHeader } from "@/components/nav/SiteHeader";

export const dynamic = "force-dynamic";

/**
 * Bank deposit slip submission.
 *
 * Card payment is not how most Sri Lankan parents pay tuition — bank transfer
 * is. A platform that only takes cards loses those students outright, so this
 * path is first-class, not a fallback.
 */
export default async function SlipPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/pay/slip");

  const subjects = await listSubjects();

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-md px-5 py-8">
      <Link href="/dashboard" className="text-sm text-(--color-awaken-ink-soft) underline">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Send a bank slip</h1>
      <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
        Deposit the fee, photograph the slip, and upload it here. Your teacher approves it
        and your class unlocks — usually the same day.
      </p>

      <SlipUploadForm
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          price: formatLKR(s.priceLKR),
        }))}
      />
      </main>
    </>
  );
}
