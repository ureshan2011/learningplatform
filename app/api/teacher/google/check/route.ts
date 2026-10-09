import { NextResponse } from "next/server";
import { teacherRoute } from "@/lib/exam-pack/guard";
import { checkCalendarAccess } from "@/lib/google/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Check the connection" — one harmless Calendar read, so the owner knows before Saturday, not during it. */
export async function POST() {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  try {
    await checkCalendarAccess();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Google did not answer" },
      { status: 502 },
    );
  }
}
