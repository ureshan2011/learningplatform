import { requirePageUser } from "@/lib/auth/session";
import { listSellableSubjects } from "@/lib/queries";
import { payableLKR } from "@/lib/payments/pricing";
import { formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { bankDetailsReady, getPaymentSettings } from "@/lib/payments/records";
import { BankDetailsCard } from "@/components/payments/BankDetailsCard";
import { SlipUploadForm } from "@/components/payments/SlipUploadForm";
import { Icon } from "@/components/ui/Icon";
import { Card, PageHeader } from "@/components/ds";

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
  const user = await requirePageUser("/pay/slip");

  const { subject: preferredSubject } = await searchParams;
  const [subjects, settings] = await Promise.all([listSellableSubjects(), getPaymentSettings()]);

  const chosen =
    subjects.find((s) => s.id === preferredSubject) ?? subjects[0];
  const ready = bankDetailsReady(settings);

  return (
    <main className="mx-auto max-w-md px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title="Pay by bank deposit"
        subtitle="Deposit the fee, photograph the slip, and upload it below. Your teacher checks it and your class unlocks — usually the same day."
      />

      <div className="mt-5">
        {ready && chosen ? (
          <BankDetailsCard
            bankName={settings.bankName}
            bankBranch={settings.bankBranch}
            accountName={settings.accountName}
            accountNumber={settings.accountNumber}
            amount={formatLKR(payableLKR(chosen))}
            reference={formatLocal(user.phone)}
            instructions={settings.slipInstructions}
          />
        ) : (
          <Card radius="card" className="p-5">
            <p className="flex items-center gap-2 font-semibold text-ict-amber-500">
              <Icon name="priority_high" className="!text-lg" />
              Bank details not published yet
            </p>
            <p className="mt-1.5 text-sm text-ict-ink-300">
              Ask your teacher for the account number. You can still upload a slip below once you
              have paid.
            </p>
          </Card>
        )}
      </div>

      <SlipUploadForm
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          price: formatLKR(payableLKR(s)),
        }))}
        initialSubjectId={chosen?.id}
      />
    </main>
  );
}
