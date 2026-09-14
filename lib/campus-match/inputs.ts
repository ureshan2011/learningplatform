import "server-only";

import { col } from "@/lib/firebase/admin";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import type { CampusMatchInputs } from "@/lib/types";

/**
 * The student's own answers — Z-score, district, stream, passes, preferences.
 *
 * One document per student per cycle, keyed deterministically so the report can
 * fetch it by id rather than query for it. The same reasoning as enrollment
 * ids: the hot path is a single read on a page a student refreshes.
 *
 * Only the server writes here, and only behind `hasAccess`. Firestore rules
 * grant the browser nothing on this collection.
 */

function inputsId(uid: string, cycle: string): string {
  return `${uid}_${cycle}`;
}

export async function getInputs(
  uid: string,
  cycle: string = CAMPUS_MATCH_ID,
): Promise<CampusMatchInputs | undefined> {
  const snap = await col.campusMatch().doc(inputsId(uid, cycle)).get();
  return snap.exists ? (snap.data() as CampusMatchInputs) : undefined;
}

export async function saveInputs(params: {
  uid: string;
  tenantId: string;
  cycle?: string;
  z: number;
  district: string;
  stream: string;
  passes: string[];
  medium: boolean;
  preferences: string[];
}): Promise<CampusMatchInputs> {
  const cycle = params.cycle ?? CAMPUS_MATCH_ID;
  const ref = col.campusMatch().doc(inputsId(params.uid, cycle));
  const now = Date.now();
  const existing = (await ref.get()).data() as CampusMatchInputs | undefined;

  const inputs: CampusMatchInputs = {
    id: ref.id,
    tenantId: params.tenantId as CampusMatchInputs["tenantId"],
    uid: params.uid,
    cycle,
    z: params.z,
    district: params.district,
    stream: params.stream,
    passes: params.passes,
    medium: params.medium,
    preferences: params.preferences,
    // An outcome already recorded survives the student editing their inputs:
    // it is the one fact the next cycle's backtest can be scored against.
    ...(existing?.outcome ? { outcome: existing.outcome, outcomeAt: existing.outcomeAt } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(inputs, { merge: true });
  return inputs;
}

/** Records what the student was actually offered. Asked once, after selection. */
export async function recordOutcome(
  uid: string,
  outcome: string,
  cycle: string = CAMPUS_MATCH_ID,
): Promise<boolean> {
  const ref = col.campusMatch().doc(inputsId(uid, cycle));
  if (!(await ref.get()).exists) return false;
  await ref.update({ outcome, outcomeAt: Date.now(), updatedAt: Date.now() });
  return true;
}

/** The student's answer to "delete what you hold on me", from Account. */
export async function deleteInputs(
  uid: string,
  cycle: string = CAMPUS_MATCH_ID,
): Promise<boolean> {
  const ref = col.campusMatch().doc(inputsId(uid, cycle));
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
