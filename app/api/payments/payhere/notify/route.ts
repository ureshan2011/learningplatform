import { NextResponse, type NextRequest } from "next/server";
import { col } from "@/lib/firebase/admin";
import {
  PAYHERE_STATUS,
  formatAmount,
  verifyNotification,
  type NotifyPayload,
} from "@/lib/payments/payhere";
import { grantAccess } from "@/lib/payments/entitlements";
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
 * PayHere retries on non-2xx, so every path returns 200 once the notification
 * has been handled or judged invalid; retrying a forged notification would
 * achieve nothing.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const payload = Object.fromEntries(form.entries()) as unknown as NotifyPayload;

  if (!verifyNotification(payload)) {
    console.warn("[payhere] rejected notification with bad signature", {
      order_id: payload.order_id,
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ref = col.payments().doc(payload.order_id);
  const snap = await ref.get();
  if (!snap.exists) {
    console.warn("[payhere] notification for unknown order", payload.order_id);
    return NextResponse.json({ ok: true });
  }
  const payment = snap.data() as Payment;

  // Idempotency: PayHere can deliver the same notification more than once.
  if (payment.status === "paid" && payload.status_code === PAYHERE_STATUS.SUCCESS) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const status = mapStatus(payload.status_code);

  if (status === "paid") {
    // Guard against a tampered checkout: the amount actually captured must
    // match what we recorded when the order was created.
    if (payload.payhere_amount !== formatAmount(payment.amountLKR)) {
      console.error("[payhere] amount mismatch", {
        order_id: payload.order_id,
        expected: formatAmount(payment.amountLKR),
        received: payload.payhere_amount,
      });
      await ref.update({
        status: "failed" as PaymentStatus,
        rejectionReason: "amount_mismatch",
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
  }

  await ref.update({
    status,
    providerRef: payload.payment_id ?? null,
    updatedAt: Date.now(),
  });

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
