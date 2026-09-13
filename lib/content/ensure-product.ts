import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { SURVIVAL_PACK } from "@/lib/content/survival-pack";
import type { Subject } from "@/lib/types";

/**
 * Creates the Survival Pack's subject document if it does not exist yet.
 *
 * The same self-heal as `claimTeacherIfVacant`, and for the same reason: this
 * platform is set up by someone who does not use a terminal, and here cannot
 * use the console either — so a product that has to be created by hand is a
 * product that never goes on sale. The defaults come from
 * `lib/content/survival-pack.ts`, and the console can edit every one of them
 * afterwards.
 *
 * Creates only. It never writes over a product that already exists, so a price
 * changed in the console is not reset on the next deploy.
 *
 * Runs at most once per server instance. A cold start costs one document read;
 * every later call returns the same settled promise.
 */
let settled: Promise<void> | undefined;

export function ensureSurvivalPack(): Promise<void> {
  settled ??= create();
  return settled;
}

async function create(): Promise<void> {
  try {
    const ref = col.subjects().doc(SURVIVAL_PACK.id);
    if ((await ref.get()).exists) return;

    const subject: Subject = {
      id: SURVIVAL_PACK.id,
      tenantId: publicEnv.tenantId,
      name: SURVIVAL_PACK.name,
      grade: "CAMPUS",
      medium: "sinhala",
      // The fee lives in `product.feeLKR`. Zero here so anything that misreads
      // this as a monthly subscription bills nothing rather than charging for
      // the pack every month.
      priceLKR: 0,
      description: SURVIVAL_PACK.tagline.en,
      syllabusTopics: [],
      active: true,
      product: {
        feeLKR: SURVIVAL_PACK.feeLKR,
        accessDays: SURVIVAL_PACK.accessDays,
        includedWithCohorts: true,
      },
    };

    await ref.create(subject);
  } catch {
    // Two instances racing, or Firestore briefly unreachable. Neither is worth
    // failing a page render over — the next cold start tries again, and a
    // `create` that lost the race means the document is already there.
    settled = undefined;
  }
}
