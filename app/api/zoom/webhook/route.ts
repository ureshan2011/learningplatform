import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { col, attendanceId } from "@/lib/firebase/admin";
import { requireServerEnv } from "@/lib/env";
import type { AttendanceRecord, ClassSession } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Zoom event webhook.
 *
 * Attendance is derived here rather than from anything the client reports,
 * because attendance feeds the parent dashboard and XP — both of which
 * students have every incentive to inflate.
 */
export async function POST(req: NextRequest) {
  // The signature covers the exact bytes Zoom sent, so read the raw body.
  const raw = await req.text();
  const secret = requireServerEnv("ZOOM_WEBHOOK_SECRET_TOKEN");

  const timestamp = req.headers.get("x-zm-request-timestamp") ?? "";
  const signature = req.headers.get("x-zm-signature") ?? "";

  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${raw}`).digest("hex")}`;
  if (!safeEqual(expected, signature)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  const body = JSON.parse(raw) as {
    event: string;
    payload: Record<string, unknown> & { plainToken?: string };
  };

  // Zoom validates the endpoint by challenging it once at setup.
  if (body.event === "endpoint.url_validation") {
    const plainToken = body.payload.plainToken ?? "";
    return NextResponse.json({
      plainToken,
      encryptedToken: createHmac("sha256", secret).update(plainToken).digest("hex"),
    });
  }

  try {
    await handleEvent(body.event, body.payload);
  } catch (err) {
    // Never 500 back to Zoom for a handler bug — it will retry the same
    // failing event and the log is more useful than the retry.
    console.error("[zoom] handler failed", body.event, err);
  }

  return NextResponse.json({ ok: true });
}

type MeetingPayload = {
  object?: {
    id?: string | number;
    participant?: { user_id?: string; user_name?: string; email?: string; join_time?: string; leave_time?: string };
    recording_files?: Array<{ file_type?: string; play_url?: string; download_url?: string }>;
  };
};

async function handleEvent(event: string, payload: Record<string, unknown>) {
  const p = payload as MeetingPayload;
  const meetingId = String(p.object?.id ?? "");
  if (!meetingId) return;

  const session = await findSessionByMeeting(meetingId);
  if (!session) return;

  switch (event) {
    case "meeting.started":
      await col.sessions().doc(session.id).update({ state: "live" });
      break;

    case "meeting.ended":
      await col.sessions().doc(session.id).update({ state: "ended" });
      break;

    case "meeting.participant_joined": {
      const uid = uidFromParticipant(p);
      if (!uid) return;
      const joinedAt = Date.parse(p.object?.participant?.join_time ?? "") || Date.now();
      const ref = col.attendance().doc(attendanceId(session.id, uid));
      const record: Partial<AttendanceRecord> = {
        sessionId: session.id,
        uid,
        tenantId: session.tenantId,
        joinedAt,
      };
      await ref.set(record, { merge: true });
      break;
    }

    case "meeting.participant_left": {
      const uid = uidFromParticipant(p);
      if (!uid) return;
      const leftAt = Date.parse(p.object?.participant?.leave_time ?? "") || Date.now();
      const ref = col.attendance().doc(attendanceId(session.id, uid));
      const snap = await ref.get();
      const existing = snap.data() as AttendanceRecord | undefined;
      const joinedAt = existing?.joinedAt ?? leftAt;

      // Students drop and rejoin constantly on Sri Lankan mobile data, so
      // accumulate minutes across sessions rather than overwriting them.
      const deltaMinutes = Math.max(0, Math.round((leftAt - joinedAt) / 60_000));
      await ref.set(
        {
          sessionId: session.id,
          uid,
          tenantId: session.tenantId,
          leftAt,
          minutesPresent: FieldValue.increment(deltaMinutes) as unknown as number,
        },
        { merge: true },
      );
      break;
    }

    case "recording.completed": {
      const file = p.object?.recording_files?.find((f) => f.file_type === "MP4");
      if (!file?.play_url) return;
      // Stored for the teacher to publish. Zoom cloud storage is small and
      // billed, so the replay pipeline later moves this to YouTube unlisted.
      await col.sessions().doc(session.id).update({
        replayUrl: file.play_url,
        replayReadyAt: Date.now(),
      });
      break;
    }
  }
}

async function findSessionByMeeting(meetingId: string): Promise<ClassSession | null> {
  const snap = await col.sessions().where("zoomMeetingId", "==", meetingId).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as ClassSession;
}

/**
 * Recovers our uid from the Zoom registrant email.
 *
 * We register students with `{uid}@students.invalid`, so the participant's
 * email carries the mapping back without a lookup table.
 */
function uidFromParticipant(p: MeetingPayload): string | null {
  const email = p.object?.participant?.email ?? "";
  const match = email.match(/^([A-Za-z0-9_-]{6,128})@students\.invalid$/);
  return match ? match[1] : null;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
