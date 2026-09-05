import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import {
  DICTIONARIES,
  interpolate,
  isLocale,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/dictionary";

export const LOCALE_COOKIE = "ictclass_lang";

/** A year. The choice is a preference, not a session — it should outlive both. */
export const LOCALE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * The reader's language.
 *
 * English is the default and stays the default: the interface has always been
 * English, and defaulting a returning student into a language they did not
 * choose is worse than asking. Sinhala is one tap away in the sidebar.
 *
 * Held in a plain cookie rather than on the user document, deliberately. It has
 * to work on the sign-in page where there is no user yet, it must not cost a
 * Firestore read on every render, and getting it wrong costs nothing. Memoized
 * per request so a layout and its page agree.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
});

export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string;

/**
 * The translator for this request.
 *
 * Falls back to English for any key Sinhala has not got, so a missing string is
 * a readable English word rather than a blank or a raw key on a student's
 * screen. The dictionary's type makes that unreachable today; the fallback is
 * for the day someone adds a key in a hurry.
 */
export const getT = cache(async (): Promise<Translator> => {
  const locale = await getLocale();
  const dict = DICTIONARIES[locale];
  const fallback = DICTIONARIES.en;
  return (key, vars) => interpolate(dict[key] ?? fallback[key] ?? key, vars);
});

/** For `lang` and `class` attributes — Sinhala needs its own leading (see globals.css). */
export async function localeAttrs(): Promise<{ lang: Locale; className: string }> {
  const locale = await getLocale();
  return { lang: locale, className: locale === "si" ? "si" : "" };
}
