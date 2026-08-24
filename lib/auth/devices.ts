import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, col } from "@/lib/firebase/admin";
import { MAX_DEVICES_PER_USER, type BoundDevice, type User } from "@/lib/types";

/**
 * Device binding.
 *
 * One paid account shared across a study group is the single largest revenue
 * leak in Sri Lankan online tuition. Capping an account to a small number of
 * devices does not stop a determined sharer, but it makes casual sharing —
 * which is the overwhelming majority — inconvenient enough to stop.
 *
 * We deliberately do NOT do invasive browser fingerprinting. We hash coarse,
 * client-declared signals with the user's id. That is enough to distinguish
 * "my phone" from "my friend's phone" while collecting nothing sensitive.
 */

export interface DeviceSignals {
  /** Random id the client generates once and persists in localStorage. */
  clientId: string;
  userAgent: string;
  platform?: string;
  screen?: string;
  timezone?: string;
}

export function computeDeviceHash(uid: string, signals: DeviceSignals): string {
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
  | { ok: false; reason: "device_limit"; devices: BoundDevice[] };

/**
 * Registers the calling device against the user, enforcing the device cap.
 *
 * A known device refreshes its lastSeenAt. An unknown device is bound only if
 * there is room; otherwise the caller is rejected and must ask the teacher to
 * release a slot. We never silently evict the oldest device — a student whose
 * real phone gets bumped by a friend's would blame the platform, and the
 * teacher needs to see that sharing is happening.
 */
export async function registerDevice(
  uid: string,
  signals: DeviceSignals,
): Promise<DeviceCheck> {
  const deviceHash = computeDeviceHash(uid, signals);
  const ref = col.users().doc(uid);
  const now = Date.now();

  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("USER_NOT_FOUND");

    const user = snap.data() as User;
    const devices = user.devices ?? [];
    const existing = devices.find((d) => d.deviceHash === deviceHash);

    if (existing) {
      existing.lastSeenAt = now;
      tx.update(ref, { devices });
      return { ok: true as const, deviceHash, isNew: false };
    }

    if (devices.length >= MAX_DEVICES_PER_USER) {
      return { ok: false as const, reason: "device_limit" as const, devices };
    }

    const device: BoundDevice = {
      deviceHash,
      label: describeDevice(signals),
      firstSeenAt: now,
      lastSeenAt: now,
    };
    tx.update(ref, { devices: FieldValue.arrayUnion(device) });
    return { ok: true as const, deviceHash, isNew: true };
  });
}

/** Teacher action: free a device slot and force that device to sign in again. */
export async function releaseDevice(uid: string, deviceHash: string): Promise<void> {
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("USER_NOT_FOUND");

  const user = snap.data() as User;
  const devices = (user.devices ?? []).filter((d) => d.deviceHash !== deviceHash);
  await ref.update({ devices });

  // Revoking refresh tokens invalidates every session cookie for this user,
  // because getSessionUser verifies with checkRevoked = true.
  await adminAuth().revokeRefreshTokens(uid);
}
