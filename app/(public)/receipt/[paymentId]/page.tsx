import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { getPaymentSettings } from "@/lib/payments/records";
import { METHOD_LABEL, STATUS_LABEL } from "@/lib/payments/ledger";
import { formatDate, formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { Icon } from "@/components/ui/Icon";
import type { Payment, Subject, User } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * A printable receipt for one payment.
 *
 * Readable by the student who paid and by the teacher, nobody else — the
 * document names a person, an amount and a phone number. It prints on one
 * page: parents ask for something to keep, and "screenshot of a dashboard" is
 * not what they mean.
 *
 * The numbers come from the payment record as it stands, never recomputed
 * from today's subject price — a receipt that changes when you raise your
 * fees is not a receipt.
 */
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/receipt/${paymentId}`);

  const snap = await col.payments().doc(paymentId).get();
  if (!snap.exists) notFound();
  const payment = snap.data() as Payment;

  const isStaff = user.role === "teacher" || user.role === "admin";
  if (payment.uid !== user.uid && !isStaff) notFound();

  const [settings, subjectSnap, payerSnap] = await Promise.all([
    getPaymentSettings(),
    col.subjects().doc(payment.subjectId).get(),
    col.users().doc(payment.uid).get(),
  ]);

  const subject = subjectSnap.data() as Subject | undefined;
  const payer = payerSnap.data() as User | undefined;
  const issued = payment.paidAt ?? payment.createdAt;

  return (
    <main className="mx-auto max-w-lg px-5 py-8 print:max-w-none print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={isStaff ? "/teacher/payments" : "/account"}
          className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline"
        >
          <Icon name="arrow_back" className="!text-base" />
          Back
        </Link>
        <p className="text-xs text-(--color-awaken-ink-soft)">
          Use your browser&apos;s Print to save this as a PDF.
        </p>
      </div>

      <article className="mt-4 rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-6 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-(--color-awaken-line) pb-4">
          <div>
            <p className="text-lg font-bold">{settings.businessName || "ICT Campus"}</p>
            {settings.ownerName ? (
              <p className="text-sm text-(--color-awaken-ink-soft)">{settings.ownerName}</p>
            ) : null}
            {settings.addressLine ? (
              <p className="text-sm text-(--color-awaken-ink-soft)">{settings.addressLine}</p>
            ) : null}
            <p className="text-sm text-(--color-awaken-ink-soft)">
              {[settings.contactPhone, settings.contactEmail].filter(Boolean).join(" · ")}
            </p>
            {settings.brNumber ? (
              <p className="text-xs text-(--color-awaken-ink-soft)">BR {settings.brNumber}</p>
            ) : null}
            {settings.taxId ? (
              <p className="text-xs text-(--color-awaken-ink-soft)">TIN {settings.taxId}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold tracking-wide text-(--color-awaken-ink-soft) uppercase">
              Receipt
            </p>
            <p className="font-mono text-lg font-bold">{payment.receiptNo ?? "—"}</p>
            <p className="text-sm text-(--color-awaken-ink-soft)">{formatDate(issued)}</p>
          </div>
        </header>

        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Received from" value={payer?.name ?? "—"} />
          <Row label="Phone" value={payer ? formatLocal(payer.phone) : "—"} />
          <Row label="For" value={subject?.name ?? payment.subjectId} />
          <Row
            label="Period"
            value={`${formatDate(payment.periodStart)} — ${formatDate(payment.periodEnd)}`}
          />
          <Row label="Method" value={METHOD_LABEL[payment.provider] ?? payment.provider} />
          {payment.providerRef ? <Row label="Gateway reference" value={payment.providerRef} /> : null}
          {payment.bankRef ? <Row label="Bank reference" value={payment.bankRef} /> : null}
          <Row label="Status" value={STATUS_LABEL[payment.status] ?? payment.status} />
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-(--color-awaken-line) pt-4">
          <span className="font-semibold">Total paid</span>
          <span className="text-2xl font-bold text-(--color-awaken-accent)">
            {formatLKR(payment.amountLKR)}
          </span>
        </div>

        {payment.status === "refunded" || payment.accessRevoked ? (
          <p className="mt-4 rounded-lg bg-(--color-awaken-danger-soft) p-3 text-sm text-(--color-awaken-danger)">
            This payment was {payment.status === "refunded" ? "refunded" : "reversed"}
            {payment.refundedAt ? ` on ${formatDate(payment.refundedAt)}` : ""}.
            {payment.refundReason ? ` ${payment.refundReason}` : ""}
          </p>
        ) : null}

        <p className="mt-6 text-xs text-(--color-awaken-ink-soft)">
          Computer-generated receipt — valid without a signature. Keep it for your records.
        </p>
      </article>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-(--color-awaken-ink-soft)">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
