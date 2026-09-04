import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/SignInForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

/** Only same-origin paths. An open redirect on a sign-in page is a phishing primitive. */
function safeNext(raw?: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

/**
 * The sign-in gate.
 *
 * Server component on purpose. A student who is already signed in and taps a
 * shared `/signin?ref=...` link used to be shown the form again and burned a
 * billed SMS proving something the cookie already knew; now they are simply
 * sent where they were going. The typing part lives in `SignInForm`.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; ref?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const user = await getSessionUser();
  if (user) redirect(next);

  // Sign-in is the threshold, so it belongs to the product's dark world rather
  // than the marketing one — the student crosses over here, not one screen
  // later. `.ict-app` is also what keeps the legacy gradient buttons on this
  // page resolving to flat orange.
  return (
    <div className="ict-app min-h-dvh">
      <SignInForm
        next={next}
        referredBy={params.ref?.trim().toUpperCase() || undefined}
        reason={params.reason}
      />
    </div>
  );
}
