import "server-only";

import { adminDb, col, progressId } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { colomboDateString } from "@/lib/format";
import type {
  AttendanceRecord,
  ClassSession,
  Enrollment,
  Payment,
  Progress,
  QuestionAttempt,
  Subject,
  User,
} from "@/lib/types";

/**
 * How many documents to scan before narrowing in memory — same reasoning as
 * `SCAN_WINDOW` in lib/queries.ts (a composite index needs a CLI deploy this
 * browser-only setup never does, so every query here stays a single filter
 * plus an in-memory narrow). Set higher than that file's per-student queries
 * because these read across the whole cohort at once. Fine into the low
 * thousands of students; past that, this is where composite indexes and a
 * scheduled aggregation job earn their cost.
 */
const COHORT_SCAN_WINDOW = 3000;

const DAY_MS = 24 * 60 * 60 * 1000;

function monthKey(ms: number): string {
  return colomboDateString(ms).slice(0, 7); // "YYYY-MM"
}

function daysBetweenDateStrings(earlier: string, later: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / DAY_MS);
}

export interface BusinessOverview {
  activeStudents: number;
  mrrLKR: number;
  newStudentsThisMonth: number;
  pendingRevenueLKR: number;
  pendingSlipCount: number;
}

/** Top-line business health: who's paying, who's new, what's stuck in review. */
export async function getBusinessOverview(subjects: Subject[]): Promise<BusinessOverview> {
  const now = Date.now();
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const thisMonth = monthKey(now);

  const [enrollSnap, studentSnap, pendingSnap] = await Promise.all([
    col.enrollments().limit(COHORT_SCAN_WINDOW).get(),
    col.users().where("role", "==", "student").limit(COHORT_SCAN_WINDOW).get(),
    col.payments().where("status", "==", "pending").limit(COHORT_SCAN_WINDOW).get(),
  ]);

  const activeEnrollments = enrollSnap.docs
    .map((d) => d.data() as Enrollment)
    .filter((e) => e.tenantId === publicEnv.tenantId && e.status === "active" && e.currentPeriodEnd > now);

  const newStudentsThisMonth = studentSnap.docs
    .map((d) => d.data() as User)
    .filter((u) => u.tenantId === publicEnv.tenantId && monthKey(u.createdAt) === thisMonth).length;

  const pendingPayments = pendingSnap.docs
    .map((d) => d.data() as Payment)
    .filter((p) => p.tenantId === publicEnv.tenantId);

  return {
    activeStudents: new Set(activeEnrollments.map((e) => e.uid)).size,
    mrrLKR: activeEnrollments.reduce((sum, e) => sum + (subjectById.get(e.subjectId)?.priceLKR ?? 0), 0),
    newStudentsThisMonth,
    pendingRevenueLKR: pendingPayments.reduce((sum, p) => sum + p.amountLKR, 0),
    pendingSlipCount: pendingPayments.filter((p) => p.provider === "bank_slip").length,
  };
}

export interface AtRiskStudent {
  uid: string;
  name: string;
  phone: string;
  subjectName: string;
  daysUntilExpiry: number;
  lastActiveDaysAgo: number | null;
}

/**
 * Students worth a personal nudge before they lapse: active enrollment
 * expiring within two weeks, ranked soonest-and-quietest first. This is the
 * teacher-side mirror of the parent dashboard — catching churn before it
 * happens, not reporting it after.
 */
export async function getAtRiskStudents(subjects: Subject[], limit = 15): Promise<AtRiskStudent[]> {
  const now = Date.now();
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const today = colomboDateString(now);

  const enrollSnap = await col.enrollments().limit(COHORT_SCAN_WINDOW).get();
  const expiringSoon = enrollSnap.docs
    .map((d) => d.data() as Enrollment)
    .filter(
      (e) =>
        e.tenantId === publicEnv.tenantId &&
        e.status === "active" &&
        e.currentPeriodEnd > now &&
        e.currentPeriodEnd - now <= 14 * DAY_MS,
    );

  if (expiringSoon.length === 0) return [];

  const uids = [...new Set(expiringSoon.map((e) => e.uid))];
  const [userSnaps, progressSnaps] = await Promise.all([
    adminDb().getAll(...uids.map((uid) => col.users().doc(uid))),
    adminDb().getAll(...expiringSoon.map((e) => col.progress().doc(progressId(e.uid, e.subjectId)))),
  ]);

  const userByUid = new Map(userSnaps.map((s) => [s.id, s.data() as User | undefined]));
  const progressByKey = new Map(progressSnaps.map((s) => [s.id, s.data() as Progress | undefined]));

  const rows: AtRiskStudent[] = expiringSoon.map((e) => {
    const user = userByUid.get(e.uid);
    const progress = progressByKey.get(progressId(e.uid, e.subjectId));
    return {
      uid: e.uid,
      name: user?.name ?? "Unknown",
      phone: user?.phone ?? "",
      subjectName: subjectById.get(e.subjectId)?.name ?? e.subjectId,
      daysUntilExpiry: Math.ceil((e.currentPeriodEnd - now) / DAY_MS),
      lastActiveDaysAgo: progress?.lastActiveDay ? daysBetweenDateStrings(progress.lastActiveDay, today) : null,
    };
  });

  return rows
    .sort(
      (a, b) =>
        a.daysUntilExpiry - b.daysUntilExpiry || (b.lastActiveDaysAgo ?? 999) - (a.lastActiveDaysAgo ?? 999),
    )
    .slice(0, limit);
}

export interface TopicStat {
  subjectId: string;
  subjectName: string;
  topic: string;
  accuracyPct: number;
  studentsSeen: number;
  timesAnswered: number;
}

/**
 * The worst-performing topics across the whole cohort, worst first — the
 * single most actionable number on this page: exactly what to re-teach next,
 * drawn straight from Practice attempts rather than a guess.
 */
export async function getWeakTopics(subjects: Subject[], limit = 8): Promise<TopicStat[]> {
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const snap = await col.attempts().limit(COHORT_SCAN_WINDOW).get();
  const attempts = snap.docs.map((d) => d.data() as QuestionAttempt).filter((a) => a.tenantId === publicEnv.tenantId);

  const byKey = new Map<string, { subjectId: string; topic: string; seen: number; correct: number; uids: Set<string> }>();
  for (const a of attempts) {
    const key = `${a.subjectId}::${a.topic}`;
    const bucket = byKey.get(key) ?? { subjectId: a.subjectId, topic: a.topic, seen: 0, correct: 0, uids: new Set() };
    bucket.seen += a.timesSeen;
    bucket.correct += a.timesCorrect;
    bucket.uids.add(a.uid);
    byKey.set(key, bucket);
  }

  // Below this many answers, one student's unlucky run can make a topic look
  // worse than it is — not enough signal yet to act on.
  const MIN_ANSWERS = 5;

  return [...byKey.values()]
    .filter((b) => b.seen >= MIN_ANSWERS)
    .map((b) => ({
      subjectId: b.subjectId,
      subjectName: subjectById.get(b.subjectId)?.name ?? b.subjectId,
      topic: b.topic,
      accuracyPct: Math.round((b.correct / b.seen) * 100),
      studentsSeen: b.uids.size,
      timesAnswered: b.seen,
    }))
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, limit);
}

export interface SubjectBreakdown {
  subjectId: string;
  subjectName: string;
  activeStudents: number;
  avgAccuracyPct: number | null;
  avgAttendanceScore: number | null;
}

/** Per-subject rollup: enrollment, practice accuracy, and attendance side by side. */
export async function getSubjectBreakdown(subjects: Subject[]): Promise<SubjectBreakdown[]> {
  const now = Date.now();

  const [enrollSnap, attemptSnap, sessionSnap, attendanceSnap] = await Promise.all([
    col.enrollments().limit(COHORT_SCAN_WINDOW).get(),
    col.attempts().limit(COHORT_SCAN_WINDOW).get(),
    col.sessions().limit(COHORT_SCAN_WINDOW).get(),
    col.attendance().limit(COHORT_SCAN_WINDOW).get(),
  ]);

  const enrollments = enrollSnap.docs.map((d) => d.data() as Enrollment).filter((e) => e.tenantId === publicEnv.tenantId);
  const attempts = attemptSnap.docs.map((d) => d.data() as QuestionAttempt).filter((a) => a.tenantId === publicEnv.tenantId);
  const sessions = sessionSnap.docs.map((d) => d.data() as ClassSession).filter((s) => s.tenantId === publicEnv.tenantId);
  const attendance = attendanceSnap.docs.map((d) => d.data() as AttendanceRecord).filter((a) => a.tenantId === publicEnv.tenantId);

  // Attendance records only carry a sessionId, so we join through sessions to
  // get back to a subject rather than storing subjectId redundantly on every record.
  const subjectBySession = new Map(sessions.map((s) => [s.id, s.subjectId]));

  return subjects.map((subject) => {
    const activeStudents = new Set(
      enrollments
        .filter((e) => e.subjectId === subject.id && e.status === "active" && e.currentPeriodEnd > now)
        .map((e) => e.uid),
    ).size;

    const subjectAttempts = attempts.filter((a) => a.subjectId === subject.id);
    const seen = subjectAttempts.reduce((s, a) => s + a.timesSeen, 0);
    const correct = subjectAttempts.reduce((s, a) => s + a.timesCorrect, 0);

    const subjectAttendance = attendance.filter((a) => subjectBySession.get(a.sessionId) === subject.id);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      activeStudents,
      avgAccuracyPct: seen > 0 ? Math.round((correct / seen) * 100) : null,
      avgAttendanceScore:
        subjectAttendance.length > 0
          ? Math.round(subjectAttendance.reduce((s, a) => s + (a.attendanceScore ?? 0), 0) / subjectAttendance.length)
          : null,
    };
  });
}
