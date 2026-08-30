import { NextResponse, type NextRequest } from "next/server";
import { requireTeacher } from "@/lib/auth/session";
import { listTeacherActivity, markActivitySeen } from "@/lib/payments/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The teacher's money notifications, for the console's poller. */
export async function GET() {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const activity = await listTeacherActivity(20);
  return NextResponse.json({
    ok: true,
    unseen: activity.filter((a) => !a.seen).length,
    activity,
  });
}

/** Marks everything currently visible as read. */
export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const body = (await req.json().catch(() => ({}))) as { upTo?: number };
  await markActivitySeen(body.upTo ?? Date.now());
  return NextResponse.json({ ok: true });
}
