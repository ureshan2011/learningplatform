import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth/session";
import { savePaymentSettings } from "@/lib/payments/records";

export const runtime = "nodejs";

const text = (max: number) => z.string().trim().max(max);

const bodySchema = z.object({
  businessName: text(140),
  ownerName: text(140),
  addressLine: text(300),
  contactPhone: text(40),
  contactEmail: text(140),
  brNumber: text(60).optional(),
  taxId: text(60).optional(),
  bankName: text(120),
  bankBranch: text(120),
  accountName: text(140),
  accountNumber: text(60),
  slipInstructions: text(300).optional(),
  payhereMerchantId: text(40).optional(),
  /** Absent means "keep the saved one" — an empty box must never wipe it. */
  payhereMerchantSecret: text(200).min(1).optional(),
  payhereMode: z.enum(["sandbox", "live"]).optional(),
});

/**
 * Saves the bank account students deposit into and the identity printed on
 * receipts.
 *
 * Deliberately not environment variables: the teacher changes these from a
 * phone, and a bank account is exactly the sort of thing that changes on a
 * Monday morning with no developer around.
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

  await savePaymentSettings(body, teacherUid);
  return NextResponse.json({ ok: true });
}
