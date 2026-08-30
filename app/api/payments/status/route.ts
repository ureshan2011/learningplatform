import { NextResponse, type NextRequest } from "next/server";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import type { Payment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Has this payment landed yet?
 *
 * The success page PayHere returns the student to knows nothing: the unlock
 * happens on a server-to-server call that may arrive a second later or, if
 * something is misconfigured, never. Polling this turns "your class is being
 * unlocked" from a hopeful sentence into a fact the page can actually check —
 * and lets it say plainly when the wait has gone on too long, with the
 * reference to quote.
 *
 * A student may only ask about their own payment.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("order") ?? "";
  if (!orderId) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const snap = await col.payments().doc(orderId).get();
  if (!snap.exists) return NextResponse.json({ ok: true, status: "unknown" });

  const payment = snap.data() as Payment;
  if (payment.uid !== user.uid && user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "not_permitted" }, { status: 403 });
  }

  const access = payment.status === "paid" ? await hasAccess(payment.uid, payment.subjectId) : null;

  return NextResponse.json({
    ok: true,
    status: payment.status,
    receiptNo: payment.receiptNo ?? null,
    subjectId: payment.subjectId,
    unlocked: Boolean(access?.allowed),
  });
}
