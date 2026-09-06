import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth/session";
import { setPredictedPaperPublished } from "@/lib/content/predicted-paper-settings";

export const runtime = "nodejs";

const bodySchema = z.object({ published: z.boolean() });

/**
 * Flips the whole-paper publish switch for the 2027 predicted paper. Never
 * auto-published — this is the one write that makes it visible to students.
 */
export async function POST(req: NextRequest) {
  let uid: string;
  try {
    ({ uid } = await requireTeacher());
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

  const settings = await setPredictedPaperPublished(body.published, uid);
  return NextResponse.json({ ok: true, settings });
}
