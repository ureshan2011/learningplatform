import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { revokeAccess } from "@/lib/payments/entitlements";
import type { Payment } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  paymentId: z.string().min(1).max(128),
  /** "refund" is money you sent back; "revoke" only takes the access away. */
  action: z.enum(["refund", "revoke"]),
  /** Whether a refund also ends the access it bought. Ignored for "revoke", which always does. */
  revoke: z.boolean().default(true),
  reason: z.string().trim().max(300).optional(),
});

/**
 * Marks a payment refunded, and/or takes back the access it bought.
 *
 * The money itself moves in PayHere's dashboard or at your bank — this route
 * cannot and must not push a refund to the gateway. What it does is keep the
 * books and the access rights honest about it, which is the part that
 * otherwise gets forgotten: a refunded student who still has the class is a
 * loss twice over.
 *
 * The two are separate actions because they come apart in practice. A
 * chargeback is money already gone and access still granted (revoke). A
 * goodwill refund mid-month may be money returned with access left alone
 * until the period ends (refund, no revoke).
 */
export async function POST(req: NextRequest) {
  let teacherUid: string;
  try {
    ({ uid: teacherUid } = await requireTeacher());
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const ref = col.payments().doc(body.paymentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const payment = snap.data() as Payment;
  const now = Date.now();

  const shouldRevoke = body.action === "revoke" || body.revoke;
  const revoked = shouldRevoke
    ? await revokeAccess({ uid: payment.uid, subjectId: payment.subjectId })
    : false;

  await ref.update({
    // A revoke on its own leaves a chargeback showing as a chargeback: the
    // status is what the money did, not what we did about it.
    ...(body.action === "refund"
      ? { status: "refunded", refundedAt: now, refundReason: body.reason ?? "Refunded by teacher" }
      : {}),
    ...(revoked ? { accessRevoked: true } : {}),
    reviewedBy: teacherUid,
    reviewedAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, accessRevoked: revoked });
}
