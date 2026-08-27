import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().trim().min(1).max(64).optional(),
});

/**
 * Captures an email address from the free content hub on the landing page.
 *
 * Deliberately anonymous — no `getSessionUser()` check. The whole point is
 * catching cold SEO/search traffic before they have any account at all, so
 * requiring sign-in here would defeat the feature. The doc id is the email
 * itself, so a repeat submission just refreshes `updatedAt` instead of
 * piling up duplicates, and always returns the same 200 either way rather
 * than revealing whether an address is already on the list.
 */
export async function POST(req: NextRequest) {
  let email: string;
  let source: string | undefined;
  try {
    ({ email, source } = bodySchema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const ref = col.leads().doc(email);
  const existing = await ref.get();
  const now = Date.now();

  const lead: Lead = {
    id: email,
    tenantId: publicEnv.tenantId,
    email,
    source: source ?? "landing",
    createdAt: existing.exists ? ((existing.data() as Lead).createdAt ?? now) : now,
    updatedAt: now,
  };
  await ref.set(lead);

  return NextResponse.json({ ok: true });
}
