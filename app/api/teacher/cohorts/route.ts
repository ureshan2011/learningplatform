import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { CAMPUS_READY, CAMPUS_READY_TOPICS } from "@/lib/content/campus-ready";
import type { Subject } from "@/lib/types";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;

const bodySchema = z.object({
  /** e.g. "campus-ready-2027-jan". Becomes the subject id, so it is also the URL. */
  id: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens only"),
  /** Shown to students, e.g. "Campus Ready — January 2027". */
  name: z.string().trim().min(3).max(120),
  startsAt: z.number().int().positive(),
  endsAt: z.number().int().positive(),
  /** Defaults to `startsAt` — a cohort whose whole design is a shared pace cannot absorb a late joiner. */
  enrolmentClosesAt: z.number().int().positive().optional(),
  feeLKR: z.number().int().min(0).max(1_000_000).default(CAMPUS_READY.feeLKR),
  description: z.string().trim().max(500).optional(),
});

/**
 * Opens a Campus Ready intake.
 *
 * A cohort is stored as a `Subject` with `grade: "CAMPUS"` and a `cohort`
 * block, so it inherits enrollments, payments, receipts, `hasAccess` and the
 * live-session machinery without any of them learning a new concept.
 *
 * Exposed as a route, not a script, for the same reason the A/L subject seed
 * is: the owner sets this platform up from a browser, and an intake that can
 * only be opened from a terminal cannot be opened at all.
 *
 * Merges rather than overwrites, so re-running to fix a date never clobbers a
 * description or fee that has since been edited. Teacher-only.
 */
export async function POST(req: NextRequest) {
  let tenantId: string;
  try {
    ({ tenantId } = await requireTeacher());
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

  const enrolmentClosesAt = body.enrolmentClosesAt ?? body.startsAt;

  // These three are the whole contract of a cohort, and a typo in any of them
  // is silent: a cohort that ends before it starts hands every student an
  // already-expired enrollment, and one that closes after it ends sells seats
  // in a class that has finished. Cheaper to refuse than to explain later.
  if (body.endsAt <= body.startsAt) {
    return NextResponse.json({ error: "ends_before_start" }, { status: 400 });
  }
  if (enrolmentClosesAt > body.endsAt) {
    return NextResponse.json({ error: "enrolment_closes_after_end" }, { status: 400 });
  }

  const subject: Subject = {
    id: body.id,
    tenantId,
    name: body.name,
    grade: "CAMPUS",
    medium: "sinhala",
    // Unused for a cohort — the fee lives in `cohort.feeLKR`. Zero rather than
    // the programme fee on purpose: anything that misreads this as a monthly
    // subscription should bill nothing, not Rs 30,000 a month.
    priceLKR: 0,
    description: body.description ?? CAMPUS_READY.tagline,
    syllabusTopics: CAMPUS_READY_TOPICS,
    active: true,
    cohort: {
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      enrolmentClosesAt,
      feeLKR: body.feeLKR,
    },
  };

  await col.subjects().doc(body.id).set(subject, { merge: true });

  return NextResponse.json({
    ok: true,
    id: subject.id,
    name: subject.name,
    feeLKR: body.feeLKR,
    enrolmentOpenDays: Math.max(0, Math.ceil((enrolmentClosesAt - Date.now()) / DAY)),
  });
}
