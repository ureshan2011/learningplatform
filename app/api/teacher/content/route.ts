import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import type { ContentItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a note or past paper after the teacher's browser has already
 * uploaded the file straight to Storage (see `ContentUploadForm.tsx`) — the
 * same direct-to-Storage pattern `SlipUploadForm.tsx` uses for deposit
 * slips, just gated by role instead of ownership (see `storage.rules`).
 *
 * This route never touches the file itself, only the Firestore record that
 * makes it discoverable — the actual bytes are already sitting in the
 * bucket under `storagePath` by the time this is called.
 */
const bodySchema = z.object({
  subjectId: z.string().min(1).max(64),
  kind: z.enum(["notes", "past_paper", "marking_scheme", "replay"]),
  title: z.string().trim().min(1).max(200),
  isPublic: z.boolean(),
  storagePath: z.string().min(1).max(500),
  sizeBytes: z.number().int().min(0).max(1024 * 1024 * 1024).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
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

  // storage.rules confines a teacher's direct upload to this exact prefix —
  // rejecting anything else here closes the gap between what rules allow a
  // browser to write and what this route will ever list as real content.
  if (!body.storagePath.startsWith(`content/${body.subjectId}/`)) {
    return NextResponse.json({ error: "invalid_storage_path" }, { status: 400 });
  }

  const subjectSnap = await col.subjects().doc(body.subjectId).get();
  if (!subjectSnap.exists) {
    return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  }

  const id = col.content().doc().id;
  const item: ContentItem = {
    id,
    tenantId: publicEnv.tenantId,
    subjectId: body.subjectId,
    kind: body.kind,
    title: body.title,
    storagePath: body.storagePath,
    sizeBytes: body.sizeBytes,
    isPublic: body.isPublic,
    createdAt: Date.now(),
  };

  await col.content().doc(id).set(item);

  return NextResponse.json({ ok: true, id });
}
