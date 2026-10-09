import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { EXAM_PACK, EXAM_PACK_ID, JOIN_CLOSES_AFTER_MS, JOIN_OPENS_BEFORE_MS } from "@/lib/exam-pack/config";
import { attachMeet, joinUrlOf } from "@/lib/exam-pack/meet";
import { colomboToUtc, nextOccurrences, type Occurrence } from "@/lib/exam-pack/time";
import { deleteEvent } from "@/lib/google/calendar";
import type { ExamPackLive, ExamPackLiveJoin, ExamPackSettings } from "@/lib/types";

/**
 * The weekly "Saturday live with Dr. Yasas from New Zealand".
 *
 * ## Created on demand, not by a scheduler
 *
 * App Hosting has no cron, and Cloud Scheduler is a setup step this platform's
 * owner may never take. So each week's live is created the first time anyone
 * — a buyer opening the pack, the owner opening the console — looks at the
 * schedule, for the next two weeks ahead. With the pack on sale and at least
 * one student, that is long before Saturday. The Meet link is attached in the
 * same pass when Google is connected.
 *
 * ## Links stay server-side
 *
 * `examPackLives` is closed to clients (firestore.rules' catch-all). A student
 * gets the link from `/api/exam-pack/live/join`, after `hasAccess`, and only
 * inside the join window — so a link forwarded into a WhatsApp group is
 * useless a week later, because next Saturday has a new one.
 */

/** How many weeks ahead are kept ready. Two, so next week's link exists before this week's class ends. */
const WEEKS_AHEAD = 2;

export function liveId(date: string): string {
  return `${EXAM_PACK_ID}_${date}`;
}

/** What the schedule shows: a stored live, or a planned one that has not been created yet. */
export type LiveView = Pick<ExamPackLive, "id" | "date" | "startsAt" | "durationMinutes" | "title"> & {
  status: ExamPackLive["status"] | "planned";
  hasLink: boolean;
  meetError?: string;
};

function toView(occurrence: Occurrence, stored: ExamPackLive | undefined, title: string, minutes: number): LiveView {
  if (stored) {
    return {
      id: stored.id,
      date: stored.date,
      startsAt: stored.startsAt,
      durationMinutes: stored.durationMinutes,
      title: stored.title,
      status: stored.status,
      hasLink: Boolean(joinUrlOf(stored)),
      ...(stored.meetError ? { meetError: stored.meetError } : {}),
    };
  }
  return {
    id: liveId(occurrence.date),
    date: occurrence.date,
    startsAt: occurrence.startsAt,
    durationMinutes: minutes,
    title,
    status: "planned",
    hasLink: false,
  };
}

async function readLives(ids: string[]): Promise<Map<string, ExamPackLive>> {
  if (ids.length === 0) return new Map();
  const snaps = await adminDb().getAll(...ids.map((id) => col.examPackLives().doc(id)));
  const out = new Map<string, ExamPackLive>();
  for (const snap of snaps) if (snap.exists) out.set(snap.id, snap.data() as ExamPackLive);
  return out;
}

/** The coming weeks' lives, read only — what a page shows without creating anything. */
export async function upcomingLives(settings: ExamPackSettings, now = Date.now()): Promise<LiveView[]> {
  if (!settings.live.enabled) return [];
  const occurrences = nextOccurrences(settings.live, now, WEEKS_AHEAD);
  const stored = await readLives(occurrences.map((o) => liveId(o.date)));
  return occurrences.map((o) =>
    toView(o, stored.get(liveId(o.date)), settings.live.title, settings.live.durationMinutes),
  );
}

/**
 * Makes sure the next two weeks' lives exist and have Meet links.
 *
 * Safe to call from every page view: creation uses `create()` on a
 * deterministic id, so concurrent callers make one document, and the Meet is
 * attached under a lease (`attachMeet`). Never throws — a schedule that cannot
 * be prepared right now is prepared on the next view.
 */
export async function ensureUpcomingLives(settings: ExamPackSettings, now = Date.now()): Promise<LiveView[]> {
  if (!settings.live.enabled) return [];
  try {
    const occurrences = nextOccurrences(settings.live, now, WEEKS_AHEAD);
    // Read first: on almost every view both weeks already exist with a link,
    // and then this costs two reads and nothing else — no write, no Google call.
    const stored = await readLives(occurrences.map((o) => liveId(o.date)));
    await Promise.all(
      occurrences.map(async (o) => {
        const ref = col.examPackLives().doc(liveId(o.date));
        const existing = stored.get(ref.id);
        if (existing) {
          if (existing.status === "scheduled" && !joinUrlOf(existing)) await attachLiveMeet(ref.id);
          return;
        }
        const live: ExamPackLive = {
          id: ref.id,
          tenantId: publicEnv.tenantId,
          subjectId: EXAM_PACK_ID,
          date: o.date,
          startsAt: o.startsAt,
          durationMinutes: settings.live.durationMinutes,
          title: settings.live.title,
          status: "scheduled",
          createdAt: now,
          updatedAt: now,
        };
        try {
          await ref.create(live);
        } catch (err) {
          // ALREADY_EXISTS: another view created it a moment ago. Fine.
          if ((err as { code?: number }).code !== 6) throw err;
        }
        await attachLiveMeet(ref.id);
      }),
    );
  } catch (err) {
    console.error("[exam-pack] could not prepare the weekly lives", err);
  }
  return upcomingLives(settings, now);
}

async function attachLiveMeet(id: string): Promise<void> {
  const ref = col.examPackLives().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  const live = snap.data() as ExamPackLive;
  await attachMeet(
    ref,
    {
      summary: `${live.title} — ${EXAM_PACK.shortName}`,
      description: [
        `The weekly live class for ${EXAM_PACK.name} students.`,
        "Students open the link from ictcampus.lk/exam-pack — it is shown only to pack holders, from 15 minutes before the start.",
        "They join from the waiting room: use Admit all in Meet when the class begins.",
      ].join("\n\n"),
      startsAt: live.startsAt,
      durationMinutes: live.durationMinutes,
    },
    { skipStatuses: ["cancelled"] },
  );
}

/** Whether a live is inside its join window. */
export function isJoinable(live: { startsAt: number; durationMinutes: number }, now = Date.now()): boolean {
  return (
    now >= live.startsAt - JOIN_OPENS_BEFORE_MS &&
    now <= live.startsAt + live.durationMinutes * 60 * 1000 + JOIN_CLOSES_AFTER_MS
  );
}

export type JoinOutcome =
  | { ok: true; url: string; liveId: string }
  | { ok: false; reason: "no_live" | "not_open" | "cancelled" | "no_link"; opensAt?: number };

/**
 * The link for the live that is on now, for a student who has already passed
 * `hasAccess`. Records that they opened it — the owner's attendance list.
 */
export async function joinLive(params: {
  settings: ExamPackSettings;
  uid: string;
  name: string;
  now?: number;
}): Promise<JoinOutcome> {
  const now = params.now ?? Date.now();
  const [next] = await ensureUpcomingLives(params.settings, now);
  if (!next) return { ok: false, reason: "no_live" };
  if (next.status === "cancelled") return { ok: false, reason: "cancelled" };
  if (!isJoinable(next, now)) return { ok: false, reason: "not_open", opensAt: next.startsAt - JOIN_OPENS_BEFORE_MS };

  const snap = await col.examPackLives().doc(next.id).get();
  const live = snap.data() as ExamPackLive | undefined;
  const url = live ? joinUrlOf(live) : null;
  if (!live || !url) return { ok: false, reason: "no_link" };

  const join: ExamPackLiveJoin = {
    id: `${live.id}_${params.uid}`,
    tenantId: publicEnv.tenantId,
    liveId: live.id,
    uid: params.uid,
    name: params.name,
    at: now,
  };
  // Best effort: a failed attendance write must never stop a student joining.
  await col
    .examPackLiveJoins()
    .doc(join.id)
    .set(join)
    .catch((err) => console.error("[exam-pack] could not record a live join", err));

  return { ok: true, url, liveId: live.id };
}

/** Staff view of one live, with the host link and attendance. */
export interface LiveHostView extends LiveView {
  joinUrl: string | null;
  manualUrl?: string;
  joins: number;
}

export async function hostLives(settings: ExamPackSettings, now = Date.now()): Promise<LiveHostView[]> {
  const views = await upcomingLives(settings, now);
  const stored = await readLives(views.map((v) => v.id));
  return Promise.all(
    views.map(async (v) => {
      const live = stored.get(v.id);
      return {
        ...v,
        joinUrl: live ? joinUrlOf(live) : null,
        ...(live?.manualUrl ? { manualUrl: live.manualUrl } : {}),
        joins: live ? await joinCount(live.id) : 0,
      };
    }),
  );
}

/** Recent lives that have happened, newest first, with how many students opened each. */
export async function pastLives(limit = 6): Promise<Array<ExamPackLive & { joins: number }>> {
  const snap = await col.examPackLives().where("subjectId", "==", EXAM_PACK_ID).limit(200).get();
  const now = Date.now();
  const past = snap.docs
    .map((d) => d.data() as ExamPackLive)
    .filter((l) => l.tenantId === publicEnv.tenantId && l.startsAt + l.durationMinutes * 60 * 1000 < now)
    .sort((a, b) => b.startsAt - a.startsAt)
    .slice(0, limit);
  return Promise.all(past.map(async (l) => ({ ...l, joins: await joinCount(l.id) })));
}

async function joinCount(id: string): Promise<number> {
  const snap = await col.examPackLiveJoins().where("liveId", "==", id).count().get();
  return snap.data().count;
}

/** Cancels one week. The Meet event is removed from the owner's calendar; students see "No live this week". */
export async function cancelLive(id: string, settings: ExamPackSettings): Promise<void> {
  const ref = col.examPackLives().doc(id);
  const snap = await ref.get();
  const now = Date.now();
  if (!snap.exists) {
    // A planned week the owner cancels before anyone viewed it: written whole,
    // and cancelled, so the on-demand creation does not bring it back.
    const date = id.slice(EXAM_PACK_ID.length + 1);
    const live: ExamPackLive = {
      id,
      tenantId: publicEnv.tenantId,
      subjectId: EXAM_PACK_ID,
      date,
      startsAt: colomboToUtc(date, settings.live.time),
      durationMinutes: settings.live.durationMinutes,
      title: settings.live.title,
      status: "cancelled",
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(live);
    return;
  }
  const live = snap.data() as ExamPackLive;
  await ref.update({ status: "cancelled", updatedAt: now });
  if (live.calendarEventId) await deleteEvent(live.calendarEventId).catch(() => undefined);
}

/**
 * Clears out upcoming weeks that no longer match the schedule after the owner
 * changes the day, time, length or title — their Meet events come off the
 * owner's calendar, and the next view creates the weeks again at the new time.
 * Cancelled weeks are left alone: a cancellation is a decision, not a timing.
 */
export async function rescheduleLives(settings: ExamPackSettings, now = Date.now()): Promise<number> {
  const wanted = new Map(
    (settings.live.enabled ? nextOccurrences(settings.live, now, WEEKS_AHEAD) : []).map((o) => [liveId(o.date), o]),
  );
  const snap = await col.examPackLives().where("subjectId", "==", EXAM_PACK_ID).limit(200).get();
  let cleared = 0;
  for (const doc of snap.docs) {
    const live = doc.data() as ExamPackLive;
    if (live.tenantId !== publicEnv.tenantId || live.status === "cancelled") continue;
    if (live.startsAt + live.durationMinutes * 60 * 1000 <= now) continue;
    const match = wanted.get(live.id);
    const unchanged =
      match &&
      match.startsAt === live.startsAt &&
      live.durationMinutes === settings.live.durationMinutes &&
      live.title === settings.live.title;
    if (unchanged) continue;
    if (live.calendarEventId) await deleteEvent(live.calendarEventId).catch(() => undefined);
    await doc.ref.delete();
    cleared += 1;
  }
  return cleared;
}

/** Puts a cancelled week back. A fresh Meet is created on the next view. */
export async function restoreLive(id: string): Promise<void> {
  await col
    .examPackLives()
    .doc(id)
    .update({
      status: "scheduled",
      meetUrl: FieldValue.delete(),
      calendarEventId: FieldValue.delete(),
      meetError: FieldValue.delete(),
      updatedAt: Date.now(),
    });
}

export async function setLiveManualLink(id: string, url: string | null): Promise<void> {
  await col
    .examPackLives()
    .doc(id)
    .update({ manualUrl: url ?? FieldValue.delete(), updatedAt: Date.now() });
}

/** Drops the stored Meet so the next view creates a new one — for a link the owner has lost or regenerated. */
export async function resetLiveMeet(id: string): Promise<void> {
  const ref = col.examPackLives().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  const live = snap.data() as ExamPackLive;
  if (live.calendarEventId) await deleteEvent(live.calendarEventId).catch(() => undefined);
  await ref.update({
    meetUrl: FieldValue.delete(),
    calendarEventId: FieldValue.delete(),
    meetError: FieldValue.delete(),
    creatingAt: FieldValue.delete(),
    updatedAt: Date.now(),
  });
  await attachLiveMeet(id);
}
