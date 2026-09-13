import { requirePageUser } from "@/lib/auth/session";
import { listEnrollments, listSellableSubjects } from "@/lib/queries";
import { payableLKR } from "@/lib/payments/pricing";
import { formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { bankDetailsReady, getPaymentSettings, isBankSlipEnabled } from "@/lib/payments/records";
import { LAUNCH_NOTE, paymentsPaused } from "@/lib/payments/launch";
import { ButtonLink } from "@/components/ds";
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

  // Trial-only launch. Checked before the settings are read, and before any
  // bank account number is rendered: nobody should be able to reach a deposit
  // instruction for a fee we are not charging. The API refuses the upload too.
  //
  // Nothing links here any more, so whoever arrives has an old bookmark — quite
  // possibly the student whose trial is already spent. Offering them "start
  // free" would be a button that silently does nothing, so the trial is only
  // named when one is genuinely still theirs to take.
  if (paymentsPaused()) {
    const enrollments = await listEnrollments(user.uid);
    const trialAvailable = preferredSubject
      ? !enrollments.some((e) => e.subjectId === preferredSubject)
      : enrollments.length === 0;

    return (
      <main className="mx-auto max-w-md px-4 py-5 sm:px-6 sm:py-6">
        <PageHeader
          title={trialAvailable ? LAUNCH_NOTE.title : "Paid classes are not open yet"}
          subtitle={LAUNCH_NOTE.body}
        />
        <Card radius="card" className="mt-5 p-5">
          <p className="flex items-center gap-2 font-semibold text-ict-paper-50">
            <Icon name="info" className="!text-lg text-ict-orange-400" />
            Do not deposit anything yet
          </p>
          <p className="mt-1.5 text-sm text-ict-ink-300">
            {trialAvailable
              ? "Start the free trial instead — it opens the class immediately, and we will tell you the day paid classes begin."
              : "We are not taking bank deposits or card payments during launch. We will tell you the day paid classes open."}
          </p>
          <ButtonLink
            // Straight through `/go`, which starts the trial and lands them in
            // the class, rather than back to a page with one more button on it.
            href={
              trialAvailable && preferredSubject
                ? `/go?do=trial&subject=${encodeURIComponent(preferredSubject)}`
                : "/dashboard"
            }
            size="sm"
            arrow="right"
            className="mt-4"
          >
            {trialAvailable ? LAUNCH_NOTE.cta : "Back to my dashboard"}
          </ButtonLink>
        </Card>
      </main>
    );
  }

  const [subjects, settings] = await Promise.all([listSellableSubjects(), getPaymentSettings()]);

  const chosen =
    subjects.find((s) => s.id === preferredSubject) ?? subjects[0];
  const ready = bankDetailsReady(settings);
  const bankSlipOn = isBankSlipEnabled(settings);

  if (!bankSlipOn) {
    return (
      <main className="mx-auto max-w-md px-4 py-5 sm:px-6 sm:py-6">
        <PageHeader
          title="Pay by bank deposit"
          subtitle="Bank deposit is switched off right now — pay by card instead."
        />
        <Card radius="card" className="mt-5 p-5">
          <p className="flex items-center gap-2 font-semibold text-ict-amber-500">
            <Icon name="priority_high" className="!text-lg" />
            Bank deposit is not accepted at the moment
          </p>
          <p className="mt-1.5 text-sm text-ict-ink-300">
            Card payment is the only way to pay right now. Go back to your class and pay by card
            to unlock it instantly.
          </p>
        </Card>
      </main>
    );
  }

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
