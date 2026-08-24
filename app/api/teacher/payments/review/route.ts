import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { grantAccess } from "@/lib/payments/entitlements";
import type { Payment } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  paymentId: z.string().min(1).max(128),
  decision: z.enum(["approve", "reject"]),
  months: z.number().int().min(1).max(12).default(1),
  reason: z.string().trim().max(300).optional(),
});

/** Teacher approves or rejects a bank deposit slip. Approval grants access. */
export async function POST(req: NextRequest) {
  let teacherUid: string;
  try {
    const teacher = await requireTeacher();
    teacherUid = teacher.uid;
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
  if (payment.status === "paid") {
    // Already approved. Re-approving would silently hand out extra months.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const now = Date.now();

  if (body.decision === "reject") {
    await ref.update({
      status: "failed",
      reviewedBy: teacherUid,
      reviewedAt: now,
      rejectionReason: body.reason ?? "Slip could not be verified",
      updatedAt: now,
    });
    return NextResponse.json({ ok: true, status: "failed" });
  }

  await grantAccess({
    uid: payment.uid,
    subjectId: payment.subjectId,
    tenantId: payment.tenantId,
    months: body.months,
    source: "bank_slip",
    paymentId: payment.id,
  });

  await ref.update({
    status: "paid",
    reviewedBy: teacherUid,
    reviewedAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, status: "paid" });
}
