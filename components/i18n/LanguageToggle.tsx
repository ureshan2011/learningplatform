"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { setLocale } from "@/app/actions/locale";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n/dictionary";

/**
 * English / සිංහල.
 *
 * A two-item segmented pill rather than a dropdown: there are exactly two
 * options, both fit, and a student can see which one is active without opening
 * anything. Each label is written in its own language — "සිංහල", never
 * "Sinhala" — because someone who cannot read the interface can still recognise
 * their own script.
 *
 * The write goes through a server action, which sets the cookie and revalidates
 * the tree in one round trip — so the new language is already rendered when the
 * response lands. No reload, no flash, and no client-side cookie write racing a
 * refresh. The choice is a cookie, so it survives sign-out and applies on the
 * sign-in page too.
 */
export function LanguageToggle({
  current,
  className,
}: {
  current: Locale;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={clsx(
        "inline-flex items-center gap-1 rounded-full bg-ict-ink-800 p-1",
        pending && "opacity-60",
        className,
      )}
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => choose(locale)}
          aria-pressed={locale === current}
          lang={locale}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-[120ms] ease-ict",
            locale === current
              ? "bg-ict-orange-500 text-white"
              : "text-ict-ink-300 hover:text-ict-paper-50",
          )}
        >
          {LOCALE_LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
