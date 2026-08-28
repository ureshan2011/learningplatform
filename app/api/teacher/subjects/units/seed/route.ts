import { NextResponse } from "next/server";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";

export const runtime = "nodejs";

/**
 * Loads the full A/L ICT unit and lesson breakdown.
 *
 * Same shape as the subjects and questions seed routes: exposed to the
 * teacher console so the syllabus structure — units, competency levels, exam
 * objectives, exam-focus notes — is in the platform with no command line and
 * no hand-authoring required. Deterministic ids (`al-ict-u{n}`) mean
 * re-running this after editing `lib/content/al-ict-units.ts` updates the
 * existing units rather than duplicating them.
 */
export async function POST() {
  let tenantId: string;
  try {
    ({ tenantId } = await requireTeacher());
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const now = Date.now();
  const batch = col.units().firestore.batch();

  for (const unit of AL_ICT_UNITS) {
    batch.set(col.units().doc(unit.id), { ...unit, tenantId, createdAt: now }, { merge: true });
  }

  await batch.commit();
  return NextResponse.json({ ok: true, created: AL_ICT_UNITS.length });
}
