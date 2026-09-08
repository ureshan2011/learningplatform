import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { startFreeTrial } from "@/lib/payments/entitlements";

export const dynamic = "force-dynamic";

/**
 * Carries an intent through sign-in.
 *
 * A public CTA ("Start the free trial", "Subscribe") never links straight to
 * `/signin` — it links here with what the visitor actually chose. `next`
 * brings them back to this exact URL once they have a code, so the thing they
 * tapped for on the marketing page gets done, rather than leaving them on a
 * dashboard to go and find it again.
 *
 * Lives under `(student)` so `requirePageUser` and the app shell are in
 * scope; it renders nothing itself, only redirects.
 */
export default async function GoPage({
  searchParams,
}: {
  searchParams: Promise<{ do?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const action = params.do;
  const subjectId = params.subject;

  if ((action !== "trial" && action !== "subscribe") || !subjectId) {
    redirect("/dashboard");
  }

  const next = `/go?do=${action}&subject=${encodeURIComponent(subjectId)}`;
  const user = await requirePageUser(next);

  const subject = await getSubject(subjectId);
  if (!subject) redirect("/dashboard");

  if (action === "trial") {
    try {
      await startFreeTrial({ uid: user.uid, subjectId, tenantId: user.tenantId });
    } catch (err) {
      // Already used their trial, or the subject does not offer one — either
      // way that is success from here, not a failure: the subject page below
      // shows the paid options instead. (`getSubject` is A/L-only, so a cohort
      // id has already redirected above; the second case is belt and braces
      // against that filter ever widening.)
      const reason = err instanceof Error && "reason" in err ? (err as { reason?: string }).reason : undefined;
      if (reason !== "trial_already_used" && reason !== "trial_not_available") throw err;
    }
  }

  // "subscribe" needs no server action: the subject page already shows card
  // and bank-slip payment when the visitor is signed in but not enrolled.
  redirect(`/subjects/${subjectId}`);
}
