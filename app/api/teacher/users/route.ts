import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { toE164 } from "@/lib/phone";
import type { User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The people directory behind Teacher console → People.
 *
 * Before this there was no way to see who had signed up at all — the only
 * lookup in the whole console took a phone number and returned that one
 * student's devices. A teacher could not answer "how many students do I have",
 * "who signed up this week", or "who is this number that just paid".
 *
 * Reads are capped and narrowed in memory rather than by a compound query, for
 * the same reason as the rest of `lib/queries.ts`: a composite index cannot be
 * deployed from a browser, and this platform is administered from a phone.
 */

/** One page of the directory. Large enough for a whole class, small enough to stay one read. */
const PAGE_SIZE = 300;

const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  role: z.enum(["all", "student", "teacher", "admin", "parent"]).default("all"),
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE).default(PAGE_SIZE),
});

export interface DirectoryUser {
  uid: string;
  name: string;
  phone: string;
  role: string;
  medium: string;
  school?: string;
  district?: string;
  referralCode: string;
  referredBy?: string;
  deviceCount: number;
  devices: { label: string; lastSeenAt: number }[];
  createdAt: number;
  lastSeenAt?: number;
  disabled: boolean;
  disabledReason?: string;
}

function toDirectoryUser(user: User): DirectoryUser {
  const devices = user.devices ?? [];
  return {
    uid: user.uid,
    name: user.name,
    phone: user.phone,
    role: user.role,
    medium: user.medium,
    school: user.school,
    district: user.district,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    deviceCount: devices.length,
    devices: devices
      .map((d) => ({ label: d.label, lastSeenAt: d.lastSeenAt }))
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt),
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
    disabled: Boolean(user.disabled),
    disabledReason: user.disabledReason,
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const parsed = querySchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    role: req.nextUrl.searchParams.get("role") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { q, role, limit } = parsed.data;

  // A phone number is the identity anchor, so searching for one is an exact,
  // indexed lookup rather than a scan — that is the search the teacher runs
  // when a payment lands and they need to know whose it is.
  const asPhone = q ? toE164(q) : null;
  if (asPhone) {
    const snap = await col.users().where("phone", "==", asPhone).limit(5).get();
    return NextResponse.json({
      ok: true,
      users: snap.docs.map((d) => toDirectoryUser(d.data() as User)),
      truncated: false,
    });
  }

  const snap = await col.users().orderBy("createdAt", "desc").limit(limit).get();
  const needle = q?.toLowerCase();

  const users = snap.docs
    .map((d) => d.data() as User)
    .filter((u) => u.tenantId === publicEnv.tenantId)
    .filter((u) => role === "all" || u.role === role)
    .filter((u) =>
      !needle
        ? true
        : u.name.toLowerCase().includes(needle) ||
          u.phone.includes(needle) ||
          u.referralCode.toLowerCase().includes(needle) ||
          (u.school ?? "").toLowerCase().includes(needle),
    )
    .map(toDirectoryUser);

  return NextResponse.json({
    ok: true,
    users,
    // Says plainly that the newest `limit` accounts were searched, not all of
    // them — a silent cut-off on a "find this student" screen is worse than no
    // search at all.
    truncated: snap.size === limit,
    scanned: snap.size,
  });
}
