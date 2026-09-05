import Link from "next/link";
import type { Metadata } from "next";
import { DISTINGUISH_PAIRS } from "@/lib/content/distinguish-between";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo/json-ld";

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
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold">
          <Icon name="fact_check" className="!text-2xl text-(--color-awaken-accent)" />
          &quot;Distinguish between&quot; questions, answered properly
        </h1>
        <p className="mt-3 text-(--color-awaken-ink-soft)">
          A &quot;distinguish&quot; question is worth 2–4 marks for one thing: a direct
          contrast between the two terms. Describing each one separately — even
          correctly — earns almost nothing. Here are ten of the most commonly asked
          pairs, each with the answer that loses marks and the one that doesn&apos;t.
        </p>
        <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
          New to command words in general?{" "}
          <Link href="/command-words" className="text-(--color-awaken-accent) underline">
            Start with what each one requires
          </Link>
          . Also free:{" "}
          <Link href="/number-systems" className="text-(--color-awaken-accent) underline">
            number system conversions
          </Link>{" "}
          and{" "}
          <Link href="/logic-gates" className="text-(--color-awaken-accent) underline">
            logic gate truth tables
          </Link>
          .
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Jump to a pair">
          {DISTINGUISH_PAIRS.map((p) => (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              className="rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-1.5 text-xs font-medium text-(--color-awaken-ink-soft) hover:border-(--color-awaken-accent) hover:text-(--color-awaken-accent)"
            >
              {p.termA} vs {p.termB}
            </a>
          ))}
        </nav>

        <ul className="mt-8 space-y-5">
          {DISTINGUISH_PAIRS.map((p) => (
            <li
              key={p.slug}
              id={p.slug}
              className="scroll-mt-20 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">
                  {p.termA} <span className="text-(--color-awaken-ink-soft) font-normal">vs</span> {p.termB}
                </h2>
                <span className="text-xs text-(--color-awaken-ink-soft)">{p.topic}</span>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-(--color-awaken-danger-soft) p-3 text-sm text-(--color-awaken-danger)">
                <Icon name="cancel" className="mt-0.5 shrink-0 !text-base" />
                <span>
                  <span className="font-semibold">Weak (~0–1 mark): </span>
                  {p.weakAnswer}
                </span>
              </div>

              <div className="mt-2 flex items-start gap-2 rounded-lg bg-(--color-awaken-success-soft) p-3 text-sm text-(--color-awaken-success)">
                <Icon name="check_circle" className="mt-0.5 shrink-0 !text-base" />
                <span>
                  <span className="font-semibold">Full marks: </span>
                  {p.strongAnswer}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-14 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
          <h2 className="text-lg font-bold">Get this checked in a live class</h2>
          <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
            Every subject&apos;s Practice section drills command words like this one under
            real exam pressure, with instant feedback on whether your contrast actually
            earns the mark.
          </p>
          <Link
            href="/signin"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white"
          >
            <Icon name="videocam" className="!text-base" />
            Join a class
          </Link>
        </section>
      </main>
    </>
  );
}
