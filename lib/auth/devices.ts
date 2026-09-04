import "server-only";

import { createHash } from "node:crypto";
import { adminAuth, adminDb, col } from "@/lib/firebase/admin";
import {
  DEVICE_SWAP_COOLDOWN_MS,
  MAX_DEVICES_PER_USER,
  type BoundDevice,
  type User,
} from "@/lib/types";

/**
 * Device binding.
 *
 * One paid account shared across a study group is the single largest revenue
 * leak in Sri Lankan online tuition. Capping an account to a small number of
 * devices does not stop a determined sharer, but it makes casual sharing —
 * which is the overwhelming majority — inconvenient enough to stop.
 *
 * We deliberately do NOT do invasive browser fingerprinting. We hash one
 * random id the browser generated for itself, together with the user's id.
 * That is enough to distinguish "my phone" from "my friend's phone" while
 * collecting nothing sensitive.
 */

/**
 * How many device bindings a teacher or admin keeps before the oldest is
 * dropped. Not a limit they can hit — it only stops the list growing forever
 * as they test from new browsers.
 */
const STAFF_DEVICE_SOFT_CAP = 10;

export interface DeviceSignals {
  /** Random id the client generates once and persists in localStorage. */
  clientId: string;
  userAgent: string;
  platform?: string;
  screen?: string;
  timezone?: string;
}

/**
 * Identifies a browser, from its own random id and nothing else.
 *
 * This used to mix in the user agent, the platform string and the screen
 * dimensions, and that was the second half of the "it keeps logging me out"
 * bug. Every one of those changes underneath a student who has not touched
 * anything: Chrome ships a new major version roughly monthly and rewrites its
 * UA string each time, an Android or iOS update rewrites it again, and
 * `screen.width`/`height` swap over on rotation in several mobile browsers. Any
 * of those minted a brand-new "device", ate a slot, and — at the old cap of two
 * — locked the student out behind a message telling them to go and find their
 * teacher. They had not changed device at all; their phone had simply updated.
 *
 * The clientId alone is stable for the life of the browser profile, which is
 * exactly the thing we mean by "a device". The volatile signals are still
 * collected, but only to write a label a human can read in the console.
 */
export function computeDeviceHash(uid: string, signals: DeviceSignals): string {
  return createHash("sha256").update(`${uid}|${signals.clientId}`).digest("hex").slice(0, 32);
}

/**
 * The hash this browser would have had under the old, volatile scheme.
 *
 * Kept solely so the change above does not sign out every student on the
 * deploy that ships it: their stored bindings were all computed this way, and
 * a binding nobody recognises is indistinguishable from a released device.
 * Wherever a device is looked up we accept this form too and rewrite it to the
 * stable one in place, so each browser migrates itself the first time it is
 * seen and the array never carries both.
 *
 * Safe to delete once every active student has signed in at least once after
 * that deploy — a fortnight of sessions, in practice.
 */
export function computeLegacyDeviceHash(uid: string, signals: DeviceSignals): string {
  return createHash("sha256")
    .update(
      [
        uid,
        signals.clientId,
        signals.userAgent,
        signals.platform ?? "",
        signals.screen ?? "",
        signals.timezone ?? "",
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 32);
}

/** Finds this browser among the bound devices under either hashing scheme. */
export function findBoundDevice(
  uid: string,
  signals: DeviceSignals,
  devices: BoundDevice[],
): { device: BoundDevice; isLegacy: boolean } | null {
  const current = computeDeviceHash(uid, signals);
  const exact = devices.find((d) => d.deviceHash === current);
  if (exact) return { device: exact, isLegacy: false };

  const legacy = computeLegacyDeviceHash(uid, signals);
  const stale = devices.find((d) => d.deviceHash === legacy);
  return stale ? { device: stale, isLegacy: true } : null;
}

/** Human-readable label so the teacher can tell devices apart when resetting. */
export function describeDevice(signals: DeviceSignals): string {
  const ua = signals.userAgent;
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iOS/i.test(ua)
      ? "iOS"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  return `${os} · ${browser}`;
}

export type DeviceCheck =
  | { ok: true; deviceHash: string; isNew: boolean }
  | {
      ok: false;
      reason: "device_limit";
      devices: BoundDevice[];
      /** True when the student may free the stale slot themselves, right now. */
      canSwap: boolean;
      /** When the cooldown lifts, if they may not. */
      swapAvailableAt?: number;
    };

/**
 * Registers the calling device against the user, enforcing the device cap.
 *
 * A known device refreshes its lastSeenAt. An unknown device is bound only if
 * there is room. We never silently evict the oldest device — a student whose
 * real phone gets bumped by a friend's would blame the platform — but the
 * caller is told whether the student is allowed to evict it deliberately, and
 * `swapOldestDevice` is what does it.
 */
export async function registerDevice(
  uid: string,
  signals: DeviceSignals,
): Promise<DeviceCheck> {
  const deviceHash = computeDeviceHash(uid, signals);
  const label = describeDevice(signals);
  const ref = col.users().doc(uid);
  const now = Date.now();

  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("USER_NOT_FOUND");

    const user = snap.data() as User;
    const devices = user.devices ?? [];
    const found = findBoundDevice(uid, signals, devices);

    if (found) {
      // Rewrites a legacy hash to the stable one, and refreshes the label —
      // the same browser reports a new OS after an update, and a stale label is
      // what makes the teacher free the wrong slot.
      const updated = devices.map((d) =>
        d.deviceHash === found.device.deviceHash
          ? { ...d, deviceHash, label, lastSeenAt: now }
          : d,
      );
      tx.update(ref, { devices: updated, lastSeenAt: now });
      return { ok: true as const, deviceHash, isNew: false };
    }

    // Staff are never capped. The cap exists to stop one paid account being
    // shared around a study group; the teacher owns the platform, has nothing
    // to gain by sharing with themselves, and has to be able to open the
    // console on a laptop, a phone and a second browser at once to test what
    // students see. Locking the owner out of their own site protects nobody —
    // and there is no one above them to ask for a device reset.
    const isStaff = user.role === "teacher" || user.role === "admin";

    if (!isStaff && devices.length >= MAX_DEVICES_PER_USER) {
      const swapAvailableAt = (user.lastDeviceSwapAt ?? 0) + DEVICE_SWAP_COOLDOWN_MS;
      return {
        ok: false as const,
        reason: "device_limit" as const,
        devices,
        canSwap: now >= swapAvailableAt,
        swapAvailableAt,
      };
    }

    // A teacher testing across many browsers would otherwise grow this array
    // without limit, so their oldest binding is dropped rather than kept.
    const kept =
      isStaff && devices.length >= STAFF_DEVICE_SOFT_CAP
        ? [...devices].sort((a, b) => b.lastSeenAt - a.lastSeenAt).slice(0, STAFF_DEVICE_SOFT_CAP - 1)
        : devices;

    const device: BoundDevice = { deviceHash, label, firstSeenAt: now, lastSeenAt: now };
    tx.update(ref, { devices: [...kept, device], lastSeenAt: now });
    return { ok: true as const, deviceHash, isNew: true };
  });
}

export type SwapResult =
  | { ok: true; deviceHash: string; releasedLabel: string }
  | { ok: false; reason: "cooldown"; swapAvailableAt: number }
  | { ok: false; reason: "no_devices" };

/**
 * Student-initiated: drop the least-recently-used device and bind this one.
 *
 * The old flow ended at "ask your teacher — Teacher console → Device reset",
 * a screen the student cannot open, about a person they may not be able to
 * reach before class starts. Their phone broke; that should not need a support
 * conversation. The cooldown is what keeps this from becoming the sharing hole
 * the cap exists to close: one swap a week is a broken phone, seven is a study
 * group.
 *
 * Releasing the old slot deliberately does NOT revoke refresh tokens — that
 * would sign the student out of the devices they are keeping. The released
 * browser loses its session through the device cookie check in `resolveSession`.
 */
export async function swapOldestDevice(uid: string, signals: DeviceSignals): Promise<SwapResult> {
  const deviceHash = computeDeviceHash(uid, signals);
  const label = describeDevice(signals);
  const ref = col.users().doc(uid);
  const now = Date.now();

  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("USER_NOT_FOUND");

    const user = snap.data() as User;
    const devices = user.devices ?? [];
    if (devices.length === 0) return { ok: false as const, reason: "no_devices" as const };

    const swapAvailableAt = (user.lastDeviceSwapAt ?? 0) + DEVICE_SWAP_COOLDOWN_MS;
    if (now < swapAvailableAt) {
      return { ok: false as const, reason: "cooldown" as const, swapAvailableAt };
    }

    const [oldest] = [...devices].sort((a, b) => a.lastSeenAt - b.lastSeenAt);
    const kept = devices.filter((d) => d.deviceHash !== oldest.deviceHash);

    tx.update(ref, {
      devices: [...kept, { deviceHash, label, firstSeenAt: now, lastSeenAt: now }],
      lastDeviceSwapAt: now,
      lastSeenAt: now,
    });
    return { ok: true as const, deviceHash, releasedLabel: oldest.label };
  });
}

/**
 * Teacher action: free one device slot.
 *
 * Only that browser loses its session — `resolveSession` checks the device
 * cookie against this array. This used to call `revokeRefreshTokens`, which
 * signed the student out of *every* device including the one they were holding,
 * so "free my broken phone's slot" also kicked them off the phone they had just
 * bought. Use `revokeAllSessions` when signing out everywhere is the intent.
 */
export async function releaseDevice(uid: string, deviceHash: string): Promise<void> {
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("USER_NOT_FOUND");

  const user = snap.data() as User;
  await ref.update({
    devices: (user.devices ?? []).filter((d) => d.deviceHash !== deviceHash),
  });
}

/**
 * Sign an account out everywhere, right now.
 *
 * Both halves are required. `sessionsValidFrom` is what `resolveSession`
 * checks; `revokeRefreshTokens` is what stops the browser's still-valid
 * Firebase refresh token being used by `SessionKeeper` to mint a fresh cookie
 * seconds later. Doing only the first is a revocation that undoes itself.
 */
export async function revokeAllSessions(uid: string): Promise<void> {
  await col.users().doc(uid).update({ sessionsValidFrom: Date.now() });
  await adminAuth().revokeRefreshTokens(uid);
}
