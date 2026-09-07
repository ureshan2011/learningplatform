"use client";

import Link from "next/link";
import { useSignedInClient } from "@/lib/auth/use-signed-in-client";
import { ButtonLink, Card } from "@/components/ds-cream";

/**
 * The closing pitch on /past-papers — its own box style and two links
 * (class + notes), unlike the single-CTA free-resource pages, so it gets
 * its own signed-in swap rather than sharing `ResourcePageCta`. See that
 * component's doc comment for why this swap exists at all.
 */
export function PastPapersCta() {
  const signedIn = useSignedInClient(false);

  return (
    <Card radius="card" className="mt-8 p-6">
      <h2 className="font-display text-xl font-extrabold text-ict-ink-900">
        {signedIn ? "Back to your dashboard" : "Want the papers worked through with you?"}
      </h2>
      <p className="mt-2 text-ict-ink-500">
        {signedIn
          ? "You're already signed in — practice, mock exams and your notes are all one tap away."
          : "Past paper questions are worked through live in class, with the marking scheme open and the reasoning shown. Seven days free, no card."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {signedIn ? (
          <ButtonLink href="/dashboard" variant="primary">
            Go to dashboard
          </ButtonLink>
        ) : (
          <>
            <ButtonLink href="/al-ict-classes" variant="primary">
              See the A/L ICT classes
            </ButtonLink>
            <Link
              href="/notes"
              className="rounded-full border-[1.5px] border-ict-ink-900 px-5 py-3 font-semibold text-ict-ink-900 transition-colors duration-[120ms] hover:border-ict-orange-500 hover:text-ict-orange-600"
            >
              Free notes library
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
