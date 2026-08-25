import "server-only";

import { col, enrollmentId } from "@/lib/firebase/admin";
import type { AccessResult, Enrollment, User } from "@/lib/types";

/**
 * THE access check. Every gated resource goes through this function:
 * Zoom join URLs, replays, notes downloads, practice quizzes, the Live Arena.
 *
 * There is exactly one of these on purpose. Access logic scattered across
 * pages and components is how students end up with a route that forgot to
 * check, and a forgotten check on a tuition platform is unpaid students in a
 * paid class.
 *
 * Never call this from client code — it reads privileged documents.
 */
export async function hasAccess(
  uid: string,
  subjectId: string,
  at: number = Date.now(),
): Promise<AccessResult> {
  if (!uid) return { allowed: false, reason: "not_authenticated" };

  const [userSnap, enrollSnap] = await Promise.all([
    col.users().doc(uid).get(),
    col.enrollments().doc(enrollmentId(uid, subjectId)).get(),
  ]);

  if (!userSnap.exists) return { allowed: false, reason: "not_authenticated" };
  const user = userSnap.data() as User;
  if (user.disabled) return { allowed: false, reason: "account_disabled" };

  // Teachers and admins see everything they own — they need to test the
  // student experience without paying themselves.
  if (user.role === "teacher" || user.role === "admin") {
    return { allowed: true };
  }

  if (!enrollSnap.exists) return { allowed: false, reason: "not_enrolled" };
  const enrollment = enrollSnap.data() as Enrollment;

  if (enrollment.status === "suspended") {
    return { allowed: false, reason: "suspended", enrollment };
  }
  if (enrollment.status !== "active") {
    return { allowed: false, reason: "not_enrolled", enrollment };
  }
  if (at > enrollment.currentPeriodEnd) {
    // Lapsed but not yet swept by the expiry job — deny on the timestamp,
    // never on the stored status alone.
    return { allowed: false, reason: "expired", enrollment };
  }

  return { allowed: true, enrollment };
}

/** Convenience for route handlers: throws so the caller can return a 403 uniformly. */
export async function requireAccess(uid: string, subjectId: string): Promise<Enrollment | undefined> {
  const result = await hasAccess(uid, subjectId);
  if (!result.allowed) {
    const err = new Error("FORBIDDEN") as Error & { reason?: string };
    err.reason = result.reason;
    throw err;
  }
  return result.enrollment;
}

/**
 * Grants or extends access after a confirmed payment.
 *
 * Extension stacks from the later of "now" and the existing period end, so a
 * student who pays early is not silently robbed of the days they already
 * bought.
 */
export async function grantAccess(params: {
  uid: string;
  subjectId: string;
  tenantId: string;
  months?: number;
  source: Enrollment["source"];
  paymentId?: string;
}): Promise<Enrollment> {
  const months = params.months ?? 1;
  const ref = col.enrollments().doc(enrollmentId(params.uid, params.subjectId));
  const now = Date.now();

  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as Enrollment) : undefined;
  const base = existing && existing.currentPeriodEnd > now ? existing.currentPeriodEnd : now;

  const enrollment: Enrollment = {
    id: ref.id,
    tenantId: params.tenantId,
    uid: params.uid,
    subjectId: params.subjectId,
    status: "active",
    currentPeriodStart: existing?.currentPeriodStart ?? now,
    currentPeriodEnd: addMonths(base, months),
    source: params.source,
    ...(params.paymentId ? { lastPaymentId: params.paymentId } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(enrollment, { merge: true });
  return enrollment;
}

/**
 * Grants or extends access by a fixed number of days rather than months.
 *
 * Used for the referral bonus (3 free days each). Separate from
 * `grantAccess` because a day count must never silently roll into the
 * calendar-month arithmetic `addMonths` does for paid periods — a referral
 * bonus is exact days, not "close enough".
 */
export async function grantBonusDays(params: {
  uid: string;
  subjectId: string;
  tenantId: string;
  days: number;
  source: Enrollment["source"];
}): Promise<Enrollment> {
  const ref = col.enrollments().doc(enrollmentId(params.uid, params.subjectId));
  const now = Date.now();

  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as Enrollment) : undefined;
  const base = existing && existing.currentPeriodEnd > now ? existing.currentPeriodEnd : now;

  const enrollment: Enrollment = {
    id: ref.id,
    tenantId: params.tenantId,
    uid: params.uid,
    subjectId: params.subjectId,
    status: "active",
    currentPeriodStart: existing?.currentPeriodStart ?? now,
    currentPeriodEnd: base + params.days * 24 * 60 * 60 * 1000,
    source: params.source,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(enrollment, { merge: true });
  return enrollment;
}

/**
 * Adds calendar months, clamping to the end of a short month.
 *
 * Paying on the 31st must not skip a month: 31 Jan + 1 month is 28 Feb, not
 * 3 March. Getting this wrong gives students free days and is invisible until
 * the accounts do not add up.
 */
export function addMonths(from: number, months: number): number {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.getTime();
}
