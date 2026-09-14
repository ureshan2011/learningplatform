import "server-only";

import { col } from "@/lib/firebase/admin";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";

/**
 * The two counts the console panel shows: reports bought, and outcomes told
 * back to us.
 *
 * Counted with Firestore's aggregation, which bills a fraction of a read rather
 * than one per document — the alternative is pulling every enrollment down to
 * call `.length` on it, and this panel is opened often.
 *
 * Never allowed to take the console down: a count that cannot be read shows as
 * a dash, which is what an unknown number should look like.
 */

export interface CampusMatchCounts {
  bought: number | null;
  outcomes: number | null;
}

export async function campusMatchCounts(): Promise<CampusMatchCounts> {
  const [bought, outcomes] = await Promise.all([
    col
      .enrollments()
      .where("subjectId", "==", CAMPUS_MATCH_ID)
      .count()
      .get()
      .then((s) => s.data().count)
      .catch(() => null),
    col
      .campusMatch()
      .where("cycle", "==", CAMPUS_MATCH_ID)
      .where("outcome", "!=", "")
      .count()
      .get()
      .then((s) => s.data().count)
      .catch(() => null),
  ]);
  return { bought, outcomes };
}
