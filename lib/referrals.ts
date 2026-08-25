import "server-only";

import { col } from "@/lib/firebase/admin";
import { grantBonusDays } from "@/lib/payments/entitlements";
import type { Payment, User } from "@/lib/types";

const REFERRAL_BONUS_DAYS = 3;

/**
 * Rewards both sides of a referral the first time the referred student's
 * payment succeeds.
 *
 * Called only from the two places an enrollment is ever granted — the
 * PayHere webhook and the teacher's bank-slip approval — so it inherits
 * their server-only posture. A client cannot claim this reward by writing to
 * Firestore directly; there is no client-writable field this depends on.
 *
 * Gated on `referralRewarded` so a student's second, third, ... monthly
 * payment never re-triggers it — otherwise a long-subscribed student would
 * farm free days every renewal. Silently no-ops if the student was not
 * referred, or the code they signed up with does not resolve to a real
 * account (typo, or the referrer's account was since disabled).
 */
export async function applyReferralBonus(payment: Payment): Promise<void> {
  const studentRef = col.users().doc(payment.uid);
  const studentSnap = await studentRef.get();
  if (!studentSnap.exists) return;

  const student = studentSnap.data() as User;
  if (!student.referredBy || student.referralRewarded) return;

  // Single equality filter on a field every user document has — no
  // composite index needed, consistent with the rest of the codebase's
  // query patterns (see lib/queries.ts).
  const referrerSnap = await col
    .users()
    .where("referralCode", "==", student.referredBy)
    .limit(1)
    .get();
  if (referrerSnap.empty) return;

  const referrer = referrerSnap.docs[0].data() as User;
  if (referrer.uid === student.uid) return;

  await Promise.all([
    grantBonusDays({
      uid: student.uid,
      subjectId: payment.subjectId,
      tenantId: payment.tenantId,
      days: REFERRAL_BONUS_DAYS,
      source: "trial",
    }),
    grantBonusDays({
      uid: referrer.uid,
      subjectId: payment.subjectId,
      tenantId: payment.tenantId,
      days: REFERRAL_BONUS_DAYS,
      source: "trial",
    }),
    studentRef.update({ referralRewarded: true }),
  ]);
}
