import "server-only";

import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { createMeetEvent, newEventId } from "@/lib/google/calendar";
import { GoogleNotConnected } from "@/lib/google/oauth";
import { googleStatus } from "@/lib/google/settings";

/**
 * Attaches a Google Meet link to a live class or a consultation — the one
 * routine both use, so the two cannot drift.
 *
 * ## One link per document, whoever asks
 *
 * Students open the pack page at the same moment; any of them can be the one
 * who triggers the link. A short lease in a transaction lets exactly one
 * request call Google, and the event id is chosen and saved *before* the call,
 * so a request that dies half way is finished by the next one rather than
 * duplicated (see `createMeetEvent`).
 *
 * Never throws. A missing link is shown as "the link appears before the
 * class", and the owner can always paste one by hand; a page that 500s because
 * Google was slow is worse than either.
 */

interface MeetFields {
  status?: string;
  meetUrl?: string;
  manualUrl?: string;
  calendarEventId?: string;
  creatingAt?: number;
  meetError?: string;
  updatedAt?: number;
}

/** How long one request may hold the lease before another may try. */
const LEASE_MS = 60 * 1000;

/**
 * After a failure, students' page views leave Google alone for this long.
 * Without it, a broken connection would mean every buyer opening the pack
 * calls Google and fails again. The console's retry buttons pass `force`.
 */
const RETRY_AFTER_MS = 5 * 60 * 1000;

export type MeetOutcome = "ready" | "pending" | "busy" | "not_connected" | "failed" | "skipped";

export async function attachMeet(
  ref: DocumentReference,
  event: { summary: string; description: string; startsAt: number; durationMinutes: number },
  options: { skipStatuses: string[]; force?: boolean },
): Promise<MeetOutcome> {
  const google = await googleStatus();
  if (!google.connected) return "not_connected";

  const claimed = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const doc = snap.data() as MeetFields;
    if (doc.meetUrl || doc.manualUrl) return null;
    if (doc.status && options.skipStatuses.includes(doc.status)) return null;
    const now = Date.now();
    if (doc.creatingAt && now - doc.creatingAt < LEASE_MS) return "busy" as const;
    if (!options.force && doc.meetError && doc.updatedAt && now - doc.updatedAt < RETRY_AFTER_MS) {
      return "busy" as const;
    }
    const eventId = doc.calendarEventId || newEventId();
    tx.update(ref, { creatingAt: now, calendarEventId: eventId, updatedAt: now });
    return eventId;
  });

  if (claimed === null) return "skipped";
  if (claimed === "busy") return "busy";

  try {
    const created = await createMeetEvent({ eventId: claimed, ...event });
    if (!created.meetUrl) {
      // Google is still provisioning the conference. Release the lease; the
      // next view retries with the same event id and reads the finished link.
      await ref.update({ creatingAt: FieldValue.delete(), updatedAt: Date.now() });
      return "pending";
    }
    await ref.update({
      meetUrl: created.meetUrl,
      creatingAt: FieldValue.delete(),
      meetError: FieldValue.delete(),
      updatedAt: Date.now(),
    });
    return "ready";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Meet could not be created";
    console.error("[exam-pack] meet creation failed", err);
    await ref
      .update({
        creatingAt: FieldValue.delete(),
        meetError: message.slice(0, 300),
        updatedAt: Date.now(),
      })
      .catch(() => undefined);
    return err instanceof GoogleNotConnected ? "not_connected" : "failed";
  }
}

/** The link a student should be sent to: the owner's pasted one if there is one, else Google's. */
export function joinUrlOf(doc: { manualUrl?: string; meetUrl?: string }): string | null {
  return doc.manualUrl || doc.meetUrl || null;
}

/** Only Google Meet links may be pasted by hand — a pasted link is shown to paying students. */
export function isMeetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "meet.google.com" && url.pathname.length > 1;
  } catch {
    return false;
  }
}
