import { NextResponse, type NextRequest } from "next/server";
import { col, adminStorage } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { recordQuietly } from "@/lib/activity/record";
import type { ContentItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a note or past paper for the in-app reader.
 *
 * The sibling `download` route hands back a ten-minute signed URL for the
 * browser to follow. This one never mints a URL at all — the bytes come
 * through the server and the file's location in the bucket is never named to
 * the client. That is a strictly stronger version of the property
 * `lib/content/storage.ts` exists to protect, and it is also what makes the
 * reader work: a signed Storage URL fetched from our own origin would need
 * CORS configured on the bucket, which is one more thing to set up in a
 * console and one more thing to get silently wrong.
 *
 * Access is `hasAccess()`, the single check (CLAUDE.md rule 1), exactly as the
 * download route does it. Public items short-circuit ahead of the session read
 * for the same reason they do there: the free library has to work.
 *
 * `inline` rather than `attachment`: this response is read in the page, not
 * saved. The download route is still what a student uses to keep a copy.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await ctx.params;

  const snap = await col.content().doc(contentId).get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const item = snap.data() as ContentItem;

  let user = null;
  if (!item.isPublic) {
    user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const access = await hasAccess(user.uid, item.subjectId);
    if (!access.allowed) {
      return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
    }
  }

  const file = adminStorage().bucket().file(item.storagePath);
  const [exists] = await file.exists();
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [meta] = await file.getMetadata();
  const total = Number(meta.size ?? 0);
  const contentType = meta.contentType ?? "application/octet-stream";

  // The reader asks for byte ranges: pdf.js fetches a PDF's trailer before its
  // first page, so honouring Range is what stops a 12MB paper being pulled down
  // in full before anything renders on a phone.
  const range = parseRange(req.headers.get("range"), total);

  const stream = file.createReadStream(range ? { start: range.start, end: range.end } : undefined);

  // Recorded once per opening, not per byte range — a reader scrolling through
  // a paper must not write a row per page. Never allowed to fail the read.
  if (user && !range) {
    recordQuietly(user, {
      kind: "download",
      path: `/subjects/${item.subjectId}`,
      at: Date.now(),
      label: item.title,
    });
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${encodeURIComponent(item.title)}"`,
    "Accept-Ranges": "bytes",
    // Gated bytes must never sit in a shared cache, and a signed-in student's
    // own browser re-asking costs one access check.
    "Cache-Control": "private, no-store",
  });

  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${total}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
  } else if (total > 0) {
    headers.set("Content-Length", String(total));
  }

  return new NextResponse(stream as unknown as ReadableStream, {
    status: range ? 206 : 200,
    headers,
  });
}

/**
 * `bytes=start-end`, the only form a browser or pdf.js sends. Anything else —
 * multiple ranges, a suffix range past the file, a malformed header — returns
 * null and the whole file is served, which is always a correct answer.
 */
function parseRange(header: string | null, total: number): { start: number; end: number } | null {
  if (!header || total <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;

  if (rawStart === "") {
    // A suffix range: the last N bytes, which is how pdf.js finds the trailer.
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? total - 1 : Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || start >= total || end < start) return null;
  return { start, end: Math.min(end, total - 1) };
}
