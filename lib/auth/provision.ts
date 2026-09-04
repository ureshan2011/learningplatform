import "server-only";

import { randomBytes } from "node:crypto";
import { adminAuth, adminDb, col } from "@/lib/firebase/admin";
import { adminPhones, publicEnv } from "@/lib/env";
import { toE164 } from "@/lib/phone";
import type { Role, User } from "@/lib/types";

/** Ambiguous characters (0/O, 1/I) are excluded — codes get read aloud and mistyped. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newReferralCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** Is this number listed in ADMIN_PHONES? Compared in E.164 so "077…" and "+9477…" match. */
function isAdminPhone(phone: string): boolean {
  const canonical = toE164(phone) ?? phone;
  return adminPhones().some((entry) => (toE164(entry) ?? entry) === canonical);
}

/**
 * Creates the Firestore user on first sign-in and mirrors role + tenant into
 * custom claims.
 *
 * Claims matter because security rules cannot afford a document read on every
 * evaluation — `request.auth.token.role` is free, a `get()` in rules is billed
 * and slow. They also carry the session through a Firestore outage: see the
 * fallback in `resolveSession`.
 */
export async function provisionUser(params: {
  uid: string;
  phone: string;
  name?: string;
  referredBy?: string;
}): Promise<User & { isNewUser: boolean }> {
  const ref = col.users().doc(params.uid);
  const snap = await ref.get();

  if (snap.exists) {
    const existing = snap.data() as User;

    // ADMIN_PHONES wins over the stored role. It is the recovery path: the
    // owner can restore their own admin access from the App Hosting console
    // alone, with no terminal and nobody to ask.
    // Self-heal: a platform with no teacher at all cannot be administered, and
    // the owner would be locked out of their own site with no way back in
    // except a command line. If nobody holds the role, whoever is signing in
    // claims it. Once a teacher exists this never fires again.
    const role = isAdminPhone(params.phone)
      ? "admin"
      : ((await claimTeacherIfVacant(params.uid)) ?? existing.role);

    // Applying a corrected name was previously skipped for existing users, so
    // the sign-in form cheerfully accepted a name and threw it away — a
    // student trying to fix their leaderboard name had no way to.
    const name = params.name?.trim();
    const patch: Partial<User> = { lastSeenAt: Date.now() };
    if (role !== existing.role) patch.role = role;
    if (name && name !== existing.name) patch.name = name;
    if (Object.keys(patch).length > 0) await ref.update(patch);

    await ensureClaims(params.uid, role, existing.tenantId);
    return { ...existing, ...patch, role, isNewUser: false };
  }

  const role: Role = isAdminPhone(params.phone)
    ? "admin"
    : (await isFirstUser())
      ? "teacher"
      : "student";

  const user: User = {
    uid: params.uid,
    tenantId: publicEnv.tenantId,
    role,
    name:
      params.name?.trim() ||
      (role === "student" ? "New student" : role === "admin" ? "Admin" : "Teacher"),
    phone: params.phone,
    medium: "sinhala",
    devices: [],
    referralCode: newReferralCode(),
    ...(params.referredBy ? { referredBy: params.referredBy } : {}),
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
  };

  await ref.set(user);
  await ensureClaims(user.uid, user.role, user.tenantId);
  return { ...user, isNewUser: true };
}

/**
 * Is this the very first person to sign in?
 *
 * On a brand-new project that is the teacher setting up their own platform, so
 * they become the teacher automatically. Without this, becoming a teacher needs
 * the Admin SDK from a command line, which means the whole setup requires a
 * developer machine just to bootstrap one account.
 *
 * Safe because it only ever fires on a genuinely empty user collection: once
 * anyone exists, every later sign-up is a student. After that, promote from
 * Teacher console → People, or with `scripts/admin.mjs make-teacher`.
 */
async function isFirstUser(): Promise<boolean> {
  const existing = await col.users().limit(1).get();
  return existing.empty;
}

/**
 * Promotes this user to teacher if the platform has no teacher or admin.
 *
 * Covers the case `isFirstUser` cannot: an account created before that rule
 * existed, or a first sign-in that half-failed and left a student record. The
 * owner would otherwise be permanently locked out of their own teacher console
 * with no browser-only way back.
 *
 * Runs in a transaction so two simultaneous sign-ins on an empty platform
 * cannot both claim the role. Returns the new role, or null if a teacher
 * already existed and nothing changed.
 *
 * Single-field `in` query, so it needs no composite index. Phase 4
 * multi-tenancy will have to scope this by tenantId and add one.
 */
async function claimTeacherIfVacant(uid: string): Promise<Role | null> {
  return adminDb().runTransaction(async (tx) => {
    const staff = await tx.get(
      col.users().where("role", "in", ["teacher", "admin"]).limit(1),
    );
    if (!staff.empty) return null;

    const ref = col.users().doc(uid);
    const snap = await tx.get(ref);
    if (!snap.exists) return null;

    tx.update(ref, { role: "teacher" });
    return "teacher" as Role;
  });
}

/** Writes claims only when they differ — every set costs a token refresh. */
async function ensureClaims(uid: string, role: Role, tenantId: string): Promise<void> {
  const record = await adminAuth().getUser(uid);
  const current = record.customClaims ?? {};
  if (current.role === role && current.tenantId === tenantId) return;
  await adminAuth().setCustomUserClaims(uid, { ...current, role, tenantId });
}
