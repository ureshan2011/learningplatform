import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { createClassMeeting, configureSimulcast } from "@/lib/zoom/meetings";
import { publicEnv } from "@/lib/env";
import { zoomConfigured } from "@/lib/features";
import type { ClassSession, SessionSecrets } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  subjectId: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(140),
  topic: z.string().trim().min(1).max(140),
  /**
   * Syllabus unit (and optionally the competency level) this class teaches.
   * Optional so nothing about scheduling changes for a teacher who ignores
   * them, but setting them is what puts a "join this class" button beside
   * that exact topic on the public syllabus page.
   */
  unitId: z.string().trim().max(64).optional(),
  lessonId: z.string().trim().max(16).optional(),
  startsAt: z.number().int().positive(),
  durationMinutes: z.number().int().min(15).max(300).default(90),
  /** HLS URL of the simulcast, for mobile and overflow students. */
  hlsUrl: z.string().url().optional(),
  /** RTMP target so Zoom mirrors the class to YouTube Live. */
  rtmp: z
    .object({ streamUrl: z.string().url(), streamKey: z.string().min(1) })
    .optional(),
});

/**
 * Schedules a class: creates the Zoom meeting and, when RTMP details are
 * supplied, points its simulcast at YouTube Live.
 *
 * The simulcast is what lets a class grow past the Zoom licence — the paid
 * seats sit in Zoom, everyone else watches the mirror inside our own player.
 */
export async function POST(req: NextRequest) {
  if (!zoomConfigured()) {
    return NextResponse.json(
      { error: "not_configured", feature: "zoom" },
      { status: 503 },
    );
  }

  let tenantId: string;
  try {
    ({ tenantId } = await requireTeacher());
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const ref = col.sessions().doc();
  let meeting;
  try {
    meeting = await createClassMeeting({
      topic: body.title,
      startsAt: body.startsAt,
      durationMinutes: body.durationMinutes,
    });
  } catch (err) {
    console.error("[zoom] meeting creation failed", err);
    return NextResponse.json({ error: "zoom_failed" }, { status: 502 });
  }

  if (body.rtmp) {
    try {
      await configureSimulcast({
        meetingId: String(meeting.id),
        streamUrl: body.rtmp.streamUrl,
        streamKey: body.rtmp.streamKey,
        pageUrl: `${publicEnv.appUrl}/live/${ref.id}`,
      });
    } catch (err) {
      // A failed simulcast must not lose the meeting we just created — the
      // class can still run on Zoom while the teacher fixes the stream key.
      console.error("[zoom] simulcast config failed", err);
    }
  }

  const session: ClassSession = {
    id: ref.id,
    tenantId,
    subjectId: body.subjectId,
    title: body.title,
    topic: body.topic,
    startsAt: body.startsAt,
    durationMinutes: body.durationMinutes,
    state: "scheduled",
    ...(body.unitId ? { unitId: body.unitId } : {}),
    ...(body.lessonId ? { lessonId: body.lessonId } : {}),
    zoomMeetingId: String(meeting.id),
    ...(body.hlsUrl ? { hlsUrl: body.hlsUrl } : {}),
    simulcastDelaySeconds: 25,
    createdAt: Date.now(),
  };

  const secrets: SessionSecrets = {
    sessionId: ref.id,
    zoomStartUrl: meeting.start_url,
    ...(body.rtmp ? { rtmpStreamKey: body.rtmp.streamKey } : {}),
  };

  // The session document is student-readable (they need the timetable); the
  // host start URL and stream key are not, so they go to a collection no
  // client rule grants access to.
  await Promise.all([
    ref.set(session),
    adminDb().collection("sessionSecrets").doc(ref.id).set(secrets),
  ]);

  return NextResponse.json({ ok: true, sessionId: ref.id, startUrl: meeting.start_url });
}
