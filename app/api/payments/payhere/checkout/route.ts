import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { buildCheckoutFields, buildOrderId, checkoutUrl } from "@/lib/payments/payhere";
import { addMonths } from "@/lib/payments/entitlements";
import { getPayHereConfig } from "@/lib/payments/records";
import type { Payment, Subject } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({ subjectId: z.string().min(1).max(64) });

/**
 * Starts a checkout: records a pending payment, then returns the signed field
 * set the browser POSTs to PayHere.
 *
 * The price comes from the subject document, never from the request — a client
 * that can name its own price is a client that pays Rs 1.
 */
export async function POST(req: NextRequest) {
  // Card payments not connected yet — students can still send a bank slip.
  const config = await getPayHereConfig();
  if (!config.configured) {
    return NextResponse.json(
      { error: "not_configured", feature: "payhere" },
      { status: 503 },
    );
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let subjectId: string;
  try {
    ({ subjectId } = bodySchema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const subjectSnap = await col.subjects().doc(subjectId).get();
  if (!subjectSnap.exists) {
    return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  }
  const subject = subjectSnap.data() as Subject;
  if (!subject.active) {
    return NextResponse.json({ error: "subject_inactive" }, { status: 409 });
  }

  const now = Date.now();
  // Unique per attempt: an abandoned checkout leaves a pending row rather than
  // overwriting a paid one, and a student paying twice in a month gets two
  // orders, two receipts and two months.
  const orderId = buildOrderId(user.uid, subjectId, now);

  const payment: Payment = {
    id: orderId,
    tenantId: user.tenantId,
    uid: user.uid,
    subjectId,
    provider: "payhere",
    amountLKR: subject.priceLKR,
    status: "pending",
    periodStart: now,
    periodEnd: addMonths(now, 1),
    createdAt: now,
    updatedAt: now,
  };
  await col.payments().doc(orderId).set(payment);

  const fields = buildCheckoutFields({
    config,
    orderId,
    amountLKR: subject.priceLKR,
    itemName: `${subject.name} — 1 month`,
    studentName: user.name,
    phone: user.phone,
    uid: user.uid,
    subjectId,
  });

  return NextResponse.json({ action: checkoutUrl(config.mode), fields, mode: config.mode });
}
