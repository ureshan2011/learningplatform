import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth/session";
import { ensureCampusMatch } from "@/lib/campus-match/ensure";
import { setCampusMatchPublished } from "@/lib/campus-match/settings";
import { dataFreshness } from "@/lib/campus-match/data";

export const runtime = "nodejs";

const bodySchema = z.object({ published: z.boolean() });

/**
 * Puts this cycle's Campus Match on sale, or takes it off.
 *
 * The one write that lets a student be charged for a report, so it refuses to
 * publish a dataset old enough that a newer round has probably been released —
 * the report would quote a cut-off the student could already look up for real.
 * Unpublishing is never refused: taking something off sale must always work.
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

  if (body.published && dataFreshness().stale) {
    return NextResponse.json({ error: "stale_data" }, { status: 409 });
  }

  await ensureCampusMatch();
  const settings = await setCampusMatchPublished(body.published, uid);
  return NextResponse.json({ ok: true, settings });
}
