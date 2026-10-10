import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonBody, teacherRoute } from "@/lib/exam-pack/guard";
import { EXAM_PACK } from "@/lib/exam-pack/config";
import {
  attachBookingMeet,
  createSlots,
  deleteOpenSlot,
  markBooking,
  setBookingManualLink,
  staffCancelBooking,
} from "@/lib/exam-pack/consultations";
import { isMeetUrl } from "@/lib/exam-pack/meet";
import { isWallDate, isWallTime } from "@/lib/exam-pack/time";

export const runtime = "nodejs";

const id = z.string().min(1).max(160);

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_slots"),
    date: z.string().refine(isWallDate, "YYYY-MM-DD"),
    time: z.string().refine(isWallTime, "HH:MM"),
    count: z.number().int().min(1).max(16),
  }),
  z.object({ action: z.literal("delete_slot"), slotId: id }),
  z.object({ action: z.literal("cancel_booking"), bookingId: id }),
  z.object({ action: z.literal("mark"), bookingId: id, status: z.enum(["completed", "no_show", "booked"]) }),
  z.object({ action: z.literal("link"), bookingId: id, url: z.string().max(200).nullable() }),
  z.object({ action: z.literal("retry_meet"), bookingId: id }),
]);

/** The owner's side of consultations: publish windows, withdraw them, and look after each booking. */
export async function POST(req: NextRequest) {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const body = parsed.data;

  switch (body.action) {
    case "create_slots": {
      const result = await createSlots({
        date: body.date,
        time: body.time,
        count: body.count,
        minutes: EXAM_PACK.consultMinutes,
        by: gate.user.uid,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    case "delete_slot": {
      const deleted = await deleteOpenSlot(body.slotId);
      return deleted
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "slot_booked" }, { status: 409 });
    }
    case "cancel_booking":
      await staffCancelBooking(body.bookingId);
      return NextResponse.json({ ok: true });
    case "mark":
      await markBooking(body.bookingId, body.status);
      return NextResponse.json({ ok: true });
    case "link":
      if (body.url !== null && !isMeetUrl(body.url)) {
        return NextResponse.json({ error: "not_a_meet_link" }, { status: 400 });
      }
      await setBookingManualLink(body.bookingId, body.url);
      return NextResponse.json({ ok: true });
    case "retry_meet":
      await attachBookingMeet(body.bookingId, true);
      return NextResponse.json({ ok: true });
  }
}
