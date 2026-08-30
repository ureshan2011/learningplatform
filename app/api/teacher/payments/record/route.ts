import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { addMonths, grantAccess } from "@/lib/payments/entitlements";
import { paidPatch } from "@/lib/payments/records";
import { toE164 } from "@/lib/phone";
import type { Payment, Subject, User } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** The student's phone, in any local form — this is what the teacher has to hand. */
  phone: z.string().trim().min(6).max(20),
  subjectId: z.string().min(1).max(64),
  amountLKR: z.number().int().min(0).max(1_000_000),
  months: z.number().int().min(1).max(12).default(1),
  /** When the money actually arrived, which may be days before it is entered. */
  paidAt: z.number().int().optional(),
  bankRef: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
});

/**
 * Records a payment the teacher received outside the platform — cash at class,
 * a direct transfer, a parent paying at the bank counter without uploading a
 * slip.
 *
 * It grants access exactly like an approved slip does, and lands in the same
 * ledger with the same receipt series, because a set of books with the cash
 * payments missing is not a set of books. `provider: "manual"` and
 * `recordedBy` keep it distinguishable from money the gateway can vouch for.
 *
 * Teacher-only, and the amount is entered by hand — this route trusts its
 * caller completely, which is exactly why `requireTeacher` runs first.
 */
export async function POST(req: NextRequest) {
  let teacherUid: string;
  let tenantId: string;
  try {
    const teacher = await requireTeacher();
    teacherUid = teacher.uid;
    tenantId = teacher.tenantId;
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

  const phone = toE164(body.phone);
  if (!phone) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  // One account per phone number is the identity rule the whole platform runs
  // on, so the phone is enough to find the student — and a payment recorded
  // against a student who has never signed up would grant access to nobody.
  const userSnap = await col.users().where("phone", "==", phone).limit(1).get();
  if (userSnap.empty) {
    return NextResponse.json({ error: "student_not_found" }, { status: 404 });
  }
  const student = userSnap.docs[0].data() as User;

  const subjectSnap = await col.subjects().doc(body.subjectId).get();
  if (!subjectSnap.exists) {
    return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  }
  const subject = subjectSnap.data() as Subject;

  const now = Date.now();
  const paidAt = body.paidAt && body.paidAt <= now ? body.paidAt : now;
  const id = `manual_${student.uid.slice(0, 8)}_${now.toString(36)}`;

  const payment: Payment = {
    id,
    tenantId,
    uid: student.uid,
    subjectId: subject.id,
    provider: "manual",
    amountLKR: body.amountLKR,
    status: "pending",
    periodStart: paidAt,
    periodEnd: addMonths(paidAt, body.months),
    recordedBy: teacherUid,
    createdAt: now,
    updatedAt: now,
    ...(body.bankRef ? { bankRef: body.bankRef } : {}),
    ...(body.note ? { note: body.note } : {}),
  };

  await grantAccess({
    uid: student.uid,
    subjectId: subject.id,
    tenantId,
    months: body.months,
    source: "manual",
    paymentId: id,
  });

  await col.payments().doc(id).set({ ...payment, ...(await paidPatch(payment, paidAt)) });

  return NextResponse.json({
    ok: true,
    paymentId: id,
    studentName: student.name,
    subjectName: subject.name,
  });
}
