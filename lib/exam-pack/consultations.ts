import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import {
  CONSULT_BOOK_LEAD_MS,
  CONSULT_CANCEL_CUTOFF_MS,
  CONSULT_NOTE_MAX,
  EXAM_PACK,
  EXAM_PACK_ID,
  JOIN_CLOSES_AFTER_MS,
  JOIN_OPENS_BEFORE_MS,
} from "@/lib/exam-pack/config";
import { attachMeet, joinUrlOf } from "@/lib/exam-pack/meet";
import { slotStarts } from "@/lib/exam-pack/time";
import { deleteEvent } from "@/lib/google/calendar";
import type { ConsultBooking, ConsultBookingStatus, ConsultSlot } from "@/lib/types";

/**
 * The 30-minute one-to-one consultation every Exam Pack buyer gets.
 *
 * The owner publishes windows from the console; a buyer picks one. Booking is
 * a transaction over two documents — the slot and the student's single
 * booking — so two students can never hold one slot, and one student can never
 * hold two. A Google Meet is attached as soon as the booking lands, on the
 * owner's own calendar, with Google's reminders.
 *
 * Callers check `hasAccess(uid, EXAM_PACK_ID)` first. As with the sittings,
 * the access check is not repeated in here (CLAUDE.md, rule 1).
 */

/** How many slots to scan before narrowing in memory — the single-filter rule in lib/queries.ts. */
const SCAN_WINDOW = 500;

export function bookingId(uid: string): string {
  return `${uid}_${EXAM_PACK_ID}`;
}

/** Deterministic, so publishing the same evening twice cannot double the slots. */
function slotId(startsAt: number): string {
  return `${EXAM_PACK_ID}_${startsAt}`;
}

async function allSlots(): Promise<ConsultSlot[]> {
  const snap = await col.consultSlots().where("subjectId", "==", EXAM_PACK_ID).limit(SCAN_WINDOW).get();
  return snap.docs.map((d) => d.data() as ConsultSlot).filter((s) => s.tenantId === publicEnv.tenantId);
}

/** Slots a student can still book: open, and far enough ahead for the owner to see the booking. */
export async function listOpenSlots(now = Date.now()): Promise<ConsultSlot[]> {
  return (await allSlots())
    .filter((s) => s.status === "open" && s.startsAt >= now + CONSULT_BOOK_LEAD_MS)
    .sort((a, b) => a.startsAt - b.startsAt)
    .slice(0, 60);
}

export async function getBooking(uid: string): Promise<ConsultBooking | null> {
  const snap = await col.consultBookings().doc(bookingId(uid)).get();
  return snap.exists ? (snap.data() as ConsultBooking) : null;
}

/** A booking still holding the student's one consultation. A cancelled one has handed it back. */
export function holdsConsultation(booking: ConsultBooking | null): boolean {
  return booking !== null && booking.status !== "cancelled";
}

export type BookOutcome =
  | { ok: true; booking: ConsultBooking }
  | { ok: false; reason: "slot_taken" | "too_soon" | "already_booked" | "slot_missing" };

export async function bookSlot(params: {
  uid: string;
  name: string;
  phone: string;
  slotId: string;
  note?: string;
}): Promise<BookOutcome> {
  const slotRef = col.consultSlots().doc(params.slotId);
  const bookingRef = col.consultBookings().doc(bookingId(params.uid));
  const note = params.note?.trim().slice(0, CONSULT_NOTE_MAX);

  const outcome = await adminDb().runTransaction(async (tx): Promise<BookOutcome> => {
    const [slotSnap, bookingSnap] = await Promise.all([tx.get(slotRef), tx.get(bookingRef)]);
    if (!slotSnap.exists) return { ok: false, reason: "slot_missing" };
    const slot = slotSnap.data() as ConsultSlot;
    if (slot.subjectId !== EXAM_PACK_ID || slot.tenantId !== publicEnv.tenantId) {
      return { ok: false, reason: "slot_missing" };
    }

    const existing = bookingSnap.exists ? (bookingSnap.data() as ConsultBooking) : null;
    if (holdsConsultation(existing)) return { ok: false, reason: "already_booked" };
    if (slot.status !== "open") return { ok: false, reason: "slot_taken" };

    const now = Date.now();
    if (slot.startsAt < now + CONSULT_BOOK_LEAD_MS) return { ok: false, reason: "too_soon" };

    const booking: ConsultBooking = {
      id: bookingRef.id,
      tenantId: publicEnv.tenantId,
      uid: params.uid,
      subjectId: EXAM_PACK_ID,
      slotId: slot.id,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      status: "booked",
      studentName: params.name,
      studentPhone: params.phone,
      ...(note ? { note } : {}),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    tx.update(slotRef, { status: "booked", bookedBy: params.uid } satisfies Partial<ConsultSlot>);
    // `set` without merge: a rebooking after a cancellation must not inherit the
    // old booking's Meet link or event id.
    tx.set(bookingRef, booking);
    return { ok: true, booking };
  });

  if (outcome.ok) await attachBookingMeet(outcome.booking.id);
  return outcome;
}

/**
 * Creates the Meet for a booking that has none yet. Safe to call on every view.
 * `force` skips the wait after a recent failure — for the console's retry button.
 */
export async function attachBookingMeet(id: string, force = false): Promise<void> {
  const ref = col.consultBookings().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  const booking = snap.data() as ConsultBooking;
  if (booking.status !== "booked") return;
  await attachMeet(
    ref,
    {
      summary: `${EXAM_PACK.consultMinutes}-min consultation — ${booking.studentName}`,
      description: [
        `One-to-one consultation for ${EXAM_PACK.name}.`,
        `Student: ${booking.studentName}, ${booking.studentPhone}`,
        booking.note ? `What they want to talk about:\n${booking.note}` : "They did not leave a note.",
        "The student opens this link from ictcampus.lk/exam-pack/consultation and joins from the waiting room — admit them when you are ready.",
      ].join("\n\n"),
      startsAt: booking.startsAt,
      durationMinutes: booking.durationMinutes,
    },
    { skipStatuses: ["cancelled", "completed", "no_show"], force },
  );
}

export type CancelOutcome = { ok: true } | { ok: false; reason: "not_booked" | "too_late" };

/**
 * A student moving their own booking. Allowed until 12 hours before, so the
 * owner is never left facing a cancellation with no time to fill the slot.
 * The slot reopens and the student keeps their consultation to book again.
 */
export async function cancelOwnBooking(uid: string, now = Date.now()): Promise<CancelOutcome> {
  const ref = col.consultBookings().doc(bookingId(uid));
  const result = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false as const, reason: "not_booked" as const };
    const booking = snap.data() as ConsultBooking;
    if (booking.status !== "booked") return { ok: false as const, reason: "not_booked" as const };
    if (booking.startsAt - now < CONSULT_CANCEL_CUTOFF_MS) return { ok: false as const, reason: "too_late" as const };
    tx.update(ref, {
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: "student",
      updatedAt: now,
    } satisfies Partial<ConsultBooking>);
    tx.update(col.consultSlots().doc(booking.slotId), { status: "open", bookedBy: FieldValue.delete() });
    return { ok: true as const, eventId: booking.calendarEventId };
  });

  if (!result.ok) return result;
  if (result.eventId) await deleteEvent(result.eventId).catch(() => undefined);
  return { ok: true };
}

/**
 * The owner cancelling a booking — they cannot make it, or a no-show is being
 * given another chance. The student gets their consultation back to book
 * again; the slot is withdrawn rather than reopened, because the owner has
 * just said they are not free then.
 */
export async function staffCancelBooking(id: string): Promise<void> {
  const ref = col.consultBookings().doc(id);
  const now = Date.now();
  const eventId = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return undefined;
    const booking = snap.data() as ConsultBooking;
    // Every read before any write — a Firestore transaction refuses the reverse.
    const slotRef = col.consultSlots().doc(booking.slotId);
    const slotSnap = await tx.get(slotRef);
    tx.update(ref, {
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: "staff",
      updatedAt: now,
    } satisfies Partial<ConsultBooking>);
    if (slotSnap.exists && booking.startsAt > now) tx.delete(slotRef);
    return booking.calendarEventId;
  });
  if (eventId) await deleteEvent(eventId).catch(() => undefined);
}

export async function markBooking(id: string, status: Extract<ConsultBookingStatus, "completed" | "no_show" | "booked">): Promise<void> {
  await col.consultBookings().doc(id).update({ status, updatedAt: Date.now() });
}

export async function setBookingManualLink(id: string, url: string | null): Promise<void> {
  await col
    .consultBookings()
    .doc(id)
    .update({ manualUrl: url ?? FieldValue.delete(), updatedAt: Date.now() });
}

/** Whether the student can open the call now: 15 minutes before until half an hour after the end. */
export function isConsultJoinable(booking: { startsAt: number; durationMinutes: number }, now = Date.now()): boolean {
  return (
    now >= booking.startsAt - JOIN_OPENS_BEFORE_MS &&
    now <= booking.startsAt + booking.durationMinutes * 60 * 1000 + JOIN_CLOSES_AFTER_MS
  );
}

export function consultJoinUrl(booking: ConsultBooking): string | null {
  return booking.status === "booked" ? joinUrlOf(booking) : null;
}

/* -------------------------------------------------------------------------- */
/* The owner's side                                                            */
/* -------------------------------------------------------------------------- */

export type CreateSlotsOutcome = { created: number; skipped: number };

/**
 * Publishes `count` back-to-back slots from a Sri Lanka date and time.
 * Slots already published, or already in the past, are skipped, not refused.
 */
export async function createSlots(params: {
  date: string;
  time: string;
  count: number;
  minutes: number;
  by: string;
}): Promise<CreateSlotsOutcome> {
  const now = Date.now();
  const starts = slotStarts(params.date, params.time, params.count, params.minutes);
  let created = 0;
  let skipped = 0;
  for (const startsAt of starts) {
    if (startsAt <= now) {
      skipped += 1;
      continue;
    }
    const slot: ConsultSlot = {
      id: slotId(startsAt),
      tenantId: publicEnv.tenantId,
      subjectId: EXAM_PACK_ID,
      startsAt,
      durationMinutes: params.minutes,
      status: "open",
      createdAt: now,
      createdBy: params.by,
    };
    try {
      await col.consultSlots().doc(slot.id).create(slot);
      created += 1;
    } catch (err) {
      if ((err as { code?: number }).code !== 6) throw err;
      skipped += 1;
    }
  }
  return { created, skipped };
}

/** Withdraws an open slot. A booked one is cancelled through its booking, so the student is not left holding nothing. */
export async function deleteOpenSlot(id: string): Promise<boolean> {
  const ref = col.consultSlots().doc(id);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return true;
    if ((snap.data() as ConsultSlot).status !== "open") return false;
    tx.delete(ref);
    return true;
  });
}

export interface ConsoleSlot extends ConsultSlot {
  booking?: ConsultBooking;
}

/** Everything the console lists: upcoming slots with their bookings, and recent bookings that need marking. */
export async function consoleConsultations(now = Date.now()): Promise<{
  upcoming: ConsoleSlot[];
  recent: ConsultBooking[];
}> {
  const [slots, bookingsSnap] = await Promise.all([
    allSlots(),
    col.consultBookings().where("subjectId", "==", EXAM_PACK_ID).limit(SCAN_WINDOW).get(),
  ]);
  const bookings = bookingsSnap.docs
    .map((d) => d.data() as ConsultBooking)
    .filter((b) => b.tenantId === publicEnv.tenantId);
  const bySlot = new Map(bookings.filter((b) => b.status !== "cancelled").map((b) => [b.slotId, b]));

  const upcoming = slots
    .filter((s) => s.startsAt + s.durationMinutes * 60 * 1000 > now - 60 * 60 * 1000)
    .sort((a, b) => a.startsAt - b.startsAt)
    .map((s) => ({ ...s, ...(bySlot.has(s.id) ? { booking: bySlot.get(s.id) } : {}) }));

  // Calls that have happened but are still "booked" — the owner marks them done or no-show.
  const recent = bookings
    .filter((b) => b.status !== "cancelled" && b.startsAt < now)
    .sort((a, b) => b.startsAt - a.startsAt)
    .slice(0, 20);

  return { upcoming, recent };
}

/** Buyers who have not booked yet — the owner's cue to publish more slots. */
export async function unbookedBuyers(buyerUids: string[]): Promise<number> {
  if (buyerUids.length === 0) return 0;
  const refs = buyerUids.map((uid) => col.consultBookings().doc(bookingId(uid)));
  const snaps = await adminDb().getAll(...refs);
  return snaps.filter((s) => !s.exists || (s.data() as ConsultBooking).status === "cancelled").length;
}
