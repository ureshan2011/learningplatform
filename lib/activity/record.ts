import "server-only";

import { col } from "@/lib/firebase/admin";
import type { ActivityDay, ActivityEvent } from "@/lib/types";

/**
 * Writing and reading a person's activity.
 *
 * ## Why this is batched, and must stay batched
 *
 * A page view is the most frequent thing that happens on this platform. One
 * Firestore write per view would put a normal browsing session at forty-odd
 * writes; a thousand students doing that spends the free daily quota before
 * lunch, which is exactly what the cost rules in docs/PLAN.md exist to
 * prevent. So the client buffers views and posts them in batches, and a batch
 * costs one write into that person's document for the day.
 *
 * If you ever find yourself writing a document per event here, the platform's
 * single largest Firestore bill is the thing you just created.
 *
 * Only the server writes these. The uid always comes from the session, never
 * from a request body, or a student could write history for somebody else.
 */

/**
 * How many events one person's day may hold.
 *
 * A Firestore document is capped at 1MiB and these events are ~80 bytes, so
 * the real limit is far higher — this is about the teacher's screen and about
 * a runaway client. Nobody reads a thousand rows, and a redirect loop should
 * cost a bounded number of writes rather than an unbounded document.
 */
const MAX_EVENTS_PER_DAY = 400;

/** How much history the console offers. Older days stay stored but are not read. */
export const ACTIVITY_DAYS = 30;

/**
 * The date part of a Colombo timestamp.
 *
 * Sri Lanka is UTC+5:30 with no daylight saving, so a fixed offset is exact
 * rather than an approximation. Doing this in UTC would file everything a
 * student did after 6:30pm under tomorrow, and a teacher comparing the log
 * against "what did they do last night" would find it in the wrong place.
 */
export function colomboDate(at: number): string {
  return new Date(at + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function dayId(uid: string, date: string): string {
  return `${uid}_${date}`;
}

/**
 * Appends events to the right day documents.
 *
 * Events in one batch can straddle midnight, so they are grouped by day rather
 * than assumed to share one. `arrayUnion` is deliberately not used: it would
 * silently drop a second visit to the same page at the same millisecond, and
 * two identical rows are a truer record than one.
 */
export async function recordActivity(
  uid: string,
  tenantId: string,
  events: ActivityEvent[],
): Promise<void> {
  if (events.length === 0) return;

  const byDate = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const date = colomboDate(event.at);
    const bucket = byDate.get(date);
    if (bucket) bucket.push(event);
    else byDate.set(date, [event]);
  }

  await Promise.all(
    [...byDate].map(async ([date, dayEvents]) => {
      const ref = col.activity().doc(dayId(uid, date));

      // Read-then-write rather than a blind append, so the cap is enforced and
      // the document cannot grow without bound. One extra read per batch — not
      // per event — which is the trade the batching already paid for.
      const snap = await ref.get();
      const existing = snap.exists ? (snap.data() as ActivityDay) : undefined;
      const current = existing?.events ?? [];

      if (current.length >= MAX_EVENTS_PER_DAY) {
        if (!existing?.truncated) await ref.update({ truncated: true });
        return;
      }

      const room = MAX_EVENTS_PER_DAY - current.length;
      const accepted = dayEvents.slice(0, room);
      const truncated = dayEvents.length > room;

      const day: ActivityDay = {
        id: ref.id,
        tenantId: tenantId as ActivityDay["tenantId"],
        uid,
        date,
        events: [...current, ...accepted],
        ...(truncated ? { truncated: true } : {}),
        updatedAt: Date.now(),
      };

      await ref.set(day, { merge: true });
    }),
  );
}

/**
 * One event, recorded straight away.
 *
 * For things that already happen on the server and are rare enough not to need
 * buffering — a download, a sign-in. A page view must never come through here.
 */
export async function recordOne(
  uid: string,
  tenantId: string,
  event: ActivityEvent,
): Promise<void> {
  await recordActivity(uid, tenantId, [event]);
}

/**
 * Never let logging break the thing it is logging.
 *
 * A download that fails because its audit row could not be written is a
 * student who paid and got nothing, which is far worse than a gap in a log the
 * teacher reads occasionally.
 */
export function recordQuietly(uid: string, tenantId: string, event: ActivityEvent): void {
  void recordOne(uid, tenantId, event).catch((err) => {
    console.error("[activity] could not record", err);
  });
}

/**
 * The last `days` days for one person, newest day first, newest event first.
 *
 * Reads by document id rather than querying, so it needs no composite index —
 * the same reasoning as lib/queries.ts. Thirty reads is more than a query
 * would cost, but it is bounded, predictable, and cannot start failing with
 * FAILED_PRECONDITION on a live console screen.
 */
export async function listActivity(uid: string, days = ACTIVITY_DAYS): Promise<ActivityDay[]> {
  const now = Date.now();
  const ids: string[] = [];
  for (let i = 0; i < days; i += 1) {
    ids.push(dayId(uid, colomboDate(now - i * 24 * 60 * 60 * 1000)));
  }

  const snaps = await col.activity().firestore.getAll(...ids.map((id) => col.activity().doc(id)));

  return snaps
    .filter((snap) => snap.exists)
    .map((snap) => snap.data() as ActivityDay)
    .map((day) => ({ ...day, events: [...day.events].sort((a, b) => b.at - a.at) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Wipes one person's activity. The admin's answer to "delete what you hold on me". */
export async function clearActivity(uid: string): Promise<number> {
  const snap = await col.activity().where("uid", "==", uid).limit(500).get();
  if (snap.empty) return 0;

  const batch = col.activity().firestore.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snap.size;
}
