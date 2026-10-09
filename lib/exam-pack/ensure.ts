import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { EXAM_PACK, EXAM_PACK_ID } from "@/lib/exam-pack/config";
import type { Subject } from "@/lib/types";

/**
 * Creates the Exam Pack's subject document if it does not exist yet.
 *
 * The same self-heal as `ensureCampusMatch`, for the same reason: this
 * platform is set up from a browser, and a product that has to be created by
 * hand is a product that never goes on sale.
 *
 * ## Why `grade: "AL"` with a `product` block
 *
 * It is an A/L product, sold to Grade 13 students — not a Campus Ready pack.
 * `listProducts()` and the Campus Ready rail entries look for `"CAMPUS"`, so it
 * stays out of them; `listSubjects()` excludes anything with a `product`
 * block, so it never shows up as a class; and `listSellableSubjects()` keeps
 * every `"AL"` subject, so the ledger and the CSV export name it correctly.
 *
 * Created **inactive** and off sale. The console's switch is the only thing
 * that makes it visible and sellable. Creates only — a price edited in the
 * console is never reset by a deploy.
 */
let settled: Promise<void> | undefined;

export function ensureExamPack(): Promise<void> {
  settled ??= create();
  return settled;
}

async function create(): Promise<void> {
  try {
    const ref = col.subjects().doc(EXAM_PACK_ID);
    if ((await ref.get()).exists) return;

    const subject: Subject = {
      id: EXAM_PACK_ID,
      tenantId: publicEnv.tenantId,
      name: EXAM_PACK.name,
      grade: "AL",
      medium: "sinhala",
      // The fee lives on the product block. Zero here so anything that misreads
      // this as a monthly subscription bills nothing rather than Rs 9,900 a month.
      priceLKR: 0,
      description: EXAM_PACK.tagline.en,
      syllabusTopics: [],
      product: {
        feeLKR: EXAM_PACK.feeLKR,
        accessDays: EXAM_PACK.accessDays,
      },
      active: false,
    };

    await ref.create(subject);
  } catch (err) {
    // Two instances racing, or Firestore briefly unreachable. A missing product
    // is a product not on sale, which is recoverable; a 500 is not.
    settled = undefined;
    if ((err as { code?: number }).code !== 6) {
      console.error("[exam-pack] could not create the subject", err);
    }
  }
}

/**
 * The pack's subject, if it exists. Requires the product block, so callers can
 * treat the fee and access period as present.
 */
export async function getExamPack(): Promise<Subject | null> {
  await ensureExamPack();
  try {
    const snap = await col.subjects().doc(EXAM_PACK_ID).get();
    if (!snap.exists) return null;
    const subject = snap.data() as Subject;
    return subject.product ? subject : null;
  } catch (err) {
    console.error("[exam-pack] could not read the subject", err);
    return null;
  }
}
