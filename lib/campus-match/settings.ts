import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import type { CampusMatchSettings } from "@/lib/types";

/**
 * The publish switch for this cycle's Campus Match.
 *
 * Mirrors the predicted paper's toggle, and defaults the same way: a missing
 * document reads as "not published", never as published. The owner has to read
 * SOURCES.md and BACKTEST.md and look at ten degree profiles before a student
 * can be charged for any of it, and a default of true would sell the product
 * the moment it deployed.
 */
const SETTINGS_DOC = "campusMatch2027";

export async function getCampusMatchSettings(): Promise<CampusMatchSettings> {
  try {
    const snap = await col.settings().doc(SETTINGS_DOC).get();
    if (!snap.exists) {
      return { tenantId: publicEnv.tenantId, subjectId: CAMPUS_MATCH_ID, published: false };
    }
    return snap.data() as CampusMatchSettings;
  } catch (err) {
    // Unreadable settings must read as unpublished. The alternative is selling a
    // report during a Firestore blip.
    console.error("[campus-match] settings unreadable, treating as unpublished", err);
    return { tenantId: publicEnv.tenantId, subjectId: CAMPUS_MATCH_ID, published: false };
  }
}

export async function setCampusMatchPublished(
  published: boolean,
  updatedBy: string,
): Promise<CampusMatchSettings> {
  const settings: CampusMatchSettings = {
    tenantId: publicEnv.tenantId,
    subjectId: CAMPUS_MATCH_ID,
    published,
    ...(published ? { publishedAt: Date.now(), publishedBy: updatedBy } : {}),
  };
  await col.settings().doc(SETTINGS_DOC).set(settings, { merge: true });

  // Visibility and sellability move together. `ensureCampusMatch` creates the
  // subject inactive, so without this the owner would flip the switch and see
  // nothing appear — `listProducts()` filters on `active`.
  try {
    await col.subjects().doc(CAMPUS_MATCH_ID).update({ active: published });
  } catch (err) {
    console.error("[campus-match] could not flip the subject's active flag", err);
  }

  return settings;
}
