import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createParentLink, revokeParentLinks } from "@/lib/auth/parent-link";

export const runtime = "nodejs";

const bodySchema = z.object({ action: z.enum(["create", "revoke"]) });

/** Lets a signed-in student mint or revoke their own parent view link. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (body.action === "revoke") {
    await revokeParentLinks(user.uid);
    return NextResponse.json({ ok: true });
  }

  const url = await createParentLink(user.uid);
  return NextResponse.json({ ok: true, url });
}
