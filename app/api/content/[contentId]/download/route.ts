import { NextResponse, type NextRequest } from "next/server";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { signedContentUrl, publicContentUrl } from "@/lib/content/r2";
import { r2Configured } from "@/lib/features";
import type { ContentItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issues a download URL for a note or past paper.
 *
 * Gated content never has a stable URL: the client asks here, we check the
 * subscription, and hand back a link that expires in minutes.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await ctx.params;

  const snap = await col.content().doc(contentId).get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const item = snap.data() as ContentItem;

  if (item.isPublic) {
    return NextResponse.json({ url: publicContentUrl(item.r2Key), public: true });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const access = await hasAccess(user.uid, item.subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  // Access checks run first: whether a student is entitled does not depend on
  // whether file storage happens to be connected.
  if (!r2Configured()) {
    return NextResponse.json({ error: "not_configured", feature: "r2" }, { status: 503 });
  }

  return NextResponse.json({ url: await signedContentUrl(item.r2Key), public: false });
}
