import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getT, localeAttrs } from "@/lib/i18n/server";
import { buildSignInCopy } from "@/components/auth/sign-in/copy";
import { SignInScreen } from "@/components/auth/sign-in/SignInScreen";

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
 * sent where they were going.
 *
 * The dictionary never ships to the browser — this resolves every string the
 * client screen needs into a plain object (`buildSignInCopy`) and hands that
 * down as a prop, the same pattern every other translated page uses via
 * `getT()`.
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

  const [t, loc] = await Promise.all([getT(), localeAttrs()]);
  // `buildSignInCopy` only ever passes the `signin.*` keys this file's
  // dictionary entries define, but its own type is a plain `(key: string) =>
  // string` — deliberately, so this module never imports `Translator` from
  // the server-only `lib/i18n/server`. The narrowing is safe; TypeScript just
  // cannot see across that boundary.
  const copy = buildSignInCopy((key, vars) => t(key as Parameters<typeof t>[0], vars));

  // Sign-in is the threshold, so it belongs to the product's dark world rather
  // than the marketing one — the student crosses over here, not one screen
  // later. `.ict-app` is also what keeps the legacy gradient buttons on this
  // page resolving to flat orange.
  return (
    <div className={`ict-app min-h-dvh ${loc.className}`} lang={loc.lang}>
      <SignInScreen
        next={next}
        referredBy={params.ref?.trim().toUpperCase() || undefined}
        reason={params.reason}
        copy={copy}
      />
    </div>
  );
}
