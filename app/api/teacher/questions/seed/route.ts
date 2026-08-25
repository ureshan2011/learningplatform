import { NextResponse } from "next/server";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { QUESTION_SEED } from "@/lib/content/question-seed";

export const runtime = "nodejs";

/**
 * Loads the starter practice question bank.
 *
 * Same shape as the subjects seed route: exposed to the teacher console so a
 * brand-new platform gets a working Practice section with no command line and
 * no hand-authoring required on day one. Deterministic ids
 * (`${subjectId}_${index}`) mean re-running this after editing
 * `lib/content/question-seed.ts` updates existing questions rather than
 * duplicating them.
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
  const batch = col.questions().firestore.batch();

  QUESTION_SEED.forEach((seed, index) => {
    const id = `${seed.subjectId}_seed_${index}`;
    batch.set(
      col.questions().doc(id),
      { ...seed, id, tenantId, createdAt: now },
      { merge: true },
    );
  });

  await batch.commit();
  return NextResponse.json({ ok: true, created: QUESTION_SEED.length });
}
