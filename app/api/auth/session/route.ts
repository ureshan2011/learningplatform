import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { provisionUser } from "@/lib/auth/provision";
import {
  computeDeviceHash,
  findBoundDevice,
  registerDevice,
  swapOldestDevice,
  type DeviceSignals,
} from "@/lib/auth/devices";
import {
  DEVICE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  SESSION_RENEW_AFTER_MS,
} from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

const deviceSchema = z.object({
  clientId: z.string().min(8).max(64),
  userAgent: z.string().max(400),
  platform: z.string().max(80).optional(),
  screen: z.string().max(40).optional(),
  timezone: z.string().max(60).optional(),
});

const bodySchema = z.object({
  idToken: z.string().min(10),
  name: z.string().trim().max(80).optional(),
  referredBy: z.string().trim().max(16).optional(),
  /**
   * Set by the sign-in page after the student confirms "sign out my oldest
   * device and use this one". Never assumed — evicting a device the student
   * did not choose to lose is how a shared account silently kicks its owner.
   */
  swapDevice: z.boolean().optional(),
  device: deviceSchema,
});

const refreshSchema = z.object({ idToken: z.string().min(10), device: deviceSchema });

/** One place that decides how the session cookie is written, so POST and PUT cannot drift. */
function setSessionCookies(
  res: NextResponse,
  sessionCookie: string,
  deviceHash: string,
): NextResponse {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
  res.cookies.set(SESSION_COOKIE, sessionCookie, options);
  // Not httpOnly-sensitive data — it is a hash the browser could recompute
  // anyway — but it is set here rather than by script so it cannot drift out of
  // step with the session cookie beside it.
  res.cookies.set(DEVICE_COOKIE, deviceHash, options);
  return res;
}

/**
 * Exchanges a Firebase ID token (from phone OTP) for an httpOnly session
 * cookie, provisioning the user and binding the device in the same round trip.
 *
 * The device check happens here rather than at join time so a student on a
 * third device finds out at sign-in, not thirty seconds before class starts.
 */
export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let uid: string;
  let phone: string;
  try {
    // checkRevoked = true is right here and nowhere else: this runs once per
    // sign-in, not once per page view, so the round trip is affordable — and a
    // token minted before a teacher signed the account out must not be honoured.
    const decoded = await adminAuth().verifyIdToken(parsed.idToken, true);
    uid = decoded.uid;
    phone = decoded.phone_number ?? "";
    if (!phone) {
      return NextResponse.json({ error: "phone_required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const user = await provisionUser({ uid, phone, name: parsed.name, referredBy: parsed.referredBy });
  const signals = parsed.device as DeviceSignals;

  let deviceHash: string;
  let isNewDevice: boolean;
  let releasedLabel: string | undefined;

  if (parsed.swapDevice) {
    const swap = await swapOldestDevice(uid, signals);
    if (!swap.ok) {
      return NextResponse.json(
        swap.reason === "cooldown"
          ? { error: "swap_cooldown", swapAvailableAt: swap.swapAvailableAt }
          : { error: "invalid_request" },
        { status: swap.reason === "cooldown" ? 429 : 400 },
      );
    }
    deviceHash = swap.deviceHash;
    isNewDevice = true;
    releasedLabel = swap.releasedLabel;
  } else {
    const device = await registerDevice(uid, signals);
    if (!device.ok) {
      // The student gets the full picture rather than "ask your teacher": which
      // devices are holding the slots, when each was last used, and — usually —
      // a button to free the stale one themselves.
      return NextResponse.json(
        {
          error: "device_limit",
          canSwap: device.canSwap,
          swapAvailableAt: device.swapAvailableAt,
          devices: device.devices
            .map((d) => ({ label: d.label, lastSeenAt: d.lastSeenAt }))
            .sort((a, b) => b.lastSeenAt - a.lastSeenAt),
        },
        { status: 403 },
      );
    }
    deviceHash = device.deviceHash;
    isNewDevice = device.isNew;
  }

  const sessionCookie = await adminAuth().createSessionCookie(parsed.idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  const res = NextResponse.json({
    ok: true,
    isNewDevice,
    isNewUser: user.isNewUser,
    role: user.role,
    name: user.name,
    releasedLabel,
  });
  return setSessionCookies(res, sessionCookie, deviceHash);
}

/**
 * Silent renewal — the reason students stop being asked to sign in.
 *
 * The browser's Firebase refresh token does not expire, so it can mint a fresh
 * ID token forever without another SMS. `SessionKeeper` sends one here roughly
 * once a day and gets a new 14-day cookie back. Nothing is billed, nothing is
 * typed, and a student who opens the site even once a fortnight never sees the
 * OTP screen again.
 *
 * Renewal deliberately cannot create anything. It will not provision a user, it
 * will not bind a new device, and it will not resurrect a device the teacher
 * just released — that last one is what stops a released browser quietly
 * re-registering itself on the next heartbeat.
 */
export async function PUT(req: NextRequest) {
  let parsed: z.infer<typeof refreshSchema>;
  try {
    parsed = refreshSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(parsed.idToken, true);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const snap = await col.users().doc(uid).get();
  if (!snap.exists) return NextResponse.json({ error: "no_account" }, { status: 401 });
  const user = snap.data() as User;
  if (user.disabled) return NextResponse.json({ error: "account_disabled" }, { status: 403 });

  const signals = parsed.device as DeviceSignals;
  const devices = user.devices ?? [];
  const bound = findBoundDevice(uid, signals, devices);
  if (!bound) {
    return NextResponse.json({ error: "device_released" }, { status: 403 });
  }

  const deviceHash = computeDeviceHash(uid, signals);
  if (bound.isLegacy) {
    // First renewal since device hashing became stable. Rewrite this browser's
    // binding in place rather than treating an unrecognised hash as a released
    // device, which would sign out every existing student on one deploy.
    await col
      .users()
      .doc(uid)
      .update({
        devices: devices.map((d) =>
          d.deviceHash === bound.device.deviceHash ? { ...d, deviceHash } : d,
        ),
      })
      .catch(() => {});
  }

  const sessionCookie = await adminAuth().createSessionCookie(parsed.idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  // Cheap liveness signal for the People directory. Fire-and-forget: a failed
  // write here must never cost the student their renewal.
  col
    .users()
    .doc(uid)
    .update({ lastSeenAt: Date.now() })
    .catch(() => {});

  const res = NextResponse.json({ ok: true, renewAfterMs: SESSION_RENEW_AFTER_MS });
  return setSessionCookies(res, sessionCookie, deviceHash);
}

/** Sign out on this device only. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(DEVICE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
