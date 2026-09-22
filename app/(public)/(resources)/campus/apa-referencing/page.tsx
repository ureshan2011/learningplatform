import type { Metadata } from "next";
import { PACK_GUIDES, SURVIVAL_PACK } from "@/lib/content/survival-pack";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { GuideSections } from "@/components/content/GuideSections";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { PageHeader } from "@/components/ds";
import { campusMetadata } from "@/lib/seo/campus";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = "APA referencing for Sri Lankan students — APA 7 examples";
const DESCRIPTION =
  "How APA 7 referencing works, with real examples: in-text and reference list, a book and a journal article. Free, from the Campus Survival Pack.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/campus/apa-referencing",
  keywords: [
    "APA referencing",
    "APA 7 examples",
    "APA referencing Sri Lanka",
    "how to reference a book APA",
    "in-text citation APA",
    "APA reference එකක් ලියන හැටි",
  ],
});

export const revalidate = 86400;

/**
 * The free sample from the Survival Pack's referencing guide: how references
 * work, a book and a journal article, given away whole. Websites, reports,
 * lecture slides, AI tools and Harvard stay in the pack.
 *
 * Same reasoning as `/campus/academic-email`: "how to reference in APA" is
 * typed into Google the night before a first assignment is due, and answering
 * it properly is how the person the pack is for finds it.
 */
const GUIDE = PACK_GUIDES.find((g) => g.key === "apa-harvard");
const FREE_SECTIONS = GUIDE?.sections.slice(0, 3) ?? [];

const FAQS = [
  {
    q: "What is the difference between APA and Harvard?",
    a: "Both are author-and-year styles, so they look alike. The differences are in the details — punctuation, where the year goes, how titles are formatted. Use whichever your department's handbook names, and use it the same way throughout.",
  },
  {
    q: "Do I number the reference list?",
    a: "No. In APA the reference list is sorted alphabetically by the first author's surname and is not numbered.",
  },
  {
    q: "Can I use AI to find sources?",
    a: "Only as a starting point. AI tools sometimes invent titles, authors and DOIs that look real and do not exist. Open every source yourself before you cite it; if you cannot open it, do not cite it.",
  },
];

export default function ApaReferencingPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/campus/apa-referencing",
            dateModified: "2026-09-22",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Campus guides", path: "/campus" },
            { name: "APA referencing", path: "/campus/apa-referencing" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free guide · first year"
          title="APA referencing, with real examples"
          subtitle="How a reference works, and exactly how to write the two you will use most: a book and a journal article. Every example is a real source."
        />

        <GuideSections sections={FREE_SECTIONS} />

        <FaqList faqs={FAQS} heading="Common questions" />

        <div className="mt-8">
          <ResourcePageCta
            title={SURVIVAL_PACK.name}
            body="The full guide covers websites, government reports, lecture slides and AI tools, in APA 7 and Harvard, with a Zotero library of Sri Lankan sources ready to cite. Plus an assignment template with automatic contents and more."
            guestHref="/campus-survival-pack"
            guestLabel="See what's inside"
          />
        </div>

        <CampusFooter exclude={["/campus/apa-referencing"]} />
      </main>
    </>
  );
}
