import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, col } from "@/lib/firebase/admin";
import type { Role, User } from "@/lib/types";

export const SESSION_COOKIE = "ictclass_session";

/**
 * Which device this browser is, alongside the session cookie.
 *
 * Lets the teacher free one device slot without signing that student out on
 * every other device they own. It is a convenience marker, not a security
 * boundary — the session cookie is what proves who you are, and the device cap
 * is enforced when a session is created, not on every read.
 */
export const DEVICE_COOKIE = "ictclass_device";

/**
 * 14 days — the maximum Firebase allows for a session cookie.
 *
 * The old value was 5 days, on the theory that a shorter cookie held down the
 * SMS bill. It did the exact opposite: nothing renewed the cookie, so every
 * student re-OTPed on a fixed 5-day drumbeat whether they were active or not,
 * and every one of those was a billed verification.
 *
 * `SessionKeeper` now renews this silently from the browser's Firebase refresh
 * token, which never expires and costs nothing. In steady state a student
 * signs in once and stays signed in; this ceiling only matters to someone who
 * has not opened the site for two weeks.
 */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Renew once the cookie is over a day old.
 *
 * Any threshold below the 14-day life works; a day keeps renewals to roughly
 * one cheap request per student per day while leaving thirteen days of margin
 * for a student who is offline for a while.
 */
export const SESSION_RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

export interface SessionUser {
  uid: string;
  role: Role;
  tenantId: string;
  name: string;
  phone: string;
}

/** Why `resolveSession` returned no user. Callers redirect on all of them; the sign-in page words them differently. */
export type SessionFailure =
  | "no_cookie"
  | "invalid"
  | "expired"
  | "revoked"
  | "device_released"
  | "account_disabled"
  | "no_account";

export type SessionResult =
  | { user: SessionUser; failure?: undefined }
  | { user: null; failure: SessionFailure };

/**
 * Resolves the signed-in user from the session cookie.
 *
 * ## Why this does not use Firebase's `checkRevoked`
 *
 * It used to. `verifySessionCookie(cookie, true)` asks Google's Auth backend,
 * on every single server render, whether this user's tokens have been revoked.
 * That is one network round trip per page view — and the previous code wrapped
 * the whole thing in a bare `catch` that returned `null`, so *any* transient
 * failure of that call (a cold container, a blip, a rate limit) was
 * indistinguishable from a forged cookie and signed the student straight out.
 * That is the "it logs me out constantly" bug: the sessions were valid the
 * whole time, we just kept failing to ask.
 *
 * So verification is now purely local — a signature and expiry check against
 * Google's cached public keys, no network, no failure mode — and revocation
 * is answered by `sessionsValidFrom` on the user document we already read.
 * Same guarantee, one fewer thing that can break.
 *
 * The Firestore read is still allowed to fail, and when it does we fall back
 * to the role and tenant baked into the cookie's own claims rather than
 * pretending the student is signed out. A stale role for one render is a far
 * smaller harm than throwing a paying student back to the SMS gate.
 *
 * Memoized per request: a page, its layout and its child components all call
 * this, and they should share one read.
 */
export const resolveSession = cache(async (): Promise<SessionResult> => {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE)?.value;
  if (!cookie) return { user: null, failure: "no_cookie" };

  let decoded: Awaited<ReturnType<ReturnType<typeof adminAuth>["verifySessionCookie"]>>;
  try {
    // checkRevoked = false: local verification only. See the note above.
    decoded = await adminAuth().verifySessionCookie(cookie, false);
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    return { user: null, failure: code.includes("expired") ? "expired" : "invalid" };
  }

  const claimRole = (decoded.role as Role | undefined) ?? "student";
  const claimTenant = (decoded.tenantId as string | undefined) ?? "default";

  let snap;
  try {
    snap = await col.users().doc(decoded.uid).get();
  } catch (err) {
    // Firestore is unreachable or slow. We know the cookie is authentic — it
    // carries a valid Google signature — so honour it on the claims alone
    // rather than bouncing a signed-in student to the sign-in page over an
    // infrastructure hiccup.
    console.error("[session] user read failed; falling back to cookie claims", err);
    return {
      user: {
        uid: decoded.uid,
        role: claimRole,
        tenantId: claimTenant,
        name: "",
        phone: (decoded.phone_number as string | undefined) ?? "",
      },
    };
  }

  if (!snap.exists) return { user: null, failure: "no_account" };
  const user = snap.data() as User;

  if (user.disabled) return { user: null, failure: "account_disabled" };

  // Our own revocation clock. `auth_time` is when the student actually proved
  // possession of the phone, which is the instant a revocation is measured
  // against — not `iat`, which moves every time the cookie is renewed and
  // would let a renewal walk straight through a revocation.
  if (user.sessionsValidFrom && decoded.auth_time * 1000 < user.sessionsValidFrom) {
    return { user: null, failure: "revoked" };
  }

  // This browser's slot was freed by the teacher (a lost phone, a swap). Only
  // this device is signed out; the student's other devices keep their sessions.
  // Absent cookie = a session issued before this field existed, which we honour
  // rather than signing out every student on the deploy that introduced it.
  const deviceHash = jar.get(DEVICE_COOKIE)?.value;
  if (deviceHash && !(user.devices ?? []).some((d) => d.deviceHash === deviceHash)) {
    return { user: null, failure: "device_released" };
  }

  return {
    user: {
      uid: decoded.uid,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
      phone: user.phone,
    },
  };
});

export async function getSessionUser(): Promise<SessionUser | null> {
  return (await resolveSession()).user;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireTeacher(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (!isStaff(user.role)) throw new Error("FORBIDDEN");
  return user;
}

/**
 * Admin-only actions: changing someone's role, disabling an account.
 *
 * Teachers run the classes; admins run the platform. Keeping role changes
 * behind this means a second teacher account added later cannot quietly
 * promote itself.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export function isStaff(role: Role): boolean {
  return role === "teacher" || role === "admin";
}

/**
 * Builds the sign-in URL that returns the student to where they were.
 *
 * Every gated page calls this instead of hand-writing `/signin?next=...`, so
 * "sign in, then continue what you were doing" is the default rather than
 * something each page remembers to do. `reason` lets the sign-in page say
 * "your sign-in expired" instead of a blank form the student reads as a bug.
 */
/**
 * Gate for a server-rendered page: return the user, or send them to sign in and
 * bring them straight back here afterwards.
 *
 * Every gated page used to write its own redirect, and half of them wrote
 * `/signin` with no destination at all — so a student who tapped a WhatsApp
 * link to tonight's class, typed a number and waited for an SMS landed on the
 * dashboard and had to go and find the class again, on a phone, as it started.
 * Routing it through one helper makes "come back to where you were" the
 * behaviour a page gets for free rather than one it has to remember.
 */
export async function requirePageUser(next: string): Promise<SessionUser> {
  const { user, failure } = await resolveSession();
  if (!user) redirect(signInUrl(next, failure));
  return user;
}

/** Same, for the teacher console. A signed-in student is sent to their dashboard, not to sign in again. */
export async function requireStaffPage(next: string): Promise<SessionUser> {
  const user = await requirePageUser(next);
  if (!isStaff(user.role)) redirect("/dashboard");
  return user;
}

export function signInUrl(next?: string, reason?: SessionFailure): string {
  const params = new URLSearchParams();
  if (next && next.startsWith("/") && !next.startsWith("//")) params.set("next", next);
  if (reason && reason !== "no_cookie") params.set("reason", reason);
  const query = params.toString();
  return query ? `/signin?${query}` : "/signin";
}
