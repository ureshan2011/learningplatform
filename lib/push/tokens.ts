import "server-only";

import { col } from "@/lib/firebase/admin";

/**
 * Which browsers a student has allowed notifications on.
 *
 * Stored as an array on the user document rather than a subcollection: it is
 * read on the reminder path for every enrolled student at once, and a
 * subcollection would turn one document read per student into two. Capped
 * because a student who clears site data and re-allows gets a fresh token each
 * time, and a document that grows without bound eventually stops being
 * readable at all.
 */
export const MAX_PUSH_TOKENS = 5;

export interface PushToken {
  token: string;
  /** For pruning the least recently confirmed when the cap is hit. */
  at: number;
}

export async function savePushToken(uid: string, token: string): Promise<void> {
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return;

  const existing = ((snap.data() as { pushTokens?: PushToken[] }).pushTokens ?? []).filter(
    (t) => t.token !== token,
  );
  // Newest last, so the slice below drops the stalest.
  const next = [...existing, { token, at: Date.now() }].slice(-MAX_PUSH_TOKENS);

  await ref.update({ pushTokens: next });
}

export async function removePushToken(uid: string, token: string): Promise<void> {
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return;

  const next = ((snap.data() as { pushTokens?: PushToken[] }).pushTokens ?? []).filter(
    (t) => t.token !== token,
  );
  await ref.update({ pushTokens: next });
}

/**
 * Drops tokens Cloud Messaging has told us are dead.
 *
 * A token stops working when the student uninstalls the app, clears site data
 * or revokes the permission, and FCM reports that per-token on send. Left
 * alone they accumulate and every future send wastes a call on each one, so
 * the send path feeds them back here.
 */
export async function pruneDeadTokens(uid: string, dead: string[]): Promise<void> {
  if (dead.length === 0) return;

  // Read-modify-write rather than `arrayRemove`: that matches whole elements,
  // and the stored element carries a timestamp this caller does not know.
  // Wrapped so a failure here can never fail the send that triggered it —
  // a stale token costs one wasted call, a thrown reminder costs the class.
  try {
    const ref = col.users().doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return;

    const deadSet = new Set(dead);
    const next = ((snap.data() as { pushTokens?: PushToken[] }).pushTokens ?? []).filter(
      (t) => !deadSet.has(t.token),
    );
    await ref.update({ pushTokens: next });
  } catch (err) {
    console.error("[push] could not prune dead tokens", err);
  }
}
