import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { addMonths } from "@/lib/payments/entitlements";
import { getPayHereConfig } from "@/lib/payments/records";
import {
  PAYHERE_STATUS,
  buildOrderId,
  formatAmount,
  signNotification,
} from "@/lib/payments/payhere";
import { processPayHereNotification } from "@/lib/payments/payhere-notify";
import { toE164 } from "@/lib/phone";
import type { Payment, Subject, User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  phone: z.string().trim().min(6).max(20),
  subjectId: z.string().min(1).max(64),
  /** Which PayHere outcome to rehearse. Default is a successful payment. */
  statusCode: z.enum(["2", "0", "-1", "-2", "-3"]).default("2"),
});

/**
 * Rehearses a PayHere notification against this platform, in sandbox mode only.
 *
 * Why this exists: the notification is the only thing that unlocks a class, and
 * it is the one part of the flow that cannot be exercised from a laptop —
 * PayHere calls it from their servers, so it needs a public URL, an approved
 * domain and an approved merchant account. Until all three line up, a teacher
 * has no way to see whether the rest of their platform works.
 *
 * This builds a notification for a real student and a real subject, signs it
 * with the real merchant secret, and feeds it through the same handler PayHere
 * hits — same signature check, same amount check, same ledger writes, same
 * unlock. It is a rehearsal of the real path, not a bypass of it.
 *
 * Two guards keep it honest: teacher-only, and refused outright when the mode
 * is live. In sandbox there is no real money for it to fake.
 */
export async function POST(req: NextRequest) {
  let tenantId: string;
  try {
    ({ tenantId } = await requireTeacher());
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const config = await getPayHereConfig();
  if (!config.configured) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }
  if (config.mode !== "sandbox") {
    // Live mode means real settlements. A button that mints paid enrollments
    // there would be a hole in the accounts, not a test tool.
    return NextResponse.json({ error: "live_mode" }, { status: 409 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const phone = toE164(body.phone);
  if (!phone) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const userSnap = await col.users().where("phone", "==", phone).limit(1).get();
  if (userSnap.empty) return NextResponse.json({ error: "student_not_found" }, { status: 404 });
  const student = userSnap.docs[0].data() as User;

  const subjectSnap = await col.subjects().doc(body.subjectId).get();
  if (!subjectSnap.exists) return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  const subject = subjectSnap.data() as Subject;

  // The same pending row a real checkout writes before redirecting.
  const now = Date.now();
  const orderId = buildOrderId(student.uid, subject.id, now);
  const payment: Payment = {
    id: orderId,
    tenantId,
    uid: student.uid,
    subjectId: subject.id,
    provider: "payhere",
    amountLKR: subject.priceLKR,
    status: "pending",
    periodStart: now,
    periodEnd: addMonths(now, 1),
    note: "Sandbox test payment",
    createdAt: now,
    updatedAt: now,
  };
  await col.payments().doc(orderId).set(payment);

  const raw: Record<string, string> = {
    merchant_id: config.merchantId,
    order_id: orderId,
    payment_id: `SANDBOX${now}`,
    payhere_amount: formatAmount(subject.priceLKR),
    payhere_currency: "LKR",
    status_code: body.statusCode,
    method: "TEST",
    custom_1: student.uid,
    custom_2: subject.id,
    md5sig: "",
  };
  raw.md5sig = signNotification(
    {
      merchant_id: raw.merchant_id,
      order_id: raw.order_id,
      payhere_amount: raw.payhere_amount,
      payhere_currency: raw.payhere_currency,
      status_code: raw.status_code,
    },
    config,
  );

  const result = await processPayHereNotification(raw);

  return NextResponse.json({
    ok: result.status === 200,
    orderId,
    studentName: student.name,
    subjectName: subject.name,
    unlocked: body.statusCode === PAYHERE_STATUS.SUCCESS && result.status === 200,
    handler: result.body,
  });
}
