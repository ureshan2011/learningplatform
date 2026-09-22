import Link from "next/link";
import type { Metadata } from "next";
import { DISTINGUISH_PAIRS } from "@/lib/content/distinguish-between";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { PageHeader, Card } from "@/components/ds";

export const metadata: Metadata = {
  title: `"Distinguish Between" Questions — 10 Worked A/L ICT Examples`,
  description:
    "Ten fully worked \"distinguish between\" answers for A/L ICT — RAM vs ROM, compiler vs interpreter, LAN vs WAN and more — with a weak answer and a full-marks answer side by side, free.",
  alternates: { canonical: "/distinguish-between" },
};

// Fixed reference content — safe to cache like the command-words page.
export const revalidate = 86400;

const FAQS = DISTINGUISH_PAIRS.map((p) => ({
  q: `Distinguish between ${p.termA} and ${p.termB}.`,
  a: p.strongAnswer,
}));

/**
 * The direct continuation of /command-words: that page explains WHAT
 * "distinguish" requires, this one shows it actually done, across the
 * syllabus's most commonly confused pairs — real content, not a stub, and
 * every pair is a stable CS fact rather than something that goes stale when
 * the syllabus is revised.
 */
export default function DistinguishBetweenPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Distinguish between", path: "/distinguish-between" },
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free resource"
          title={'"Distinguish between" questions, answered properly'}
          subtitle={
            'A "distinguish" question is worth 2–4 marks for one thing: a direct contrast between the two terms. Describing each one separately — even correctly — earns almost nothing. Here are ten of the most commonly asked pairs, each with the answer that loses marks and the one that doesn\'t.'
          }
        />
        <p className="mt-3 text-sm text-ict-fg-soft">
          New to command words in general?{" "}
          <Link href="/command-words" className="text-ict-accent-fg underline">
            Start with what each one requires
          </Link>
          .
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Jump to a pair">
          {DISTINGUISH_PAIRS.map((p) => (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              className="inline-flex h-[30px] items-center rounded-full bg-ict-surface-sunken px-3 text-xs font-semibold text-ict-fg transition-colors duration-[120ms] hover:bg-ict-orange-500/12 hover:text-ict-accent-fg"
            >
              {p.termA} vs {p.termB}
            </a>
          ))}
        </nav>

        <ul className="mt-8 space-y-5">
          {DISTINGUISH_PAIRS.map((p) => (
            <li key={p.slug} id={p.slug} className="scroll-mt-20">
              <Card radius="card" className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-ict-fg">
                    {p.termA} <span className="font-normal text-ict-fg-soft">vs</span> {p.termB}
                  </h2>
                  <span className="text-xs text-ict-fg-mute">{p.topic}</span>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-ict-md bg-ict-red-500/12 p-3 text-sm text-ict-danger-fg">
                  <Icon name="cancel" className="mt-0.5 shrink-0 !text-base" />
                  <span>
                    <span className="font-semibold">Weak (~0–1 mark): </span>
                    {p.weakAnswer}
                  </span>
                </div>

                <div className="mt-2 flex items-start gap-2 rounded-ict-md bg-ict-green-500/12 p-3 text-sm text-ict-green-500">
                  <Icon name="check_circle" className="mt-0.5 shrink-0 !text-base" />
                  <span>
                    <span className="font-semibold">Full marks: </span>
                    {p.strongAnswer}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <FreeResourcesFooter exclude={["/distinguish-between"]} />

        <ResourcePageCta
          title="Get this checked in a live class"
          body="Every subject's Practice section drills command words like this one under real exam pressure, with instant feedback on whether your contrast actually earns the mark."
          guestHref="/signin"
          guestLabel="Join a class"
        />
      </main>
    </>
  );
}
