import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { teacherRoute } from "@/lib/exam-pack/guard";
import {
  GOOGLE_STATE_COOKIE,
  getGoogleSettings,
  recordGoogleError,
  resolveClient,
  saveGoogleConnection,
} from "@/lib/google/settings";
import { exchangeCode } from "@/lib/google/oauth";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where Google sends the owner back after "Connect Google".
 *
 * Checks the state cookie, exchanges the code for a refresh token, and stores
 * it. Every outcome lands back on the Exam Pack console with a word in the URL
 * that the page turns into a sentence — never a JSON error in a browser tab.
 */
export async function GET(req: NextRequest) {
  const back = (outcome: string) => {
    const res = NextResponse.redirect(new URL(`/teacher/exam-pack?google=${outcome}`, publicEnv.appUrl));
    res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/teacher/google" });
    return res;
  };

  const gate = await teacherRoute();
  if (gate.response) return back("not_signed_in");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) {
    // The owner pressed Cancel on Google's page, or Google refused the client.
    await recordGoogleError(`Google said: ${params.get("error")}`);
    return back("declined");
  }

  const expected = req.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  const offered = params.get("state") ?? "";
  if (!expected || !sameValue(expected, offered)) return back("state_mismatch");

  const code = params.get("code");
  const client = resolveClient(await getGoogleSettings());
  if (!code || !client) return back("no_client");

  try {
    const { refreshToken, accountEmail, scopes } = await exchangeCode(client, code);
    if (!scopes.includes("https://www.googleapis.com/auth/calendar.events")) {
      // The owner unticked the calendar box on Google's consent screen.
      await recordGoogleError("Calendar permission was not granted. Connect again and allow calendar access.");
      return back("no_calendar_scope");
    }
    await saveGoogleConnection({ refreshToken, accountEmail, by: gate.user.uid });
    return back("connected");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google refused the connection";
    console.error("[google] code exchange failed", err);
    await recordGoogleError(message);
    return back("exchange_failed");
  }
}

function sameValue(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
