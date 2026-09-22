import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AdmissionCalendar } from "@/components/content/AdmissionCalendar";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ds";
import { CALENDAR_CHECKED_ON, LAST_CYCLE, NEXT_CYCLE } from "@/lib/content/admission-calendar";
import { campusMetadata } from "@/lib/seo/campus";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = "UGC university application guide 2026/2027";
const DESCRIPTION =
  "How to apply to a Sri Lankan state university through the UGC: the dates, what to prepare before the window opens, how to order your courses, aptitude tests and common mistakes.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/ugc-application-guide",
  keywords: [
    "UGC application 2026/2027",
    "university application Sri Lanka",
    "UGC online application",
    "how to fill UGC application",
    "university application closing date",
    "UGC handbook",
    "course preference order UGC",
    "විශ්වවිද්‍යාල අයදුම්පත",
    "ugc application eka fill karanne kohomada",
  ],
});

export const revalidate = 86400;

/**
 * How the UGC application works, for the student about to fill one in.
 *
 * ## Dated, and honest about which dates are known
 *
 * The next window is not announced until after results. So the page shows
 * the last cycle's confirmed dates as the shape to expect, the next cycle's as
 * expected, and the day the calendar was last checked. Update
 * `lib/content/admission-calendar.ts` the day the UGC announces — every page
 * reading it moves together.
 *
 * ## Never the authority
 *
 * The UGC handbook is. Everything here tells a student what to prepare and
 * what to check in the handbook, and never states an eligibility rule as if
 * this page were the source of it.
 */

const PREPARE: Array<{ title: string; body: string }> = [
  {
    title: "Your results sheet",
    body: "Your index number, your Z-score and your subject results are all on it. Keep a clear photo of it on your phone.",
  },
  {
    title: "The UGC handbook for your year",
    body: "It lists every course, which streams and subjects each one accepts, and which need an aptitude or practical test. It is sold at the UGC's registered outlets, and a digital copy can be bought on the UGC website. Read it before the window opens, not during.",
  },
  {
    title: "A long list of courses you are eligible for",
    body: "Start from every course your stream can apply for, then check each one's subject and grade rules in the handbook. The free checker gives you the first list in a minute.",
  },
  {
    title: "Last round's cut-off for each, in your district",
    body: "A course far above your Z-score in your district is a long shot. A course well below it is a safe option. Most good lists have both.",
  },
];

const ORDER_RULES: string[] = [
  "Put the course you want most at the top, even if it is a stretch. You are offered the highest course on your list whose cut-off you clear, so a stretch at the top costs you nothing if you miss it.",
  "Below it, mix courses you are likely to get with ones that could go either way.",
  "Keep at least a couple of courses near the bottom that your Z-score comfortably cleared last round in your district.",
  "Only list courses you would actually go to. If you clear one, that is the one you are offered — so a course you would turn down should not be on the list at all.",
  "Check the aptitude-test courses. A student who fails an aptitude or practical test is still considered for the other courses on their list, according to the handbook — but the test has its own dates you must not miss.",
];

const MISTAKES: string[] = [
  "Leaving it to the last day. Anything that goes wrong then cannot be fixed, and no late application is accepted.",
  "Listing a course you are not eligible for because of a subject or grade rule you did not check in the handbook.",
  "Guessing an order on the day instead of deciding it beforehand, with last round's cut-offs in front of you.",
  "Not keeping a copy or screenshot of the submitted application and its confirmation.",
];

const FAQS = [
  {
    q: "When does the UGC application open?",
    a: "After A/L results are released, on dates the UGC announces. For the 2025/2026 intake it ran from 28 April to 19 May 2026. Watch ugc.ac.lk and the news once results are out.",
  },
  {
    q: "Can I apply on paper?",
    a: "No. Applications are made online only, through the UGC website.",
  },
  {
    q: "How many courses should I list?",
    a: "Enough that at least one is very likely to come through. The handbook for your year states the rules for the form; read it before you start.",
  },
  {
    q: "What if I am not selected?",
    a: "You can sit the A/L again the next year, or take another route — an external or distance degree, a professional qualification or vocational training. The after-A/L guide covers each.",
  },
];

export default function UgcApplicationGuidePage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/ugc-application-guide",
            dateModified: "2026-09-22",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "After A/L", path: "/after-al" },
            { name: "UGC application guide", path: "/ugc-application-guide" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free guide · university admission"
          title="How to apply to university through the UGC"
          subtitle="Last time the online application was open for three weeks, and it decides where you study for the next several years. What to have ready before it opens, how to order your courses, and the mistakes that cost places."
        />

        <p lang="si" className="mt-4 text-sm text-ict-fg-soft">
          UGC application එක open වෙන්න කලින් ලෑස්ති කරගන්න දේවල්, courses දාන පිළිවෙළ, aptitude
          tests සහ ගොඩක් අය කරන වැරදි — එක තැනක.
        </p>

        <section className="mt-12">
          <SectionHeading as="h2">The dates</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            The next window is announced after results. Here is what is known, and what happened last
            time. Checked {CALENDAR_CHECKED_ON}.
          </p>
          <div className="mt-5">
            <AdmissionCalendar steps={NEXT_CYCLE.slice(1)} />
          </div>
          <h3 className="mt-8 font-display text-lg font-bold text-ict-fg">Last time</h3>
          <div className="mt-4">
            <AdmissionCalendar steps={LAST_CYCLE} />
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">Before the window opens</SectionHeading>
          <ol className="mt-5 space-y-3">
            {PREPARE.map((p, i) => (
              <li key={p.title}>
                <Card radius="card" className="flex gap-4 p-5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ict-surface-raised font-display text-sm font-bold text-ict-fg">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-ict-fg">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ict-fg-soft">{p.body}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-ict-fg-soft">
            Last round&apos;s cut-offs:{" "}
            <Link href="/z-score-cutoffs" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              every course, every district
            </Link>
            , or{" "}
            <Link href="/university-pathways#check" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              the free checker
            </Link>{" "}
            for just the ones your stream can apply for.
          </p>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">Ordering your courses</SectionHeading>
          <Card radius="card" className="mt-5 p-6">
            <ul className="space-y-3">
              {ORDER_RULES.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ict-fg-soft">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-fg-dim" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>

          {/* The one feature card: the order is exactly what Campus Match is for. */}
          <Card variant="feature" radius="panel" className="mt-5 p-6 sm:p-8">
            <h3 className="font-display text-lg font-extrabold">See what your list is likely to return</h3>
            <p className="mt-2 text-sm text-ict-on-feature-soft">
              Campus Match estimates your chance at every course on your list for the coming round,
              from eight rounds of UGC cut-offs in your district, and shows what the order you are
              about to submit is likely to give you. An estimate, not a promise.
            </p>
            <ButtonLink href="/campus-match" variant="primary" className="mt-5">
              See Campus Match
            </ButtonLink>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">Mistakes that cost places</SectionHeading>
          <Card radius="card" className="mt-5 p-6">
            <ul className="space-y-3">
              {MISTAKES.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ict-fg-soft">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-danger-fg" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <FaqList faqs={FAQS} heading="Common questions about the UGC application" />

        <p className="mt-10 text-xs leading-relaxed text-ict-fg-dim">
          The UGC handbook for your year is the authority on who may apply for what, and how the form
          works. ICT Campus is not affiliated with the UGC. Official site:{" "}
          <a href="https://www.ugc.ac.lk/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            ugc.ac.lk
          </a>
          .
        </p>

        <CampusFooter />
      </main>
    </>
  );
}
