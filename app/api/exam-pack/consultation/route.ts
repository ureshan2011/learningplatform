import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { buyerRoute, jsonBody } from "@/lib/exam-pack/guard";
import { CONSULT_NOTE_MAX } from "@/lib/exam-pack/config";
import { bookSlot, cancelOwnBooking } from "@/lib/exam-pack/consultations";
import type { User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("book"),
    slotId: z.string().min(1).max(120),
    note: z.string().max(CONSULT_NOTE_MAX).optional(),
  }),
  z.object({ action: z.literal("cancel") }),
]);

/**
 * Books or moves a pack holder's one consultation.
 *
 * Both are transactions in `lib/exam-pack/consultations.ts`; this route only
 * checks who is asking and turns the outcome into a status the screen can
 * word. Booking creates the Google Meet straight away when Google is connected.
 */
export async function POST(req: NextRequest) {
  const gate = await buyerRoute();
  if (gate.response) return gate.response;
  const { user } = gate;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  if (parsed.data.action === "cancel") {
    const outcome = await cancelOwnBooking(user.uid);
    return outcome.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: outcome.reason }, { status: 409 });
  }

  // The phone on the session is the one the account signed in with; the user
  // document's name is what the student typed, which is what the owner calls them.
  const profile = (await col.users().doc(user.uid).get()).data() as User | undefined;
  const outcome = await bookSlot({
    uid: user.uid,
    name: profile?.name || user.name,
    phone: profile?.phone || user.phone,
    slotId: parsed.data.slotId,
    note: parsed.data.note,
  });
  return outcome.ok
    ? NextResponse.json({ ok: true, startsAt: outcome.booking.startsAt })
    : NextResponse.json({ error: outcome.reason }, { status: 409 });
}
