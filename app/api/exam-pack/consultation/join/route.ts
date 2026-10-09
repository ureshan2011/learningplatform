import { NextResponse } from "next/server";
import { buyerRoute } from "@/lib/exam-pack/guard";
import { JOIN_OPENS_BEFORE_MS } from "@/lib/exam-pack/config";
import {
  attachBookingMeet,
  consultJoinUrl,
  getBooking,
  isConsultJoinable,
} from "@/lib/exam-pack/consultations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The consultation's Meet link, for the student who booked it, from 15 minutes before. */
export async function POST() {
  const gate = await buyerRoute();
  if (gate.response) return gate.response;

  let booking = await getBooking(gate.user.uid);
  if (!booking || booking.status !== "booked") {
    return NextResponse.json({ error: "not_booked" }, { status: 409 });
  }
  if (!isConsultJoinable(booking)) {
    return NextResponse.json(
      { error: "not_open", opensAt: booking.startsAt - JOIN_OPENS_BEFORE_MS },
      { status: 409 },
    );
  }

  if (!consultJoinUrl(booking)) {
    // Google was down when they booked. One more try now, while they wait.
    await attachBookingMeet(booking.id);
    booking = await getBooking(gate.user.uid);
  }
  const url = booking ? consultJoinUrl(booking) : null;
  if (!url) return NextResponse.json({ error: "no_link" }, { status: 409 });
  return NextResponse.json({ url });
}
