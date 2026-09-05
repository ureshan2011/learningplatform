import "server-only";

import { cache } from "react";
import { col, mockExamAttemptId, progressId } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import type {
  AttendanceRecord,
  ClassSession,
  ContentItem,
  Enrollment,
  MockExam,
  MockExamAttempt,
  Progress,
  Subject,
  Unit,
} from "@/lib/types";

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

/**
 * The subjects this platform teaches — A/L only.
 *
 * The grade filter is applied here rather than in every page because it is a
 * product decision, not a display one: ICT Campus teaches A/L ICT (Grades 12
 * and 13) and nothing else. Earlier builds seeded an O/L subject too, so a
 * live project can still hold that document; filtering here keeps it out of
 * the landing page, the syllabus, the dashboard and the teacher console
 * without needing anyone to delete data by hand.
 *
 * To teach O/L again, drop the filter — the data model has always supported
 * both grades.
 */
export const listSubjects = cache(async (): Promise<Subject[]> => {
  const snap = await col
    .subjects()
    .where("tenantId", "==", publicEnv.tenantId)
    .where("active", "==", true)
    .get();
  return snap.docs.map((d) => d.data() as Subject).filter((s) => s.grade === "AL");
});

/** Same A/L-only rule as `listSubjects` — an O/L id 404s rather than half-loading a page. */
export async function getSubject(subjectId: string): Promise<Subject | null> {
  const snap = await col.subjects().doc(subjectId).get();
  if (!snap.exists) return null;
  const subject = snap.data() as Subject;
  return subject.grade === "AL" ? subject : null;
}

export const listEnrollments = cache(async (uid: string): Promise<Enrollment[]> => {
  const snap = await col.enrollments().where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as Enrollment);
});

/** Two equality filters — automatically indexed, same reasoning as `listSubjects`. */
export async function listMockExams(subjectId: string): Promise<MockExam[]> {
  const snap = await col
    .mockExams()
    .where("subjectId", "==", subjectId)
    .where("active", "==", true)
    .get();
  return snap.docs.map((d) => d.data() as MockExam).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMockExam(mockExamId: string): Promise<MockExam | null> {
  const snap = await col.mockExams().doc(mockExamId).get();
  return snap.exists ? (snap.data() as MockExam) : null;
}

/** Whether — and how — a student has already engaged this mock exam, for the list page's status badges. */
export async function getMockExamAttempt(uid: string, mockExamId: string): Promise<MockExamAttempt | null> {
  const snap = await col.mockExamAttempts().doc(mockExamAttemptId(uid, mockExamId)).get();
  return snap.exists ? (snap.data() as MockExamAttempt) : null;
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

/**
 * Every class for one subject that has not already finished — the timetable
 * behind the syllabus page's per-topic "join this class" buttons.
 *
 * One range query on `startsAt` (self-indexed, see the note at the top of this
 * file), narrowed in memory. It deliberately does not take a uid: the syllabus
 * page is public and cached, so this returns the schedule only. Nothing here
 * grants access — joining still goes through `hasAccess()` in the live route.
 */
export async function listSubjectSessions(
  subjectId: string,
  limit = 60,
): Promise<ClassSession[]> {
  // Same three-hour look-back as the dashboard: a class that started 40
  // minutes ago is still the one a student wants to join, not history.
  const from = Date.now() - 3 * 60 * 60 * 1000;

  const snap = await col
    .sessions()
    .where("startsAt", ">=", from)
    .orderBy("startsAt", "asc")
    .limit(SCAN_WINDOW)
    .get();

  return snap.docs
    .map((d) => d.data() as ClassSession)
    .filter(
      (s) =>
        s.tenantId === publicEnv.tenantId &&
        s.subjectId === subjectId &&
        s.state !== "cancelled",
    )
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

/**
 * Full unit + lesson breakdown for a subject's syllabus, ordered for display.
 * ~14 documents for A/L ICT — one `.get()`, no composite index needed.
 */
export async function listUnits(subjectId: string): Promise<Unit[]> {
  const snap = await col.units().where("subjectId", "==", subjectId).get();
  return snap.docs
    .map((d) => d.data() as Unit)
    .filter((u) => u.tenantId === publicEnv.tenantId)
    .sort((a, b) => a.order - b.order);
}

export async function getUnit(unitId: string): Promise<Unit | null> {
  const snap = await col.units().doc(unitId).get();
  return snap.exists ? (snap.data() as Unit) : null;
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
