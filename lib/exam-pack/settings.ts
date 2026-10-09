import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { EXAM_PACK_ID, EXAM_PACK_SETTINGS_DOC, LIVE_DEFAULTS } from "@/lib/exam-pack/config";
import type { ExamPackLiveSchedule, ExamPackSettings, Subject } from "@/lib/types";

/**
 * The Exam Pack's on/off switch and its weekly live schedule.
 *
 * Off unless the owner turns it on. A missing document reads as off, and so
 * does an unreadable one — the alternative is selling the pack during a
 * Firestore blip, before anyone has reviewed it.
 *
 * ## Independent of the trial-only launch
 *
 * `TRIAL_ONLY_LAUNCH` (lib/payments/launch.ts) pauses every other payment on
 * the platform. This switch is the Exam Pack's own: turning it on opens card
 * payment for this one product and nothing else. That is the owner's call —
 * sell the flagship while the monthly classes stay free.
 */

export function defaultExamPackSettings(): ExamPackSettings {
  return {
    tenantId: publicEnv.tenantId,
    subjectId: EXAM_PACK_ID,
    enabled: false,
    live: { ...LIVE_DEFAULTS },
  };
}

export async function getExamPackSettings(): Promise<ExamPackSettings> {
  try {
    const snap = await col.settings().doc(EXAM_PACK_SETTINGS_DOC).get();
    if (!snap.exists) return defaultExamPackSettings();
    const stored = snap.data() as Partial<ExamPackSettings>;
    return {
      ...defaultExamPackSettings(),
      ...stored,
      // A document written before a field existed still gets the default for it.
      live: { ...LIVE_DEFAULTS, ...(stored.live ?? {}) },
      enabled: stored.enabled === true,
    };
  } catch (err) {
    console.error("[exam-pack] settings unreadable, treating as off", err);
    return defaultExamPackSettings();
  }
}

/**
 * Puts the pack on sale, or takes it off.
 *
 * Visibility and sellability move together, as Campus Match's do: the subject
 * is created inactive, so flipping only the setting would leave a pack nobody
 * can see. Taking it off sale never touches what people already bought — their
 * enrollments, sittings and bookings stay exactly as they are.
 */
export async function setExamPackEnabled(enabled: boolean, by: string): Promise<ExamPackSettings> {
  const now = Date.now();
  await col
    .settings()
    .doc(EXAM_PACK_SETTINGS_DOC)
    .set(
      {
        tenantId: publicEnv.tenantId,
        subjectId: EXAM_PACK_ID,
        enabled,
        ...(enabled ? { enabledAt: now, enabledBy: by } : {}),
        updatedAt: now,
        updatedBy: by,
      },
      { merge: true },
    );

  try {
    await col.subjects().doc(EXAM_PACK_ID).update({ active: enabled } satisfies Partial<Subject>);
  } catch (err) {
    console.error("[exam-pack] could not flip the subject's active flag", err);
  }

  return getExamPackSettings();
}

export async function saveLiveSchedule(live: ExamPackLiveSchedule, by: string): Promise<void> {
  await col
    .settings()
    .doc(EXAM_PACK_SETTINGS_DOC)
    .set(
      {
        tenantId: publicEnv.tenantId,
        subjectId: EXAM_PACK_ID,
        live,
        updatedAt: Date.now(),
        updatedBy: by,
      },
      { merge: true },
    );
}

/** The price and access period, edited from the console. Merges into the product block. */
export async function saveExamPackPrice(params: { feeLKR: number; accessDays: number }): Promise<void> {
  await col
    .subjects()
    .doc(EXAM_PACK_ID)
    .set({ product: { feeLKR: params.feeLKR, accessDays: params.accessDays } }, { merge: true });
}
