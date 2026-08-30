import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { addMonths } from "@/lib/payments/entitlements";
import { notifyTeacher } from "@/lib/payments/activity";
import type { Payment, Subject } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  subjectId: z.string().min(1).max(64),
  /** Storage path written by the client under slips/{uid}/ — rules enforce ownership. */
  slipUrl: z.string().url().max(1000),
});

/**
 * Bank deposit slip submission.
 *
 * Bank transfer is still how most Sri Lankan parents pay tuition fees, and a
 * platform that only takes cards loses those students outright. The slip
 * creates a PENDING payment — access is granted only after the teacher
 * approves it, never on upload.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const subjectSnap = await col.subjects().doc(body.subjectId).get();
  if (!subjectSnap.exists) {
    return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  }
  const subject = subjectSnap.data() as Subject;

  const now = Date.now();
  const id = `slip_${user.uid.slice(0, 8)}_${now}`;
  const payment: Payment = {
    id,
    tenantId: user.tenantId,
    uid: user.uid,
    subjectId: body.subjectId,
    provider: "bank_slip",
    amountLKR: subject.priceLKR,
    status: "pending",
    periodStart: now,
    periodEnd: addMonths(now, 1),
    slipUrl: body.slipUrl,
    createdAt: now,
    updatedAt: now,
  };

  await col.payments().doc(id).set(payment);

  // The teacher has to act on this one — a slip sitting unreviewed is a
  // student who paid and is still locked out.
  await notifyTeacher({
    kind: "slip_uploaded",
    uid: user.uid,
    subjectId: body.subjectId,
    amountLKR: subject.priceLKR,
    paymentId: id,
    method: "Bank slip — needs approval",
  });

  return NextResponse.json({ ok: true, paymentId: id });
}
