import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import { deleteInputs, recordOutcome, savePreferences, saveInputs } from "@/lib/campus-match/inputs";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Saves the answers a student's report is rendered from.
 *
 * Behind `hasAccess`, which stays the only access check on the platform — this
 * route does not invent a second one. A browser has no write on the
 * `campusMatch` collection at all, so the server writing it here is the only
 * way these values ever reach Firestore.
 *
 * The Z-score is range-checked against what the published rounds actually
 * contain, and the district and stream against the lists the UGC prints. A
 * value outside those is a typo or a forged request, and neither should reach
 * a forecast.
 */

const DISTRICT_KEYS = new Set(districts.districts.map((d) => d.key));
const STREAM_KEYS = new Set(streams.streams.map((s) => s.key));
const { min: Z_MIN, max: Z_MAX } = streams.zScoreRange;

const inputsSchema = z.object({
  z: z.number().min(Z_MIN).max(Z_MAX),
  district: z.string().refine((d) => DISTRICT_KEYS.has(d), "unknown district"),
  stream: z.string().refine((s) => STREAM_KEYS.has(s), "unknown stream"),
  passes: z.array(z.string().min(1).max(64)).max(12).default([]),
  medium: z.boolean().default(false),
  // The application form's own limit is not published, so nothing here pretends
  // to know it; this cap only stops an unbounded array being stored.
  preferences: z.array(z.string().min(1).max(80)).max(50).default([]),
});

const outcomeSchema = z.object({ outcome: z.string().min(1).max(120) });

// The order builder changes nothing but the order. `strict()` keeps a full
// payload from being caught here and losing its other fields.
const preferencesSchema = z
  .object({ preferences: z.array(z.string().min(1).max(80)).max(50) })
  .strict();

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const access = await hasAccess(user.uid, CAMPUS_MATCH_ID);
  if (!access.allowed) {
    return NextResponse.json({ error: "not_owned", reason: access.reason }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Recording what the student was actually offered arrives on the same route:
  // it is one more field on the same document, asked once after selection.
  const outcome = outcomeSchema.safeParse(body);
  if (outcome.success) {
    const ok = await recordOutcome(user.uid, outcome.data.outcome);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "no_inputs" }, { status: 409 });
  }

  const preferences = preferencesSchema.safeParse(body);
  if (preferences.success) {
    const ok = await savePreferences(user.uid, preferences.data.preferences);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "no_inputs" }, { status: 409 });
  }

  const parsed = inputsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const inputs = await saveInputs({
    uid: user.uid,
    tenantId: user.tenantId,
    ...parsed.data,
  });
  return NextResponse.json({ ok: true, updatedAt: inputs.updatedAt });
}

/** Deletes the stored answers. The privacy page points a student here. */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Deliberately not behind `hasAccess`: a student whose access has lapsed must
  // still be able to remove what is held about them.
  const deleted = await deleteInputs(user.uid);
  return NextResponse.json({ ok: true, deleted });
}
