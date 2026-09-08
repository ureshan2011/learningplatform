import "server-only";

import { col } from "@/lib/firebase/admin";
import { QUESTION_SEED, isLegacySeedId } from "@/lib/content/question-seed";

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
 * whole publish step, the same as everything else. Each seed's `id` is now
 * fixed in code (see `q()` in `question-seed.ts`) rather than derived from
 * its position in the array, so `merge: true` on every cold start updates
 * the same documents in place rather than duplicating them, and reordering
 * or inserting a question never reassigns another question's stored content.
 *
 * The bank used to key documents by array index (`${subjectId}_seed_N`),
 * which meant inserting a question anywhere but the end silently renamed
 * every later question to a different id — and since a question is looked
 * up by that id both to display it and to grade it, the renamed id kept its
 * OLD stored text and explanation while showing a NEW question, which is
 * exactly the "explanation points to a different question" bug this fixes.
 * Every id ever produced by that scheme is now orphaned: nothing in code
 * points to it, but it would otherwise sit in Firestore forever, still
 * matched by the `subjectId` queries `nextQuestionBatch` and
 * `selectQuestionsForMockExam` run, corrupting the practice/mock-exam pool
 * with stale content. So each sync also deletes any `questions` document
 * whose id matches the legacy pattern — the next deploy cleans up the
 * previous one's mess with no manual Firestore console work.
 */
export async function syncQuestionSeed(tenantId: string): Promise<number> {
  const now = Date.now();
  const batch = col.questions().firestore.batch();

  QUESTION_SEED.forEach((seed) => {
    batch.set(col.questions().doc(seed.id), { ...seed, tenantId, createdAt: now }, { merge: true });
  });

  const legacy = await col.questions().where("tenantId", "==", tenantId).get();
  legacy.docs.forEach((doc) => {
    if (isLegacySeedId(doc.id)) batch.delete(doc.ref);
  });

  await batch.commit();
  return QUESTION_SEED.length;
}
