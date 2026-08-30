import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { bankDetailsReady, getPaymentSettings } from "@/lib/payments/records";
import { BankDetailsCard } from "@/components/payments/BankDetailsCard";
import { SlipUploadForm } from "@/components/payments/SlipUploadForm";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

/**
 * Bank deposit: where to pay, then proof that you did.
 *
 * Card payment is not how most Sri Lankan parents pay tuition — bank transfer
 * is. A platform that only takes cards loses those students outright, so this
 * path is first-class, not a fallback. The account details sit above the
 * upload form because that is the order the student does it in: deposit
 * first, photograph second.
 */
export default async function SlipPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/pay/slip");

  const { subject: preferredSubject } = await searchParams;
  const [subjects, settings] = await Promise.all([listSubjects(), getPaymentSettings()]);

  const chosen =
    subjects.find((s) => s.id === preferredSubject) ?? subjects[0];
  const ready = bankDetailsReady(settings);

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline"
      >
        <Icon name="arrow_back" className="!text-base" />
        Dashboard
      </Link>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Pay by bank deposit</h1>
        <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
          Deposit the fee, photograph the slip, and upload it below. Your teacher checks it and
          your class unlocks — usually the same day.
        </p>
      </div>

      <div className="mt-6">
        {ready && chosen ? (
          <BankDetailsCard
            bankName={settings.bankName}
            bankBranch={settings.bankBranch}
            accountName={settings.accountName}
            accountNumber={settings.accountNumber}
            amount={formatLKR(chosen.priceLKR)}
            reference={formatLocal(user.phone)}
            instructions={settings.slipInstructions}
          />
        ) : (
          <div className="rounded-xl border border-(--color-awaken-warn)/40 bg-(--color-awaken-warn-soft) p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-(--color-awaken-warn)">
              <Icon name="priority_high" className="!text-lg" />
              Bank details not published yet
            </p>
            <p className="mt-1 text-(--color-awaken-ink-soft)">
              Ask your teacher for the account number. You can still upload a slip below once you
              have paid.
            </p>
          </div>
        )}
      </div>

      <SlipUploadForm
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          price: formatLKR(s.priceLKR),
        }))}
        initialSubjectId={chosen?.id}
      />
    </main>
  );
}
