import "server-only";

import { col, progressId } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import type { AttendanceRecord, ClassSession, ContentItem, Enrollment, Progress, Subject } from "@/lib/types";

/**
 * Server-side reads for pages.
 *
 * These run through the Admin SDK, so security rules do not apply — every
 * function here must scope by uid or tenant itself.
 *
 * ## Why these queries look narrower than they need to be
 *
 * Firestore demands a composite index whenever a query mixes an equality (or
 * `in`) filter on one field with a range or `orderBy` on another. Building one
 * requires `firebase deploy --only firestore:indexes` from a command line — and
 * this platform is deliberately set up entirely from a browser, so that deploy
 * never happens. A query needing a missing index does not degrade: it throws
 * FAILED_PRECONDITION and 500s the page.
 *
 * So each query below filters on a single field (or a range and `orderBy` on
 * that same field, which Firestore indexes automatically), fetches a generous
 * window, and narrows it in memory.
 *
 * This is sound while the collections are small — hundreds of sessions a year,
 * tens of pending payments. Past roughly a thousand documents per collection,
 * deploy the composite indexes in `firestore.indexes.json` and push the filters
 * back into the queries.
 */

/** How many documents to pull before narrowing in memory. */
const SCAN_WINDOW = 200;

export async function listSubjects(): Promise<Subject[]> {
  const snap = await col
    .subjects()
    .where("tenantId", "==", publicEnv.tenantId)
    .where("active", "==", true)
    .get();
  return snap.docs.map((d) => d.data() as Subject);
}

export async function getSubject(subjectId: string): Promise<Subject | null> {
  const snap = await col.subjects().doc(subjectId).get();
  return snap.exists ? (snap.data() as Subject) : null;
}

export async function listEnrollments(uid: string): Promise<Enrollment[]> {
  const snap = await col.enrollments().where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as Enrollment);
}

/**
 * Upcoming sessions for a set of subjects.
 *
 * Firestore's `in` operator caps at 30 values, and a student is realistically
 * enrolled in a handful of subjects, so we slice rather than paginate. Returns
 * empty rather than querying with an empty `in`, which Firestore rejects.
 */
export async function listUpcomingSessions(
  subjectIds: string[],
  limit = 10,
): Promise<ClassSession[]> {
  if (subjectIds.length === 0) return [];

  // Look back a full class length, not a few minutes. A student who joins 40
  // minutes into a 90-minute lesson — dropped connection, came home late — must
  // still find the class they are paying for on their dashboard.
  const from = Date.now() - 3 * 60 * 60 * 1000;
  const wanted = new Set(subjectIds);

  // Range + orderBy on the same field needs no composite index.
  const snap = await col
    .sessions()
    .where("startsAt", ">=", from)
    .orderBy("startsAt", "asc")
    .limit(SCAN_WINDOW)
    .get();

  return snap.docs
    .map((d) => d.data() as ClassSession)
    .filter((s) => s.tenantId === publicEnv.tenantId && wanted.has(s.subjectId))
    .slice(0, limit);
}

export async function getSession(sessionId: string): Promise<ClassSession | null> {
  const snap = await col.sessions().doc(sessionId).get();
  return snap.exists ? (snap.data() as ClassSession) : null;
}

/**
 * Free notes and past papers, across all subjects.
 *
 * This is the top of the acquisition funnel: indexable pages that pull students
 * in from search before they have ever heard of the class. It is the cheapest
 * growth channel available and costs nothing to run.
 */
export async function listPublicContent(limit = 60): Promise<ContentItem[]> {
  const snap = await col
    .content()
    .where("isPublic", "==", true)
    .limit(SCAN_WINDOW)
    .get();

  return snap.docs
    .map((d) => d.data() as ContentItem)
    .filter((c) => c.tenantId === publicEnv.tenantId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

/** Single equality filter, so it needs no composite index — see the note above. */
export async function listAttendance(uid: string, limit = 20): Promise<AttendanceRecord[]> {
  const snap = await col.attendance().where("uid", "==", uid).limit(SCAN_WINDOW).get();
  return snap.docs
    .map((d) => d.data() as AttendanceRecord)
    .sort((a, b) => (b.joinedAt ?? 0) - (a.joinedAt ?? 0))
    .slice(0, limit);
}

export async function getProgress(uid: string, subjectId: string): Promise<Progress | null> {
  const snap = await col.progress().doc(progressId(uid, subjectId)).get();
  return snap.exists ? (snap.data() as Progress) : null;
}

export async function listContent(subjectId: string, limit = 50): Promise<ContentItem[]> {
  const snap = await col
    .content()
    .where("subjectId", "==", subjectId)
    .limit(SCAN_WINDOW)
    .get();

  return snap.docs
    .map((d) => d.data() as ContentItem)
    .filter((c) => c.tenantId === publicEnv.tenantId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
