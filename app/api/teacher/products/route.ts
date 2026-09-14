import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { SURVIVAL_PACK } from "@/lib/content/survival-pack";
import type { Subject } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** Becomes the subject id, so it is also the URL. Defaults to the pack's own id. */
  id: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens only"),
  name: z.string().trim().min(3).max(120),
  feeLKR: z.number().int().min(0).max(1_000_000).default(SURVIVAL_PACK.feeLKR),
  accessDays: z.number().int().min(1).max(3650).default(SURVIVAL_PACK.accessDays),
  includedWithCohorts: z.boolean().default(true),
  description: z.string().trim().max(500).optional(),
  /** Switching a product off takes it off sale without deleting what people bought. */
  active: z.boolean().default(true),
});

/**
 * Creates or edits a one-off digital product.
 *
 * The mirror of the cohorts route, and a route rather than a script for the
 * same reason: the owner sets this platform up from a browser, and a product
 * that can only be created from a terminal cannot be created at all.
 *
 * Merges rather than overwrites, so re-submitting to change a price never
 * clobbers a description that has since been edited.
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

  // A pack and a cohort are different shapes and `getProduct`/`getCohort` each
  // assume their own block is the discriminator. Writing a product block onto
  // an intake would put it in both lists and price it twice.
  const existing = await col.subjects().doc(body.id).get();
  if (existing.exists && (existing.data() as Subject).cohort) {
    return NextResponse.json({ error: "id_is_a_cohort" }, { status: 409 });
  }

  const subject: Subject = {
    id: body.id,
    tenantId,
    name: body.name,
    grade: "CAMPUS",
    medium: "sinhala",
    // Unused for a product — the fee lives in `product.feeLKR`. Zero rather
    // than the price, so anything that misreads this as a monthly subscription
    // bills nothing rather than charging for the pack every month.
    priceLKR: 0,
    description: body.description ?? SURVIVAL_PACK.tagline.en,
    syllabusTopics: [],
    active: body.active,
    product: {
      feeLKR: body.feeLKR,
      accessDays: body.accessDays,
      includedWithCohorts: body.includedWithCohorts,
    },
  };

  await col.subjects().doc(body.id).set(subject, { merge: true });

  return NextResponse.json({ ok: true, id: subject.id, name: subject.name, feeLKR: body.feeLKR });
}
