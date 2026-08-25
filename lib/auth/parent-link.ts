import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import { col } from "@/lib/firebase/admin";
import { publicEnv, optionalServerEnv } from "@/lib/env";
import type { User } from "@/lib/types";

const PARENT_LINK_TTL_SECONDS = 180 * 24 * 60 * 60;

/**
 * Signing key for parent view links.
 *
 * Prefers an explicit `PARENT_LINK_SECRET`, set the same way as the other
 * optional secrets (Firebase App Hosting → your backend → Secret Manager).
 * Falls back to a key derived from the Firebase project id so the feature
 * works the moment Firebase is connected, with no extra setup — the app must
 * always run with Firebase alone. This is an acceptable default because a
 * parent link only grants read access to attendance and score trend; it can
 * never join a class, download paid content, or move money.
 */
function signingKey(): Uint8Array {
  const secret =
    optionalServerEnv("PARENT_LINK_SECRET") ??
    createHash("sha256").update(`parent-link:${publicEnv.firebase.projectId}`).digest("hex");
  return new TextEncoder().encode(secret);
}

/** Mints a fresh parent view link for a student. */
export async function createParentLink(uid: string): Promise<string> {
  const snap = await col.users().doc(uid).get();
  const version = (snap.data() as User | undefined)?.parentLinkVersion ?? 0;

  const token = await new SignJWT({ uid, v: version })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_LINK_TTL_SECONDS}s`)
    .sign(signingKey());

  return `${publicEnv.appUrl}/parent/${token}`;
}

/** Verifies a link token, checking it against the account's current link version. */
export async function verifyParentLink(token: string): Promise<{ uid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey());
    const uid = typeof payload.uid === "string" ? payload.uid : null;
    if (!uid) return null;

    const snap = await col.users().doc(uid).get();
    if (!snap.exists) return null;
    const user = snap.data() as User;
    if (user.disabled) return null;
    if ((user.parentLinkVersion ?? 0) !== payload.v) return null;

    return { uid };
  } catch {
    // Expired, malformed or tampered token — treat as invalid.
    return null;
  }
}

/**
 * Invalidates every parent link issued so far, by bumping the version number
 * embedded in them. A previously shared link then fails `verifyParentLink`
 * without needing a revocation list.
 */
export async function revokeParentLinks(uid: string): Promise<void> {
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  const current = (snap.data() as User | undefined)?.parentLinkVersion ?? 0;
  await ref.update({ parentLinkVersion: current + 1 });
}
