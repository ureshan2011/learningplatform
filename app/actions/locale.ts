"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/lib/i18n/dictionary";
import { LOCALE_COOKIE, LOCALE_MAX_AGE } from "@/lib/i18n/server";

/**
 * Switches the interface language.
 *
 * A server action rather than `document.cookie` from the client: the server
 * owns the cookie it reads, the value is validated before it is stored, and the
 * re-render happens as part of the same round trip instead of a refresh racing
 * a write the browser may not have flushed.
 *
 * Not httpOnly — nothing here is sensitive, and leaving it readable means a
 * future client component can check the language without a round trip.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Every signed-in page renders language-dependent text, so the whole tree is
  // stale, not one route.
  revalidatePath("/", "layout");
}
