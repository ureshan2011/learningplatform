import { NextResponse } from "next/server";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { deleteContentFile } from "@/lib/content/storage";
import type { ContentItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Removes a note or past paper — the Storage file and its Firestore record together. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ contentId: string }> }) {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const { contentId } = await ctx.params;
  const snap = await col.content().doc(contentId).get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const item = snap.data() as ContentItem;
  await deleteContentFile(item.storagePath);
  await col.content().doc(contentId).delete();

  return NextResponse.json({ ok: true });
}
