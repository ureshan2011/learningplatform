import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import type { ClassSession, ContentItem, Enrollment, Subject } from "@/lib/types";

/**
 * Server-side reads for pages.
 *
 * These run through the Admin SDK, so security rules do not apply — every
 * function here must scope by uid or tenant itself.
 */

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

  // Include sessions that started recently — a student arriving ten minutes
  // late must still find the class they are paying for.
  const from = Date.now() - 30 * 60 * 1000;

  const snap = await col
    .sessions()
    .where("tenantId", "==", publicEnv.tenantId)
    .where("subjectId", "in", subjectIds.slice(0, 30))
    .where("startsAt", ">=", from)
    .orderBy("startsAt", "asc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as ClassSession);
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
    .where("tenantId", "==", publicEnv.tenantId)
    .where("isPublic", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as ContentItem);
}

export async function listContent(subjectId: string, limit = 50): Promise<ContentItem[]> {
  const snap = await col
    .content()
    .where("tenantId", "==", publicEnv.tenantId)
    .where("subjectId", "==", subjectId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as ContentItem);
}
