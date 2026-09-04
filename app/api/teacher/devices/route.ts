import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { releaseDevice } from "@/lib/auth/devices";
import { toE164 } from "@/lib/phone";
import type { User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Device reset, from the browser.
 *
 * `scripts/admin.mjs release-devices` did this already, but a command line is
 * exactly what the owner of this platform does not have — so a student on a
 * new phone was stuck behind an instruction ("ask your teacher") that the
 * teacher had no way to carry out.
 */

const lookupSchema = z.object({ phone: z.string().trim().min(6).max(20) });
const releaseSchema = lookupSchema.extend({
  /** Omit to clear every device at once — the usual case for a lost phone. */
  deviceHash: z.string().trim().max(64).optional(),
});

async function findStudent(rawPhone: string) {
  const phone = toE164(rawPhone);
  if (!phone) return { error: "invalid_phone" as const };

  const snap = await col.users().where("phone", "==", phone).limit(1).get();
  if (snap.empty) return { error: "not_found" as const };
  return { user: snap.docs[0].data() as User };
}

/** Look up whose devices these are, and what is currently bound. */
export async function GET(req: NextRequest) {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const parsed = lookupSchema.safeParse({
    phone: req.nextUrl.searchParams.get("phone") ?? "",
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const result = await findStudent(parsed.data.phone);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 400 });
  }

  return NextResponse.json({
    ok: true,
    name: result.user.name,
    role: result.user.role,
    devices: (result.user.devices ?? []).map((d) => ({
      deviceHash: d.deviceHash,
      label: d.label,
      firstSeenAt: d.firstSeenAt,
      lastSeenAt: d.lastSeenAt,
    })),
  });
}

/** Free one device slot, or all of them. Only the freed browsers are signed out. */
export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  let body: z.infer<typeof releaseSchema>;
  try {
    body = releaseSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = await findStudent(body.phone);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 400 });
  }

  const devices = result.user.devices ?? [];
  const targets = body.deviceHash ? [body.deviceHash] : devices.map((d) => d.deviceHash);
  for (const hash of targets) {
    await releaseDevice(result.user.uid, hash);
  }

  return NextResponse.json({ ok: true, released: targets.length, name: result.user.name });
}
