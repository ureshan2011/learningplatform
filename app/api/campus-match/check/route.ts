import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkEligibility } from "@/lib/campus-match/check";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The free checker's backend: eligible courses and last round's cut-off.
 *
 * Deliberately anonymous, like `/api/leads` — the whole point is cold search
 * traffic on results day, and requiring sign-in would defeat it.
 *
 * Costs no Firestore read: everything comes from static JSON compiled into the
 * bundle. That is also why the limiter below is modest — the exposure here is
 * CPU on one instance, not a bill.
 */

const DISTRICT_KEYS = new Set(districts.districts.map((d) => d.key));
const STREAM_KEYS = new Set(streams.streams.map((s) => s.key));
const { min: Z_MIN, max: Z_MAX } = streams.zScoreRange;

const bodySchema = z.object({
  z: z.number().min(Z_MIN).max(Z_MAX),
  district: z.string().refine((d) => DISTRICT_KEYS.has(d), "unknown district"),
  stream: z.string().refine((s) => STREAM_KEYS.has(s), "unknown stream"),
  passes: z.array(z.string().min(1).max(64)).max(12).optional(),
});

/**
 * One instance's memory of who has been asking.
 *
 * Per-instance, not global: App Hosting runs several, so this bounds a single
 * client against one instance rather than across the fleet. That is the honest
 * limit of it, and it is enough for what this route is — a page a student
 * retypes a Z-score into, backed by no database. The map is swept rather than
 * left to grow, because an unbounded map is its own denial of service.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function overLimit(key: string, now: number): boolean {
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (overLimit(ip, now)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = checkEligibility(parsed.data);
  return NextResponse.json(result);
}
