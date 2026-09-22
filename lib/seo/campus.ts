import type { Metadata } from "next";

/**
 * Metadata for the Campus Ready cluster — every page about the move from A/Ls
 * to university: Campus Ready itself, the Survival Pack, Campus Match, the
 * Z-score and cut-off pages, the after-A/L and UGC guides, the `/campus/*`
 * guides.
 *
 * ## Why a helper and not a literal per page
 *
 * Next merges `metadata` with the root layout's **shallowly**. A page that sets
 * `title` and `description` but not `openGraph` inherits the root layout's
 * `openGraph` whole — so a WhatsApp share of the Z-score checker used to show
 * "A/L ICT Classes & Past Papers". A page that sets `openGraph` but not
 * `siteName` or `locale` loses those too. Building all three objects here
 * means a Campus page cannot forget one.
 *
 * ## Keeping the two clusters apart
 *
 * These pages never lead with "A/L ICT" in the title, the share card or the
 * slug. The A/L ICT pages rank for tuition queries; this cluster ranks for
 * what a student searches once the exam is behind them. The one bridge between
 * the two is `/university-pathways`, which keeps its ICT framing on purpose.
 *
 * `languages` is for a page that has a Sinhala twin under `/si/`: both sides
 * name each other and `x-default` points at the English one, which is what
 * lets Google show the Sinhala page to a Sinhala searcher instead of treating
 * the pair as duplicates.
 */
export function campusMetadata({
  title,
  description,
  path,
  keywords,
  languages,
  locale = "en_LK",
  image = "/images/dr-yasas.png",
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  languages?: { en: string; si: string };
  locale?: "en_LK" | "si_LK";
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(languages
        ? {
            languages: {
              "en-LK": languages.en,
              "si-LK": languages.si,
              "x-default": languages.en,
            },
          }
        : {}),
    },
    ...(keywords ? { keywords } : {}),
    openGraph: {
      type: "website",
      siteName: "ICT Campus",
      locale,
      title,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
