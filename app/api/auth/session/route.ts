import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { provisionUser } from "@/lib/auth/provision";
import { registerDevice, type DeviceSignals } from "@/lib/auth/devices";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  idToken: z.string().min(10),
  name: z.string().trim().max(80).optional(),
  referredBy: z.string().trim().max(16).optional(),
  device: z.object({
    clientId: z.string().min(8).max(64),
    userAgent: z.string().max(400),
    platform: z.string().max(80).optional(),
    screen: z.string().max(40).optional(),
    timezone: z.string().max(60).optional(),
  }),
});

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
    // checkRevoked = true: a token minted before a teacher released devices
    // must not be honoured.
    const decoded = await adminAuth().verifyIdToken(parsed.idToken, true);
    uid = decoded.uid;
    phone = decoded.phone_number ?? "";
    if (!phone) {
      return NextResponse.json({ error: "phone_required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  await provisionUser({ uid, phone, name: parsed.name, referredBy: parsed.referredBy });

  const device = await registerDevice(uid, parsed.device as DeviceSignals);
  if (!device.ok) {
    return NextResponse.json(
      {
        error: "device_limit",
        message:
          "This account is already signed in on the maximum number of devices. Ask your teacher to remove an old device.",
        devices: device.devices.map((d) => ({ label: d.label, lastSeenAt: d.lastSeenAt })),
      },
      { status: 403 },
    );
  }

  const sessionCookie = await adminAuth().createSessionCookie(parsed.idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  const res = NextResponse.json({ ok: true, isNewDevice: device.isNew });
  res.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return res;
}

/** Sign out on this device only. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
