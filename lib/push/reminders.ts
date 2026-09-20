import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { formatSessionTimeShort } from "@/lib/format";
import { sendPush, type PushRecipient } from "@/lib/push/send";
import type { ClassSession, Enrollment, User } from "@/lib/types";

/**
 * "Your class starts in 15 minutes."
 *
 * The platform had no reminder of any kind. SMS is out — every verification is
 * already an invoice line (see CLAUDE.md, Sessions), and a reminder per class
 * per student would dwarf the sign-in bill. Web push costs nothing per message
 * and the audience is Android Chrome, which supports it.
 *
 * ## Exactly once
 *
 * `remindedAt` is written to the session document before anything is sent, in
 * a transaction. A scheduler that fires twice inside the window, or retries
 * after a timeout, is the normal case rather than the exceptional one, and the
 * failure it causes — a thousand students notified twice — is the kind people
 * turn notifications off over. Claiming first means a crash mid-send costs one
 * missed reminder instead.
 */

/** How far ahead to look. Matches the window the join button opens in. */
export const REMINDER_LEAD_MS = 15 * 60 * 1000;

/** Never remind about a class that has already started. */
const REMINDER_FLOOR_MS = 60 * 1000;

export interface ReminderRun {
  considered: number;
  reminded: number;
  sent: number;
  failed: number;
}

export async function sendClassReminders(now = Date.now()): Promise<ReminderRun> {
  const snap = await col
    .sessions()
    .where("startsAt", ">=", now + REMINDER_FLOOR_MS)
    .orderBy("startsAt", "asc")
    .limit(50)
    .get();

  const due = snap.docs
    .map((d) => d.data() as ClassSession)
    .filter(
      (s) =>
        s.tenantId === publicEnv.tenantId &&
        s.state === "scheduled" &&
        !s.remindedAt &&
        s.startsAt <= now + REMINDER_LEAD_MS,
    );

  const run: ReminderRun = { considered: due.length, reminded: 0, sent: 0, failed: 0 };

  for (const session of due) {
    const claimed = await claim(session.id, now);
    if (!claimed) continue;

    const recipients = await recipientsFor(session, now);
    const { sent, failed } = await sendPush(recipients, {
      title: session.title,
      body: `Starts ${formatSessionTimeShort(session.startsAt)} — tap to join.`,
      path: `/live/${session.id}`,
      // One tag per class, so a student with two devices does not get a pile
      // of identical rows in their shade.
      tag: `class-${session.id}`,
    });

    run.reminded += 1;
    run.sent += sent;
    run.failed += failed;
  }

  return run;
}

/**
 * Marks the session as reminded, and reports whether this caller is the one
 * that got there first. Everything after this is best-effort.
 */
async function claim(sessionId: string, now: number): Promise<boolean> {
  const ref = col.sessions().doc(sessionId);
  try {
    return await ref.firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      if ((snap.data() as ClassSession).remindedAt) return false;
      tx.update(ref, { remindedAt: now });
      return true;
    });
  } catch (err) {
    console.error("[reminders] could not claim session", sessionId, err);
    return false;
  }
}

/**
 * Students with live access to this subject who have allowed notifications.
 *
 * One equality query on `subjectId`, narrowed in memory — the same index-free
 * pattern as the rest of `lib/queries.ts`. Access is decided here from the
 * enrollment's own period end rather than by calling `hasAccess()` per
 * student: this runs for everyone at once and `hasAccess` is a per-student
 * document read, which is the difference between one query and a thousand.
 * Nothing is granted by a notification, so this is a filter, not a gate — the
 * `/live` route still checks properly when the student taps it.
 */
async function recipientsFor(session: ClassSession, now: number): Promise<PushRecipient[]> {
  const snap = await col.enrollments().where("subjectId", "==", session.subjectId).get();

  const uids = snap.docs
    .map((d) => d.data() as Enrollment)
    .filter(
      (e) =>
        e.tenantId === session.tenantId && e.status === "active" && e.currentPeriodEnd > now,
    )
    .map((e) => e.uid);

  if (uids.length === 0) return [];

  // `getAll` is one round trip for the whole class rather than one per student.
  const refs = uids.map((uid) => col.users().doc(uid));
  const users = await col.users().firestore.getAll(...refs);

  return users
    .filter((doc) => doc.exists)
    .map((doc) => {
      const user = doc.data() as User;
      return { uid: doc.id, tokens: user.pushTokens ?? [] };
    })
    .filter((r) => r.tokens.length > 0);
}
