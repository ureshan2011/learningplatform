import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonBody, teacherRoute } from "@/lib/exam-pack/guard";
import { EXAM_PACK_ID } from "@/lib/exam-pack/config";
import { getExamPackSettings } from "@/lib/exam-pack/settings";
import {
  cancelLive,
  ensureUpcomingLives,
  resetLiveMeet,
  restoreLive,
  setLiveManualLink,
} from "@/lib/exam-pack/lives";
import { isMeetUrl } from "@/lib/exam-pack/meet";

export const runtime = "nodejs";

const liveIdSchema = z.string().startsWith(`${EXAM_PACK_ID}_`).max(120);

const bodySchema = z.discriminatedUnion("action", [
  /** Create the next two weeks now, with their Meet links — before the pack is on sale, to test. */
  z.object({ action: z.literal("prepare") }),
  z.object({ action: z.literal("cancel"), id: liveIdSchema }),
  z.object({ action: z.literal("restore"), id: liveIdSchema }),
  /** A Meet link pasted by hand — wins over Google's. `null` removes it. */
  z.object({ action: z.literal("link"), id: liveIdSchema, url: z.string().max(200).nullable() }),
  /** Throw this week's Meet away and make a new one. */
  z.object({ action: z.literal("reset"), id: liveIdSchema }),
]);

export async function POST(req: NextRequest) {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const body = parsed.data;
  const settings = await getExamPackSettings();

  switch (body.action) {
    case "prepare": {
      const lives = await ensureUpcomingLives(settings);
      return NextResponse.json({ ok: true, lives });
    }
    case "cancel":
      await cancelLive(body.id, settings);
      return NextResponse.json({ ok: true });
    case "restore":
      await restoreLive(body.id);
      await ensureUpcomingLives(settings);
      return NextResponse.json({ ok: true });
    case "link": {
      if (body.url !== null && !isMeetUrl(body.url)) {
        return NextResponse.json({ error: "not_a_meet_link" }, { status: 400 });
      }
      // The week may not have been prepared yet; make sure the document exists.
      await ensureUpcomingLives(settings);
      await setLiveManualLink(body.id, body.url);
      return NextResponse.json({ ok: true });
    }
    case "reset":
      await resetLiveMeet(body.id);
      return NextResponse.json({ ok: true });
  }
}
