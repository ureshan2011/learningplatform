import type { Metadata } from "next";
import { BusinessModelCanvasBody } from "@/components/content/BusinessModelCanvasBody";
import { CANVAS_BLOCKS } from "@/lib/content/business-model-canvas";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { PageHeader } from "@/components/ds-cream";

export const metadata: Metadata = {
  title: "Business Model Canvas — tutorial and 90-minute group activity",
  description:
    "The nine blocks of the Business Model Canvas, the order to fill them in, a worked example, and a ready-to-run 90-minute group activity for teams of six with a run sheet, roles and a marking rubric.",
  alternates: { canonical: "/business-model-canvas" },
};

// Fixed reference content, like /command-words — nothing here reads Firestore
// or the session, so it caches for a day and renders identically for everyone.
export const revalidate = 86400;

const FAQS = CANVAS_BLOCKS.map((block) => ({
  q: `What does the "${block.title}" block of the Business Model Canvas answer?`,
  a: block.question,
}));

/**
 * The Business Model Canvas lesson.
 *
 * ## Why it is a standalone page and not a syllabus lesson
 *
 * It was asked for "under MBI800", which is not a course this platform has —
 * the only syllabus here is the fourteen-unit NIE A/L ICT one. Adding a unit
 * or a competency level to `lib/content/al-ict-units.ts` was not an option:
 * that file is a faithful transcription of the NIE syllabus, says so at the
 * top, and a lesson the NIE never wrote appearing inside it would be wrong in
 * a way that is hard to notice later.
 *
 * So it sits where the platform already keeps teaching content that is not a
 * syllabus competency — beside `/command-words` and `/distinguish-between`, as
 * its own crawlable page. It is deliberately **not** listed in the student
 * rail, the free library, or `FreeResourcesFooter`: those surfaces are for
 * Sri Lankan A/L ICT students, and a ninety-minute business-school group
 * exercise is not something to put in front of them.
 *
 * If MBI800 turns out to live on another platform, the whole lesson is
 * `lib/content/business-model-canvas.ts` plus one body component, and moving
 * it is an import change.
 */
export default function BusinessModelCanvasPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Business Model Canvas", path: "/business-model-canvas" },
        ])}
      />
      {/* Guest header always — see the same note on /notes. This page is fixed
          content cached for a day, and reading the session would force it to
          render per-visitor for no benefit. */}
      <SiteHeader user={null} />
      <main className="bg-ict-paper-100">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <PageHeader
            eyebrow="Teaching resource"
            title="The Business Model Canvas"
            subtitle="Nine boxes that describe how any business creates, delivers and captures value — and a ready-to-run 90-minute group activity that has students fill one in for a real business and pitch it to the class."
          />

          <div className="mt-8">
            <BusinessModelCanvasBody />
          </div>
        </div>
      </main>
    </>
  );
}
