import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { PACK_BUNDLED_FILES } from "@/lib/content/survival-pack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves one of the pack's bundled files.
 *
 * These ship inside the deployment rather than sitting in Storage, because the
 * owner of this platform can paste Firebase rules and nothing else — a pack
 * whose contents have to be uploaded by hand is a pack that stays empty.
 *
 * The security property the signed-URL design existed for is kept, and in fact
 * tightened: there is no public path at all, and `hasAccess()` is re-checked on
 * every single request rather than once when a ten-minute link is minted. A
 * URL copied out of the browser stops working the moment access lapses.
 */
const CONTENT_TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ipynb: "application/x-ipynb+json",
  csv: "text/csv; charset=utf-8",
  ris: "application/x-research-info-systems",
  bib: "application/x-bibtex; charset=utf-8",
  pdf: "application/pdf",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ subjectId: string; name: string }> },
) {
  const { subjectId, name } = await ctx.params;

  // Matched against the manifest rather than sanitised. A name that is not one
  // of the nine known files never reaches the filesystem, so there is no path
  // to traverse out of.
  const bundled = PACK_BUNDLED_FILES.find((f) => f.name === name);
  if (!bundled) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(join(process.cwd(), "content-packs", subjectId, name));
  } catch {
    // The subject id is part of the path, so a product that has no bundled
    // folder lands here rather than 500ing. The pack page shows the slot as
    // "coming soon" in that case.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const extension = name.split(".").pop() ?? "";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": CONTENT_TYPES[extension] ?? "application/octet-stream",
      "content-disposition": `attachment; filename="${name}"`,
      "content-length": String(bytes.byteLength),
      // Never cached by a proxy: the response is gated per user.
      "cache-control": "private, no-store",
    },
  });
}
