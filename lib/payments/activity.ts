import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { formatLKR } from "@/lib/format";
import type { Subject, User } from "@/lib/types";

/**
 * The teacher's activity feed: what happened with money, newest first.
 *
 * Written server-side into `teacherActivity` as one small document per event,
 * rather than derived from the payment collection on every poll. The console
 * checks this every twenty seconds while it is open, and a poll that re-reads
 * thousands of payment documents to find out that nothing changed is exactly
 * the kind of query that makes a Firestore bill surprising.
 */

export type ActivityKind = "payment_paid" | "slip_uploaded";

export interface TeacherActivity {
  id: string;
  tenantId: string;
  kind: ActivityKind;
  /** Ready to render — the poller does no joins. */
  title: string;
  detail: string;
  paymentId?: string;
  at: number;
  /** Cleared once the teacher has opened the payments page. */
  seen?: boolean;
}

export async function notifyTeacher(params: {
  kind: ActivityKind;
  uid: string;
  subjectId: string;
  amountLKR: number;
  paymentId: string;
  receiptNo?: string;
  method: string;
}): Promise<void> {
  const at = Date.now();
  const id = `${at}_${params.paymentId}`.slice(0, 200);

  try {
    const [userSnap, subjectSnap] = await Promise.all([
      col.users().doc(params.uid).get(),
      col.subjects().doc(params.subjectId).get(),
    ]);
    const student = userSnap.data() as User | undefined;
    const subject = subjectSnap.data() as Subject | undefined;

    const activity: TeacherActivity = {
      id,
      tenantId: publicEnv.tenantId,
      kind: params.kind,
      title:
        params.kind === "payment_paid"
          ? `${student?.name ?? "A student"} paid ${formatLKR(params.amountLKR)}`
          : `${student?.name ?? "A student"} uploaded a deposit slip`,
      detail: [
        subject?.name ?? params.subjectId,
        params.method,
        params.receiptNo,
        student?.phone,
      ]
        .filter(Boolean)
        .join(" · "),
      paymentId: params.paymentId,
      at,
      seen: false,
    };

    await col.teacherActivity().doc(id).set(activity);
  } catch (err) {
    // A missed notification must never fail the payment that caused it.
    console.error("[payments] could not write teacher activity", err);
  }
}

export async function listTeacherActivity(limit = 20): Promise<TeacherActivity[]> {
  const snap = await col.teacherActivity().orderBy("at", "desc").limit(limit).get();
  return snap.docs
    .map((d) => d.data() as TeacherActivity)
    .filter((a) => a.tenantId === publicEnv.tenantId);
}

/** Marks everything up to `at` as seen, so the bell only counts what is new. */
export async function markActivitySeen(upTo: number): Promise<void> {
  const snap = await col
    .teacherActivity()
    .orderBy("at", "desc")
    .limit(50)
    .get();

  const batch = col.teacherActivity().firestore.batch();
  let touched = 0;
  for (const doc of snap.docs) {
    const activity = doc.data() as TeacherActivity;
    if (activity.seen || activity.at > upTo) continue;
    batch.update(doc.ref, { seen: true });
    touched += 1;
  }
  if (touched > 0) await batch.commit();
}
