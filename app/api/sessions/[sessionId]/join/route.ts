import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { registerStudent } from "@/lib/zoom/meetings";
import { createSdkSignature } from "@/lib/zoom/signature";
import { maskPhone } from "@/lib/phone";
import { zoomConfigured } from "@/lib/features";
import type { ClassSession } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /**
   * The client's own judgement of whether it can run the embedded Zoom SDK.
   * Advisory only — it selects a delivery mode, it never affects access.
   */
  preferHls: z.boolean().default(false),
});

/**
 * Mints a student's way into a live class.
 *
 * Everything that gates revenue converges here: subscription check, then a
 * per-student Zoom registrant, then a short-lived SDK signature. No join URL
 * is ever stored on the session document where a student could read it.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let preferHls = false;
  try {
    ({ preferHls } = bodySchema.parse(await req.json().catch(() => ({}))));
  } catch {
    preferHls = false;
  }

  const sessionSnap = await col.sessions().doc(sessionId).get();
  if (!sessionSnap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = sessionSnap.data() as ClassSession;

  if (session.state === "cancelled") {
    return NextResponse.json({ error: "cancelled" }, { status: 409 });
  }

  const access = await hasAccess(user.uid, session.subjectId);
  if (!access.allowed) {
    return NextResponse.json(
      { error: "forbidden", reason: access.reason, subjectId: session.subjectId },
      { status: 403 },
    );
  }

  // Zoom not connected yet: say so plainly rather than throwing a 500 that
  // looks like a broken class.
  if (!zoomConfigured() && !session.hlsUrl) {
    return NextResponse.json(
      { error: "not_configured", feature: "zoom" },
      { status: 503 },
    );
  }

  // Mobile browsers cannot reliably run the embedded Meeting SDK, and the
  // simulcast is the better experience there anyway: less data, no app switch,
  // and the Live Arena sits beside the video instead of behind it.
  if (preferHls || !session.zoomMeetingId || !zoomConfigured()) {
    if (!session.hlsUrl) {
      return NextResponse.json({ error: "stream_not_ready" }, { status: 409 });
    }
    return NextResponse.json({
      mode: "hls" as const,
      hlsUrl: session.hlsUrl,
      delaySeconds: session.simulcastDelaySeconds ?? 25,
      watermark: watermarkFor(user.name, user.phone),
    });
  }

  const joinUrl = await getOrCreateRegistrantUrl({
    sessionId,
    meetingId: session.zoomMeetingId,
    uid: user.uid,
    name: user.name,
    phone: user.phone,
  });

  const { signature, sdkKey } = await createSdkSignature({
    meetingNumber: session.zoomMeetingId,
    role: 0,
  });

  return NextResponse.json({
    mode: "zoom" as const,
    meetingNumber: session.zoomMeetingId,
    signature,
    sdkKey,
    joinUrl,
    userName: `${user.name} | ${maskPhone(user.phone)}`,
    watermark: watermarkFor(user.name, user.phone),
  });
}

/**
 * One Zoom registrant per student per session, cached.
 *
 * Re-registering on every page refresh would burn Zoom's rate limit during the
 * five minutes when the whole class is trying to get in at once.
 */
async function getOrCreateRegistrantUrl(params: {
  sessionId: string;
  meetingId: string;
  uid: string;
  name: string;
  phone: string;
}): Promise<string> {
  const ref = adminDb().collection("registrants").doc(`${params.sessionId}_${params.uid}`);
  const snap = await ref.get();
  const cached = snap.data() as { joinUrl?: string } | undefined;
  if (cached?.joinUrl) return cached.joinUrl;

  const registrant = await registerStudent({
    meetingId: params.meetingId,
    studentName: params.name,
    maskedPhone: maskPhone(params.phone),
    // The webhook reads our uid back out of this address to record attendance.
    email: `${params.uid}@students.invalid`,
  });

  await ref.set({
    sessionId: params.sessionId,
    uid: params.uid,
    joinUrl: registrant.join_url,
    registrantId: registrant.registrant_id ?? registrant.id,
    createdAt: Date.now(),
  });

  return registrant.join_url;
}

/**
 * Identity burned into the player overlay.
 *
 * It does not stop a screen recording — nothing in a browser does. It makes any
 * leaked recording point at the account that leaked it, which is what actually
 * changes behaviour.
 */
function watermarkFor(name: string, phone: string): string {
  return `${name} · ${maskPhone(phone)}`;
}
