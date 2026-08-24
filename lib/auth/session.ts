import "server-only";

import { cookies } from "next/headers";
import { adminAuth, col } from "@/lib/firebase/admin";
import type { Role, User } from "@/lib/types";

export const SESSION_COOKIE = "ictclass_session";

/** 5 days. Long enough that students are not re-OTPing constantly (SMS costs money). */
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  uid: string;
  role: Role;
  tenantId: string;
  name: string;
  phone: string;
}

/**
 * Resolves the signed-in user from the session cookie.
 *
 * `checkRevoked` is on deliberately: it is what makes "kick the previous
 * device" work the instant a session is revoked, rather than up to an hour
 * later when the token would otherwise expire.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const snap = await col.users().doc(decoded.uid).get();
    if (!snap.exists) return null;

    const user = snap.data() as User;
    if (user.disabled) return null;

    return {
      uid: decoded.uid,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
      phone: user.phone,
    };
  } catch {
    // Expired, revoked or tampered cookie — treat as signed out.
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireTeacher(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "teacher" && user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
