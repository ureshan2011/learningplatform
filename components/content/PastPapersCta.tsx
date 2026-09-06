"use client";

import Link from "next/link";
import { useSignedInClient } from "@/lib/auth/use-signed-in-client";
import { ButtonLink } from "@/components/ds";

/**
 * The closing pitch on /past-papers — its own box style and two links
 * (class + notes), unlike the single-CTA free-resource pages, so it gets
 * its own signed-in swap rather than sharing `ResourcePageCta`. See that
 * component's doc comment for why this swap exists at all.
 */
export function PastPapersCta() {
  const signedIn = useSignedInClient(false);

  return (
    <section className="mt-8 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-6">
      <h2 className="text-xl font-bold">
        {signedIn ? "Back to your dashboard" : "Want the papers worked through with you?"}
      </h2>
      <p className="mt-2 text-(--color-awaken-ink-soft)">
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
              className="rounded-full border border-(--color-awaken-line) px-5 py-3 font-semibold transition-colors hover:border-(--color-awaken-accent)/40"
            >
              Free notes library
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
