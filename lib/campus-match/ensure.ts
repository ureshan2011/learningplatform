import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import {
  ADMISSION_ROUND,
  CAMPUS_MATCH_ACCESS_DAYS,
  CAMPUS_MATCH_FEE_LKR,
  CAMPUS_MATCH_ID,
  CAMPUS_MATCH_NAME,
} from "@/lib/campus-match/cycle";
import type { Subject } from "@/lib/types";

/**
 * Creates this cycle's Campus Match subject if it does not exist yet.
 *
 * The same self-heal as `ensureSurvivalPack`, and for the same reason: the
 * console has no screen that creates a product, and this platform is set up by
 * someone who does not use a terminal. A product that has to be created by hand
 * is a product that never goes on sale.
 *
 * Created **inactive**. `listProducts()` filters on `active`, so an unpublished
 * cycle appears nowhere — no dashboard card, no nav entry, no sales page — and
 * the checkout refuses it twice over (`subject_inactive` and `not_published`).
 * Publishing from the console is what makes it visible and sellable, in that
 * one action.
 *
 * Creates only. A price edited in the console is never reset by a deploy.
 */
let settled: Promise<void> | undefined;

export function ensureCampusMatch(): Promise<void> {
  settled ??= create();
  return settled;
}

async function create(): Promise<void> {
  try {
    const ref = col.subjects().doc(CAMPUS_MATCH_ID);
    if ((await ref.get()).exists) return;

    const subject: Subject = {
      id: CAMPUS_MATCH_ID,
      tenantId: publicEnv.tenantId,
      name: CAMPUS_MATCH_NAME,
      grade: "CAMPUS",
      medium: "sinhala",
      // The fee lives on the product block. Zero here so anything that misread
      // this as a subscription bills nothing rather than charging monthly.
      priceLKR: 0,
      description: `Which degrees your Z-score can reach in the ${ADMISSION_ROUND} round, district by district.`,
      syllabusTopics: [],
      product: {
        feeLKR: CAMPUS_MATCH_FEE_LKR,
        accessDays: CAMPUS_MATCH_ACCESS_DAYS,
      },
      // Off until the owner has read the manifest and the backtest. See above.
      active: false,
    };

    await ref.set(subject);
  } catch (err) {
    // Never allowed to take a page down: a missing product is a product not on
    // sale, which is recoverable; a 500 on the dashboard is not.
    console.error("[campus-match] could not create the subject", err);
  }
}
