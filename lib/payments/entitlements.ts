import "server-only";

import { col, enrollmentId } from "@/lib/firebase/admin";
import type { AccessResult, Enrollment, Payment, Subject, User } from "@/lib/types";

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
 *
 * One payment extends the period once, however many times it is presented.
 * The webhook grants access before it marks the payment paid — it has to, or a
 * failure in between would leave a student charged and locked out — so a crash
 * in that gap used to mean PayHere's retry found the payment still pending and
 * bought a second month for free. The stored `lastPaymentId` closes that
 * without depending on the order of the two writes.
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

  if (existing && params.paymentId && existing.lastPaymentId === params.paymentId) {
    return existing;
  }

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
 * Grants access to a fixed-term cohort — Campus Ready and anything like it.
 *
 * The period ends on the cohort's own `endsAt`, never "now plus a duration".
 * That is the whole difference from `grantAccess` and `grantBonusDays`, and it
 * is why this is a third function rather than an option on the first: those two
 * *stack* from the later of now and the existing end, which is right for a
 * monthly subscription and wrong here. A cohort finishes when the teaching
 * finishes. A student who pays twice, or pays late, gets the same last day as
 * everyone else — not a private extension into an empty classroom.
 *
 * It does not check whether enrolment has closed. That belongs at checkout,
 * before money moves: a PayHere notification that lands a few minutes after the
 * cut-off has already taken the student's money, and dropping it here would
 * leave them paid-up with nothing to show for it.
 */
export async function grantCohortAccess(params: {
  uid: string;
  subjectId: string;
  tenantId: string;
  /** The cohort's last day, from `Subject.cohort.endsAt`. */
  endsAt: number;
  source: Enrollment["source"];
  paymentId?: string;
}): Promise<Enrollment> {
  const ref = col.enrollments().doc(enrollmentId(params.uid, params.subjectId));
  const now = Date.now();

  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as Enrollment) : undefined;

  const enrollment: Enrollment = {
    id: ref.id,
    tenantId: params.tenantId,
    uid: params.uid,
    subjectId: params.subjectId,
    status: "active",
    currentPeriodStart: existing?.currentPeriodStart ?? now,
    currentPeriodEnd: params.endsAt,
    source: params.source,
    ...(params.paymentId ? { lastPaymentId: params.paymentId } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(enrollment, { merge: true });
  return enrollment;
}

/**
 * Grants whatever access a confirmed payment bought — monthly or cohort.
 *
 * THE single place that decides which of the two rules applies. Access is
 * granted from three routes (the PayHere webhook, the teacher's bank-slip
 * approval, and manual entry) and all three must agree; three copies of this
 * branch is how one of them quietly keeps handing cohort students a month.
 *
 * `months` is ignored for a cohort payment, deliberately rather than by
 * accident: the slip-approval screen asks the teacher for a month count, and
 * for a fixed-term programme the honest answer is that it does not apply.
 */
export async function grantForPayment(params: {
  payment: Payment;
  /** Months to grant for a monthly payment. Ignored when the payment is a cohort. */
  months: number;
  source: Enrollment["source"];
}): Promise<Enrollment> {
  const { payment } = params;

  if (payment.kind === "cohort") {
    return grantCohortAccess({
      uid: payment.uid,
      subjectId: payment.subjectId,
      tenantId: payment.tenantId,
      endsAt: payment.periodEnd,
      source: params.source,
      paymentId: payment.id,
    });
  }

  return grantAccess({
    uid: payment.uid,
    subjectId: payment.subjectId,
    tenantId: payment.tenantId,
    months: params.months,
    source: params.source,
    paymentId: payment.id,
  });
}

/**
 * Takes back access bought by a payment that was refunded or charged back.
 *
 * Ends the period now rather than deleting the enrollment: the document is the
 * record that this student was once enrolled, and `startFreeTrial` treats any
 * existing enrollment as a used trial, so deleting it would hand the student a
 * fresh free week every time they disputed a payment.
 */
export async function revokeAccess(params: {
  uid: string;
  subjectId: string;
}): Promise<boolean> {
  const ref = col.enrollments().doc(enrollmentId(params.uid, params.subjectId));
  const snap = await ref.get();
  if (!snap.exists) return false;

  const now = Date.now();
  await ref.update({
    status: "expired",
    currentPeriodEnd: Math.min((snap.data() as Enrollment).currentPeriodEnd, now),
    updatedAt: now,
  });
  return true;
}

/** Long enough to reach at least one scheduled live class, however the timetable falls. */
export const FREE_TRIAL_DAYS = 7;

/**
 * Grants a one-time, no-payment trial for a subject a student has never
 * touched before.
 *
 * "Never touched" is enforced by requiring no enrollment document to exist at
 * all — not "no active enrollment", which a lapsed or cancelled subscriber
 * would also satisfy and could otherwise re-trigger a free trial every time
 * their paid access expires.
 *
 * Refuses outright on a fixed-term cohort. The trial is built for an ongoing
 * monthly class a student can sample and then keep paying for; a cohort is one
 * fixed programme bought once, so a "free week" of it is just the first two
 * weeks of a Rs 30,000 course given away. The check reads the subject rather
 * than trusting the caller, because both callers reach here from a route that
 * could gain a cohort id without anyone remembering this rule.
 */
export async function startFreeTrial(params: {
  uid: string;
  subjectId: string;
  tenantId: string;
}): Promise<Enrollment> {
  const subjectSnap = await col.subjects().doc(params.subjectId).get();
  if (subjectSnap.exists && (subjectSnap.data() as Subject).cohort) {
    const err = new Error("TRIAL_NOT_AVAILABLE") as Error & { reason?: string };
    err.reason = "trial_not_available";
    throw err;
  }

  const ref = col.enrollments().doc(enrollmentId(params.uid, params.subjectId));
  const snap = await ref.get();
  if (snap.exists) {
    const err = new Error("TRIAL_ALREADY_USED") as Error & { reason?: string };
    err.reason = "trial_already_used";
    throw err;
  }

  return grantBonusDays({
    uid: params.uid,
    subjectId: params.subjectId,
    tenantId: params.tenantId,
    days: FREE_TRIAL_DAYS,
    source: "free_trial",
  });
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
