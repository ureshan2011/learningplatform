"use client";

import { useSignedInClient } from "@/lib/auth/use-signed-in-client";
import { ButtonLink } from "@/components/ds";

/**
 * The closing pitch on a free-resource page (`/notes`, `/command-words`,
 * ...). These pages are reached both by anonymous search traffic — the
 * guest pitch below — and by a signed-in student tapping the same link in
 * their own dashboard sidebar, for whom "Join a class" / "Sign in" is a
 * dead CTA pointing at something they've already done. Once Firebase
 * confirms the visitor is signed in, this swaps to a plain way back to
 * their dashboard instead.
 */
export function ResourcePageCta({
  title,
  body,
  guestHref,
  guestLabel,
}: {
  title: string;
  body: string;
  guestHref: string;
  guestLabel: string;
}) {
  const signedIn = useSignedInClient(false);

  return (
    <section className="mt-8 rounded-ict-card border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
      <h2 className="text-lg font-bold">{signedIn ? "Back to your dashboard" : title}</h2>
      <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
        {signedIn
          ? "You're already signed in — practice, mock exams and your notes are all one tap away."
          : body}
      </p>
      <ButtonLink href={signedIn ? "/dashboard" : guestHref} variant="primary">
        {signedIn ? "Go to dashboard" : guestLabel}
      </ButtonLink>
    </section>
  );
}
