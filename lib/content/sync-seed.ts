import "server-only";

import { col } from "@/lib/firebase/admin";
import { QUESTION_SEED } from "@/lib/content/question-seed";

/**
 * Copies the practice question bank from code into Firestore.
 *
 * Questions, unlike units, genuinely have to live in Firestore: a mock exam
 * freezes a list of question ids, an attempt records which question a
 * student answered, and spaced repetition schedules a question id for
 * review — all three need a real document to point at. So this cannot be
 * replaced by reading the array directly the way `lib/queries.ts` now reads
 * the syllabus; it has to stay a copy.
 *
 * What it does not need is a human to remember to make the copy. This runs
 * once automatically whenever a server instance starts (see
 * `instrumentation.ts`), so editing `question-seed.ts` and deploying is the
 * whole publish step, the same as everything else. Deterministic ids
 * (`${subjectId}_seed_${index}`) and `merge: true` make re-running it on
 * every cold start harmless: it updates the same documents in place rather
 * than duplicating them, and never touches a question a teacher might one
 * day add by hand outside this seed.
 */
export async function syncQuestionSeed(tenantId: string): Promise<number> {
  const now = Date.now();
  const batch = col.questions().firestore.batch();

  QUESTION_SEED.forEach((seed, index) => {
    const id = `${seed.subjectId}_seed_${index}`;
    batch.set(col.questions().doc(id), { ...seed, id, tenantId, createdAt: now }, { merge: true });
  });

  await batch.commit();
  return QUESTION_SEED.length;
}
