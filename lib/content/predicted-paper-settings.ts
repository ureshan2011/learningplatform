import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { PREDICTED_PAPER_EXAM_YEAR_TARGET } from "@/lib/content/al-ict-2027-predicted-paper1";
import type { PredictedPaperSettings } from "@/lib/types";

/**
 * The whole-paper publish switch for the 2027 predicted paper.
 *
 * One document, one boolean — a teacher reads the full predicted paper once
 * on `/teacher/predicted-paper` and flips it, rather than approving 60
 * questions one by one. Defaults to unpublished: the underlying content is
 * AI-drafted and its Sinhala has not had a native-speaker check yet (see the
 * caveat in `al-ict-2027-predicted-paper1.ts`), so a missing document must
 * read as "not published", never as "published".
 */
const SETTINGS_DOC = `predictedPaper${PREDICTED_PAPER_EXAM_YEAR_TARGET}`;

export async function getPredictedPaperSettings(): Promise<PredictedPaperSettings> {
  const snap = await col.settings().doc(SETTINGS_DOC).get();
  if (!snap.exists) {
    return { tenantId: publicEnv.tenantId, examYearTarget: PREDICTED_PAPER_EXAM_YEAR_TARGET, published: false };
  }
  return snap.data() as PredictedPaperSettings;
}

export async function setPredictedPaperPublished(published: boolean, updatedBy: string): Promise<PredictedPaperSettings> {
  const settings: PredictedPaperSettings = {
    tenantId: publicEnv.tenantId,
    examYearTarget: PREDICTED_PAPER_EXAM_YEAR_TARGET,
    published,
    ...(published ? { publishedAt: Date.now(), publishedBy: updatedBy } : {}),
  };
  await col.settings().doc(SETTINGS_DOC).set(settings, { merge: true });
  return settings;
}
