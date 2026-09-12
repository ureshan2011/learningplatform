import "server-only";

import { col } from "@/lib/firebase/admin";
import {
  PAYHERE_STATUS,
  formatAmount,
  safeOrderId,
  verifyNotification,
  type NotifyPayload,
} from "@/lib/payments/payhere";
import { grantForPayment, revokeAccess } from "@/lib/payments/entitlements";
import { getPayHereConfig, logPaymentEvent, paidPatch } from "@/lib/payments/records";
import { notifyTeacher } from "@/lib/payments/activity";
import { applyReferralBonus } from "@/lib/referrals";
import type { Payment, PaymentStatus } from "@/lib/types";

/**
 * What a PayHere notification does to our records — the whole decision, in one
 * function.
 *
 * Extracted from the route handler so the sandbox simulator can drive the
 * identical path with a locally signed notification. A test that exercises a
 * copy of the logic proves nothing about the real one; this way the rehearsal
 * and the performance are the same code, down to the signature check.
 */
export async function processPayHereNotification(
  raw: Record<string, string>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const payload = raw as unknown as NotifyPayload;
  const orderId = safeOrderId(payload.order_id ?? "");

  // The cheapest possible refusal, before any Firestore work at all. Anyone
  // can POST here, and an order id that is not even shaped like one we issue
  // cannot match a payment — so there is nothing to look up and nothing worth
  // recording.
  if (!orderId) return { status: 400, body: { ok: false } };

  const config = await getPayHereConfig();

  const ref = col.payments().doc(orderId);

  if (!verifyNotification(payload, config)) {
    console.warn("[payhere] rejected notification with bad signature", { order_id: orderId });
    // Recorded only when the order is one of ours. The case this evidence
    // exists for — a merchant secret that does not match, so every real
    // payment is refused — always names a real order, so the console's
    // self-test panel still shows it. An anonymous flood names nothing, and
    // used to buy itself a Firestore write per request on our bill.
    if ((await ref.get()).exists) {
      await logPaymentEvent({ orderId, outcome: "bad_signature", raw });
    }
    return { status: 400, body: { ok: false } };
  }

  const snap = await ref.get();
  if (!snap.exists) {
    console.warn("[payhere] notification for unknown order", orderId);
    await logPaymentEvent({ orderId, outcome: "unknown_order", raw });
    return { status: 200, body: { ok: true } };
  }
  const payment = snap.data() as Payment;

  const status = mapStatus(payload.status_code);

  // Idempotency: PayHere can deliver the same notification more than once.
  // Order ids are unique per attempt, so this only ever catches a genuine
  // repeat of one payment — never a student's second payment of the month.
  // Both terminal outcomes are covered: a repeated chargeback must not ring
  // the teacher's bell twice for one reversal.
  if (payment.status === status && (status === "paid" || status === "chargeback")) {
    await logPaymentEvent({ orderId, outcome: "duplicate", raw });
    return { status: 200, body: { ok: true, duplicate: true } };
  }

  if (status === "paid") {
    // Guard against a tampered checkout: the amount and currency actually
    // captured must match what we recorded when the order was created.
    const amountOk = payload.payhere_amount === formatAmount(payment.amountLKR);
    const currencyOk = payload.payhere_currency === "LKR";
    if (!amountOk || !currencyOk) {
      console.error("[payhere] amount or currency mismatch", {
        order_id: orderId,
        expected: `${formatAmount(payment.amountLKR)} LKR`,
        received: `${payload.payhere_amount} ${payload.payhere_currency}`,
      });
      await logPaymentEvent({ orderId, outcome: "amount_mismatch", raw });
      await ref.update({
        status: "failed" as PaymentStatus,
        rejectionReason: amountOk ? "currency_mismatch" : "amount_mismatch",
        updatedAt: Date.now(),
      });
      return { status: 200, body: { ok: true } };
    }

    await grantForPayment({ payment, months: 1, source: "payhere" });
    await applyReferralBonus(payment);

    const patch = await paidPatch(payment);
    await ref.update({
      ...patch,
      providerRef: payload.payment_id ?? null,
      ...(payload.method ? { providerMethod: payload.method } : {}),
    });
    await logPaymentEvent({ orderId, outcome: "accepted", raw });
    await notifyTeacher({
      kind: "payment_paid",
      uid: payment.uid,
      subjectId: payment.subjectId,
      amountLKR: payment.amountLKR,
      paymentId: payment.id,
      receiptNo: patch.receiptNo,
      method: config.mode === "sandbox" ? "Card (PayHere sandbox)" : "Card (PayHere)",
    });

    return { status: 200, body: { ok: true } };
  }

  if (status === "chargeback") {
    // The card issuer has already taken the money back. Access has to go with
    // it, and the teacher has to be told, in the same breath — a chargeback
    // that only changes a word in the ledger leaves a student sitting in a
    // class that was paid for and then unpaid, and nobody finds out until the
    // month's totals do not add up.
    //
    // Revoking here rather than leaving it to the console is deliberate: the
    // notification is the only moment we know it happened, and "the teacher
    // will see it in the ledger" is not a control.
    const revoked = await revokeAccess({ uid: payment.uid, subjectId: payment.subjectId });

    await ref.update({
      status,
      ...(revoked ? { accessRevoked: true } : {}),
      providerRef: payload.payment_id ?? null,
      updatedAt: Date.now(),
    });
    await logPaymentEvent({ orderId, outcome: status, raw });
    await notifyTeacher({
      kind: "payment_chargeback",
      uid: payment.uid,
      subjectId: payment.subjectId,
      amountLKR: payment.amountLKR,
      paymentId: payment.id,
      ...(payment.receiptNo ? { receiptNo: payment.receiptNo } : {}),
      method: revoked ? "Chargeback — access revoked" : "Chargeback",
    });

    return { status: 200, body: { ok: true } };
  }

  await ref.update({
    status,
    providerRef: payload.payment_id ?? null,
    updatedAt: Date.now(),
  });
  await logPaymentEvent({ orderId, outcome: status, raw });

  return { status: 200, body: { ok: true } };
}

function mapStatus(code: string): PaymentStatus {
  switch (code) {
    case PAYHERE_STATUS.SUCCESS:
      return "paid";
    case PAYHERE_STATUS.PENDING:
      return "pending";
    case PAYHERE_STATUS.CANCELLED:
      return "cancelled";
    case PAYHERE_STATUS.CHARGEDBACK:
      return "chargeback";
    default:
      return "failed";
  }
}
