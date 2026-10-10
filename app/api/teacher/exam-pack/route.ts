import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonBody, teacherRoute } from "@/lib/exam-pack/guard";
import { ensureExamPack } from "@/lib/exam-pack/ensure";
import {
  getExamPackSettings,
  saveExamPackPrice,
  saveLiveSchedule,
  setExamPackEnabled,
} from "@/lib/exam-pack/settings";
import { rescheduleLives } from "@/lib/exam-pack/lives";
import { isWallTime } from "@/lib/exam-pack/time";
import { getPayHereConfig } from "@/lib/payments/records";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("disable") }),
  z.object({
    action: z.literal("price"),
    feeLKR: z.number().int().min(100).max(1_000_000),
    accessDays: z.number().int().min(30).max(1095),
  }),
  z.object({
    action: z.literal("schedule"),
    enabled: z.boolean(),
    weekday: z.number().int().min(0).max(6),
    time: z.string().refine(isWallTime, "HH:MM"),
    durationMinutes: z.number().int().min(15).max(240),
    title: z.string().trim().min(3).max(120),
  }),
]);

/**
 * The Exam Pack's console controls: put it on sale, take it off, change the
 * price, change the weekly live.
 *
 * Putting it on sale is refused while card payment is not connected. The pack
 * is sold by PayHere only, so "on sale" with no card checkout would be a buy
 * button that cannot take money — the one state this switch must never reach.
 * Taking it off sale is never refused.
 */
export async function POST(req: NextRequest) {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const body = parsed.data;

  await ensureExamPack();

  switch (body.action) {
    case "enable": {
      const payhere = await getPayHereConfig();
      if (!payhere.configured) {
        return NextResponse.json({ error: "payhere_not_configured" }, { status: 409 });
      }
      const settings = await setExamPackEnabled(true, gate.user.uid);
      return NextResponse.json({ ok: true, settings, payhereMode: payhere.mode });
    }
    case "disable": {
      const settings = await setExamPackEnabled(false, gate.user.uid);
      return NextResponse.json({ ok: true, settings });
    }
    case "price": {
      await saveExamPackPrice({ feeLKR: body.feeLKR, accessDays: body.accessDays });
      return NextResponse.json({ ok: true });
    }
    case "schedule": {
      await saveLiveSchedule(
        {
          enabled: body.enabled,
          weekday: body.weekday,
          time: body.time,
          durationMinutes: body.durationMinutes,
          title: body.title,
        },
        gate.user.uid,
      );
      // Weeks already prepared at the old time come off the owner's calendar;
      // the next view prepares them again at the new one.
      const cleared = await rescheduleLives(await getExamPackSettings());
      return NextResponse.json({ ok: true, cleared });
    }
  }
}
