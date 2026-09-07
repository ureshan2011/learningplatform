import Link from "next/link";
import { notFound } from "next/navigation";
import { col } from "@/lib/firebase/admin";
import { requirePageUser } from "@/lib/auth/session";
import { getPaymentSettings } from "@/lib/payments/records";
import { METHOD_LABEL, STATUS_LABEL } from "@/lib/payments/ledger";
import { formatDate, formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ds-cream";
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
  const user = await requirePageUser(`/receipt/${paymentId}`);

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
    <main className="min-h-dvh bg-ict-paper-100 px-5 py-8 print:min-h-0 print:bg-white print:py-0">
      <div className="mx-auto max-w-lg print:max-w-none">
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={isStaff ? "/teacher/payments" : "/account"}
            className="inline-flex items-center gap-1 text-sm text-ict-ink-400 underline"
          >
            <Icon name="arrow_back" className="!text-base" />
            Back
          </Link>
          <p className="text-xs text-ict-ink-400">
            Use your browser&apos;s Print to save this as a PDF.
          </p>
        </div>

        <Card radius="panel" className="mt-4 p-6 print:rounded-none print:border-0 print:shadow-none print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ict-paper-300 pb-4">
            <div>
              <p className="font-display text-lg font-extrabold text-ict-ink-900">{settings.businessName || "ICT Campus"}</p>
              {settings.ownerName ? (
                <p className="text-sm text-ict-ink-400">{settings.ownerName}</p>
              ) : null}
              {settings.addressLine ? (
                <p className="text-sm text-ict-ink-400">{settings.addressLine}</p>
              ) : null}
              <p className="text-sm text-ict-ink-400">
                {[settings.contactPhone, settings.contactEmail].filter(Boolean).join(" · ")}
              </p>
              {settings.brNumber ? (
                <p className="text-xs text-ict-ink-400">BR {settings.brNumber}</p>
              ) : null}
              {settings.taxId ? (
                <p className="text-xs text-ict-ink-400">TIN {settings.taxId}</p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
                Receipt
              </p>
              <p className="font-mono text-lg font-bold text-ict-ink-900">{payment.receiptNo ?? "—"}</p>
              <p className="text-sm text-ict-ink-400">{formatDate(issued)}</p>
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

          <div className="mt-4 flex items-center justify-between border-t border-ict-paper-300 pt-4">
            <span className="font-semibold text-ict-ink-900">Total paid</span>
            <span className="font-display text-2xl font-extrabold text-ict-orange-500">
              {formatLKR(payment.amountLKR)}
            </span>
          </div>

          {payment.status === "refunded" || payment.accessRevoked ? (
            <p className="mt-4 rounded-ict-md bg-ict-red-50 p-3 text-sm text-ict-red-500">
              This payment was {payment.status === "refunded" ? "refunded" : "reversed"}
              {payment.refundedAt ? ` on ${formatDate(payment.refundedAt)}` : ""}.
              {payment.refundReason ? ` ${payment.refundReason}` : ""}
            </p>
          ) : null}

          <p className="mt-6 text-xs text-ict-ink-400">
            Computer-generated receipt — valid without a signature. Keep it for your records.
          </p>
        </Card>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ict-ink-400">{label}</dt>
      <dd className="text-right font-medium text-ict-ink-900">{value}</dd>
    </div>
  );
}
