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

const TITLE = "Using AI in university assignments — the honest rules";
const DESCRIPTION =
  "Where help from ChatGPT and other AI tools ends and misconduct starts, the two mistakes that get students caught, and what to do when your handbook bans it.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/campus/ai-rules",
  keywords: [
    "using AI in assignments",
    "ChatGPT for university assignments",
    "AI academic misconduct",
    "can I use ChatGPT at university Sri Lanka",
    "AI declaration university",
  ],
});

export const revalidate = 86400;

/**
 * The free sample from the Survival Pack's AI guide: where the line is, the two
 * mistakes that get students caught, and what a module ban means. The
 * declaration section and its generator stay in the pack, because they are
 * the part a student uses rather than reads.
 */
const GUIDE = PACK_GUIDES.find((g) => g.key === "ai-rules");
const FREE_SECTIONS = GUIDE ? [GUIDE.sections[0], GUIDE.sections[1], GUIDE.sections[3]].filter(Boolean) : [];

const FAQS = [
  {
    q: "Is using ChatGPT at university cheating?",
    a: "Not by itself. Using it to explain a concept, check grammar or test yourself is usually fine. Submitting text or code it wrote as your own, or citing sources it produced without opening them, is misconduct. Your module handbook has the final word.",
  },
  {
    q: "Do I have to declare that I used AI?",
    a: "If your department asks for a declaration, yes — and more are asking every year. Declaring use within the rules costs you nothing. Not declaring, when asked later, is what causes trouble.",
  },
  {
    q: "Can a lecturer tell if I used AI?",
    a: "Not reliably from the writing alone, which is why the mistakes that actually get people caught are checkable ones: references that do not exist and numbers with no source.",
  },
];

export default function AiRulesPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/campus/ai-rules",
            dateModified: "2026-09-22",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Campus guides", path: "/campus" },
            { name: "Using AI honestly", path: "/campus/ai-rules" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free guide · first year"
          title="Using AI honestly at university"
          subtitle="Almost every first-year uses AI. Very few have been told where the line is. This is where it is, and the two mistakes that turn help into misconduct."
        />

        <GuideSections sections={FREE_SECTIONS} />

        <FaqList faqs={FAQS} heading="Common questions" />

        <div className="mt-8">
          <ResourcePageCta
            title={SURVIVAL_PACK.name}
            body="The full guide includes a generator that writes your AI-use declaration and a Word template for departments that want a signed page. Plus referencing guides, an assignment template and more."
            guestHref="/campus-survival-pack"
            guestLabel="See what's inside"
          />
        </div>

        <CampusFooter exclude={["/campus/ai-rules"]} />
      </main>
    </>
  );
}
