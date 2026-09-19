import Link from "next/link";
import type { Metadata } from "next";
import { COMMAND_WORDS } from "@/lib/content/command-words";
import { CommandWordsBody } from "@/components/content/CommandWordsBody";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { PageHeader } from "@/components/ds-cream";

export const metadata: Metadata = {
  title: "ICT exam command words explained",
  description:
    "What 'state', 'explain', 'distinguish' and every other A/L ICT command word actually requires — free, in English and Sinhala.",
  alternates: { canonical: "/command-words" },
};

// Fixed reference content — safe to cache like the free notes page.
export const revalidate = 86400;

const FAQS = COMMAND_WORDS.map((cw) => ({
  q: `What does the command word "${cw.word}" require in an A/L ICT exam answer?`,
  a: cw.meaning,
}));

/**
 * The single highest-leverage, lowest-cost content page on the platform:
 * losing marks for misreading a command word is one of the most common and
 * most fixable mistakes in A/L ICT, and this list needs no teacher
 * authoring or Firestore reads to exist.
 */
export default function CommandWordsPage() {
  return (
    <>
      {/*
        Guest header always, deliberately — see the same note on /notes.
        This page is fixed static content cached for a day; reading the
        session would force it to render dynamically per-visitor for no
        real benefit.
      */}
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Command words", path: "/command-words" },
        ])}
      />
      <SiteHeader user={null} />
      <main className="bg-ict-paper-100">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <PageHeader
            eyebrow="Free resource"
            title="ICT exam command words, explained"
            subtitle={
              'Every year, students who know the ICT syllabus cold still lose marks — not on content, but on misreading what a question is actually asking for. "Explain" is not "state". "Distinguish" is not "describe". Here is exactly what each one requires.'
            }
          />

          <div className="mt-8">
            <CommandWordsBody />
          </div>

          <p className="mt-8 text-sm text-ict-ink-500">
            Want to see &quot;distinguish&quot; done properly, worked example by worked example?{" "}
            <Link href="/distinguish-between" className="font-semibold text-ict-orange-600 underline underline-offset-2">
              10 fully worked pairs, free
            </Link>
            .
          </p>

          <FreeResourcesFooter exclude={["/command-words"]} />

          <ResourcePageCta
            title="Drill these until they're automatic"
            body={
              'Every subject\'s Practice section includes command-word drill questions — short scenarios that check whether you\'d actually answer a "distinguish" or a "justify" correctly under exam conditions.'
            }
            guestHref="/signin"
            guestLabel="Join a class"
          />
        </div>
      </main>
    </>
  );
}
