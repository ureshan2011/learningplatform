import { clsx } from "clsx";
import { localeAttrs } from "@/lib/i18n/server";

/**
 * The frame every signed-in page sits in.
 *
 * Before this existed each page wrote its own `<main>`, and they disagreed:
 * six different max-widths (1180, 1152, 820, 760, 672, 448), three of them
 * invented once and never reused — and `/packs/{id}`, `/packs/{id}/{guide}`
 * and `/campus/{id}` had **no width and no padding at all**, so their content
 * sat flush against the navigation rail. Half of them also forgot `lang` and
 * the Sinhala class, which is what gives Sinhala the extra leading it needs
 * (see the `[lang]` rule in `app/globals.css`); on those screens Sinhala was
 * being set with Latin metrics.
 *
 * So the container is decided here, once, and a page chooses an intent rather
 * than a number. Three is the whole set on purpose — a fourth width is a
 * design decision, not a call-site convenience, and belongs in this file.
 *
 * ## Why this is not in `components/ds/index.tsx`
 *
 * It reads the locale cookie, so it pulls in `server-only`. `index.tsx` is
 * imported by client components (`PracticeSession`, `MockExamRunner`, the
 * Code Lab), and a `server-only` import reaching them would fail the build.
 * Same design system, separate module, for a build-graph reason.
 */
export type PageWidth = "wide" | "reading" | "narrow";

const WIDTH: Record<PageWidth, string> = {
  /** Two columns: a main column of work plus a ~320px rail beside it. */
  wide: "max-w-[1180px]",
  /** One column — a library, a list of cards, a report, long-form prose. */
  reading: "max-w-[820px]",
  /** A single form, where a long line would be harder to fill in, not easier. */
  narrow: "max-w-[520px]",
};

export async function PageShell({
  width = "wide",
  className,
  children,
}: {
  width?: PageWidth;
  className?: string;
  children: React.ReactNode;
}) {
  const loc = await localeAttrs();
  return (
    <main
      lang={loc.lang}
      className={clsx("mx-auto px-4 py-5 sm:px-6 sm:py-6", WIDTH[width], loc.className, className)}
    >
      {children}
    </main>
  );
}
