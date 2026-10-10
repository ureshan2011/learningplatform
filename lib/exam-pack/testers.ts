import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, col, enrollmentId } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { DAY_MS, grantProductAccess, revokeAccess } from "@/lib/payments/entitlements";
import { toE164 } from "@/lib/phone";
import { EXAM_PACK_ID, PAPER_IDS } from "@/lib/exam-pack/config";
import { bookingId } from "@/lib/exam-pack/consultations";
import { sittingId } from "@/lib/exam-pack/sittings";
import { deleteEvent } from "@/lib/google/calendar";
import type { ConsultBooking, Enrollment, User } from "@/lib/types";

/**
 * Test accounts for the Exam Pack — how the owner uses the pack as a real
 * student would, before anyone can buy it.
 *
 * The owner signs in on a second phone number (a second SIM, a family
 * member's), and gives that number test access from the console. The account
 * is then an ordinary student with the pack: it sees exactly what a buyer
 * sees, sits papers, books a consultation, joins the live. Three things set it
 * apart, all keyed on the enrollment's `source: "test"`:
 *
 * - no payment, and access for 30 days only;
 * - its sittings are never ranked against real students (`isRehearsal`);
 * - it is left out of the console's sales figures.
 *
 * It goes through `grantProductAccess` like a purchase does — the access
 * check stays `hasAccess()` and nothing else.
 */

export const TEST_ACCESS_DAYS = 30;

export type GrantOutcome =
  | { ok: true; name: string; until: number }
  | { ok: false; reason: "invalid_phone" | "not_found" | "is_staff" | "already_buyer" };

export async function grantTestAccess(rawPhone: string): Promise<GrantOutcome> {
  const phone = toE164(rawPhone);
  if (!phone) return { ok: false, reason: "invalid_phone" };

  const snap = await col.users().where("phone", "==", phone).limit(1).get();
  if (snap.empty) return { ok: false, reason: "not_found" };
  const user = snap.docs[0].data() as User;
  // A teacher already sees everything; giving them an enrollment would only
  // make the console look as if they had bought it.
  if (user.role === "teacher" || user.role === "admin") return { ok: false, reason: "is_staff" };

  // Never overwrite a real purchase with a 30-day test period.
  const existingSnap = await col.enrollments().doc(enrollmentId(user.uid, EXAM_PACK_ID)).get();
  const existing = existingSnap.exists ? (existingSnap.data() as Enrollment) : undefined;
  if (existing && existing.source !== "test" && existing.currentPeriodEnd > Date.now()) {
    return { ok: false, reason: "already_buyer" };
  }

  const until = Date.now() + TEST_ACCESS_DAYS * DAY_MS;
  await grantProductAccess({
    uid: user.uid,
    subjectId: EXAM_PACK_ID,
    tenantId: publicEnv.tenantId,
    endsAt: until,
    source: "test",
  });
  return { ok: true, name: user.name, until };
}

export interface Tester {
  uid: string;
  name: string;
  phone: string;
  until: number;
  active: boolean;
}

export async function listTesters(now = Date.now()): Promise<Tester[]> {
  const snap = await col.enrollments().where("subjectId", "==", EXAM_PACK_ID).limit(2000).get();
  const tests = snap.docs
    .map((d) => d.data() as Enrollment)
    .filter((e) => e.tenantId === publicEnv.tenantId && e.source === "test");
  if (tests.length === 0) return [];
  const users = await adminDb().getAll(...tests.map((e) => col.users().doc(e.uid)));
  return tests
    .map((e, i) => {
      const user = users[i].data() as User | undefined;
      return {
        uid: e.uid,
        name: user?.name ?? "Unknown",
        phone: user?.phone ?? "",
        until: e.currentPeriodEnd,
        active: e.status === "active" && e.currentPeriodEnd > now,
      };
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || b.until - a.until);
}

/** Whether a uid is one of the owner's test accounts — the only accounts this module may reset or remove. */
export async function isTester(uid: string): Promise<boolean> {
  const snap = await col.enrollments().doc(enrollmentId(uid, EXAM_PACK_ID)).get();
  return snap.exists && (snap.data() as Enrollment).source === "test";
}

/**
 * Clears a test account's papers and consultation so the owner can go through
 * them again from the start. The booked slot is reopened and its Meet event
 * removed from the calendar. Never called on a real buyer — a real student's
 * ranked sitting is not something to throw away.
 */
export async function resetTestData(uid: string): Promise<void> {
  await Promise.all(PAPER_IDS.map((id) => col.paperSittings().doc(sittingId(uid, id)).delete()));

  const ref = col.consultBookings().doc(bookingId(uid));
  const snap = await ref.get();
  if (!snap.exists) return;
  const booking = snap.data() as ConsultBooking;
  if (booking.calendarEventId) await deleteEvent(booking.calendarEventId).catch(() => undefined);
  if (booking.status === "booked" && booking.startsAt > Date.now()) {
    await col
      .consultSlots()
      .doc(booking.slotId)
      .update({ status: "open", bookedBy: FieldValue.delete() })
      .catch(() => undefined);
  }
  await ref.delete();
}

/** Ends a test account's access now. The enrollment stays, as every ended enrollment does. */
export async function removeTestAccess(uid: string): Promise<void> {
  await revokeAccess({ uid, subjectId: EXAM_PACK_ID });
}
