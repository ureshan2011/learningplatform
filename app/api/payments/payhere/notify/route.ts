import { NextResponse, type NextRequest } from "next/server";
import { col } from "@/lib/firebase/admin";
import {
  PAYHERE_STATUS,
  formatAmount,
  verifyNotification,
  type NotifyPayload,
} from "@/lib/payments/payhere";
import { grantAccess } from "@/lib/payments/entitlements";
import { logPaymentEvent, paidPatch } from "@/lib/payments/records";
import { applyReferralBonus } from "@/lib/referrals";
import type { Payment, PaymentStatus } from "@/lib/types";

export const runtime = "nodejs";
// Payment state must never be served from a cache.
export const dynamic = "force-dynamic";

/**
 * PayHere server-to-server notification.
 *
 * This is the ONLY place an enrollment becomes active from a card payment.
 * The browser's return_url is cosmetic — a student can navigate to it directly,
 * so it must never grant anything.
 *
 * Every notification is written to `paymentEvents` before anything else
 * happens, accepted or not. When a student insists they paid, that log is the
 * only thing that can say whether PayHere ever called and what it said.
 *
 * PayHere retries on non-2xx, so every path returns 200 once the notification
 * has been handled — including ones we reject, where retrying would only
 * repeat the same refusal.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const raw = Object.fromEntries(
    [...form.entries()].map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>;
  const payload = raw as unknown as NotifyPayload;
  const orderId = payload.order_id ?? "";

  if (!verifyNotification(payload)) {
    console.warn("[payhere] rejected notification with bad signature", { order_id: orderId });
    await logPaymentEvent({ orderId, outcome: "bad_signature", raw });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ref = col.payments().doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.warn("[payhere] notification for unknown order", orderId);
    await logPaymentEvent({ orderId, outcome: "unknown_order", raw });
    return NextResponse.json({ ok: true });
  }
  const payment = snap.data() as Payment;

  // Idempotency: PayHere can deliver the same notification more than once.
  // Order ids are unique per attempt, so this only ever catches a genuine
  // repeat of one payment — never a student's second payment of the month.
  if (payment.status === "paid" && payload.status_code === PAYHERE_STATUS.SUCCESS) {
    await logPaymentEvent({ orderId, outcome: "duplicate", raw });
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const status = mapStatus(payload.status_code);

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
      return NextResponse.json({ ok: true });
    }

    await grantAccess({
      uid: payment.uid,
      subjectId: payment.subjectId,
      tenantId: payment.tenantId,
      months: 1,
      source: "payhere",
      paymentId: payment.id,
    });
    await applyReferralBonus(payment);

    await ref.update({
      ...(await paidPatch(payment)),
      providerRef: payload.payment_id ?? null,
      ...(payload.method ? { providerMethod: payload.method } : {}),
    });
    await logPaymentEvent({ orderId, outcome: "accepted", raw });
    return NextResponse.json({ ok: true });
  }

  await ref.update({
    status,
    providerRef: payload.payment_id ?? null,
    updatedAt: Date.now(),
  });
  await logPaymentEvent({ orderId, outcome: status, raw });

  return NextResponse.json({ ok: true });
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
