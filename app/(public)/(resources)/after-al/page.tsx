import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AdmissionCalendar } from "@/components/content/AdmissionCalendar";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { ButtonLink, Card, IconBadge, PageHeader, SectionHeading } from "@/components/ds";
import type { IconName } from "@/components/ui/Icon";
import {
  CALENDAR_CHECKED_ON,
  LAST_CYCLE,
  NEXT_CYCLE,
  WAIT_MONTHS,
} from "@/lib/content/admission-calendar";
import { campusMetadata } from "@/lib/seo/campus";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = "What to do after A/L — a guide for the wait";
const DESCRIPTION =
  "Finished your A/Ls? The dates from exam to lecture, the five routes after A/L in Sri Lanka, and what to do in the months before university. Free and sourced.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/after-al",
  languages: { en: "/after-al", si: "/si/after-al" },
  keywords: [
    "what to do after A/L",
    "after A/L Sri Lanka",
    "after A/L what to do",
    "A/L iwara unata passe",
    "campus waiting period",
    "university waiting time Sri Lanka",
    "උසස් පෙළෙන් පසු",
    "campus යනකන් මොකද කරන්නේ",
  ],
});

// Static: every fact here comes from `lib/content/admission-calendar.ts`, and
// a deploy is what changes it.
export const revalidate = 86400;

/**
 * What to do after A/L — the informational half of the Campus Ready cluster.
 *
 * ## The split with `/campus-ready`
 *
 * Both pages could answer "what to do after A/L", and two pages chasing one
 * query rank worse than one. So this page is the neutral guide — every route
 * after A/L, with dates and sources, including the ones that have nothing to
 * do with us — and `/campus-ready` is the course. This page recommends Campus
 * Ready once, where it honestly belongs: in "what to do while you wait".
 *
 * ## No names
 *
 * Private campuses and institutes are described as a kind, never by name.
 * Naming them turns an advice page into a comparison page, and a comparison
 * page written by someone selling a course is not advice.
 */

const ROUTES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "school",
    title: "A state university, through the UGC",
    body: "Free tuition, chosen by Z-score, district and the order of your preferences on one online application. Most students aim here first. Check which courses your stream can apply for, and what last year's cut-off was in your district, before the application window opens.",
  },
  {
    icon: "auto_stories",
    title: "An external or distance degree",
    body: "Several state universities and the Open University of Sri Lanka run external and distance degrees with their own entry rules, usually not decided by Z-score. You study mostly on your own, often while working. Check the university's own site for the current intake.",
  },
  {
    icon: "account_balance",
    title: "A private degree",
    body: "Non-state institutes award degrees, some of their own and some from foreign universities. Fees are high and quality varies. Before paying anything, check that the degree is recognised by the Ministry of Higher Education or the UGC for the job you want.",
  },
  {
    icon: "workspace_premium",
    title: "A professional qualification",
    body: "Accounting, management and IT bodies run qualifications you can start straight after A/L and study for while working. Some are accepted by employers on their own; some can be combined with a degree later.",
  },
  {
    icon: "work",
    title: "Vocational training",
    body: "NVQ-level courses through government and approved training centres lead directly to skilled work. Short, practical and often cheap or free.",
  },
];

const WHILE_YOU_WAIT: string[] = [
  "Learn Word and Excel properly — styles, automatic contents, formulas, charts. Every degree assumes you can.",
  "Improve your English reading and writing. Lectures, textbooks and exams in most degrees are in English.",
  "Learn to reference sources and to use AI honestly. First-year assignments are marked on both.",
  "Try one piece of programming or data work, even if your degree is not in IT. Every faculty now uses data.",
  "Read what first year of each degree on your list actually teaches, so your preference order is a real choice.",
  "Earn, volunteer or help at home if you can — and keep one regular study habit so the first semester is not a shock.",
];

const FAQS = [
  {
    q: "How long is the wait between A/L and university?",
    a: `Usually ${WAIT_MONTHS} from sitting the exam to the first lecture, and sometimes longer. Results, the UGC application, re-scrutiny, cut-offs, selection and the university's own registration each take their turn.`,
  },
  {
    q: "Where do I find my Z-score?",
    a: "It is printed on your A/L results sheet from the Department of Examinations. It shows how you did compared with everyone else who sat the same subjects, not your raw marks.",
  },
  {
    q: "When do I apply to university?",
    a: "Online at ugc.ac.lk, in a window the UGC announces after results. For the 2025/2026 intake it ran from 28 April to 19 May 2026, and no late applications were accepted.",
  },
  {
    q: "What if my Z-score is below last year's cut-off?",
    a: "Cut-offs move every year, so apply for the courses you want anyway, and add courses you are more likely to get further down your list. If you are not selected, you can sit the A/L again, or take one of the other routes on this page.",
  },
  {
    q: "Is it worth doing a course while I wait?",
    a: "Yes, if it teaches something your degree will assume and nobody will teach you — computer skills, English, referencing. Be wary of paying a large amount for a certificate a university or employer will not recognise.",
  },
];

export default function AfterAlPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/after-al",
            dateModified: "2026-09-22",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "After A/L", path: "/after-al" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="mb-4 text-sm">
          <Link
            href="/si/after-al"
            lang="si"
            className="text-ict-fg-mute underline underline-offset-4 hover:text-ict-fg"
          >
            සිංහලෙන් කියවන්න
          </Link>
        </p>
        <PageHeader
          eyebrow="Free guide · after A/L"
          title="What to do after A/L"
          subtitle={`The exam is over and university is ${WAIT_MONTHS} away. Here is what happens between now and your first lecture, every route open to you, and how to use the wait.`}
        />

        <section className="mt-12">
          <SectionHeading as="h2">From exam to lecture: the dates</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            If you sat the A/L in 2026, this is your year. Dates checked {CALENDAR_CHECKED_ON}.
          </p>
          <div className="mt-5">
            <AdmissionCalendar steps={NEXT_CYCLE} />
          </div>

          <h3 className="mt-8 font-display text-lg font-bold text-ict-fg">What happened last time</h3>
          <p className="mt-1 text-sm text-ict-fg-mute">
            The 2025 A/L cycle, for the 2025/2026 intake. The best guide to the shape of yours.
          </p>
          <div className="mt-4">
            <AdmissionCalendar steps={LAST_CYCLE} />
          </div>

          <p className="mt-5 text-sm text-ict-fg-soft">
            New to Z-scores?{" "}
            <Link href="/z-score" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              How the Z-score works
            </Link>
            . Last round&apos;s cut-off for every course is on{" "}
            <Link href="/z-score-cutoffs" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              one page per course
            </Link>
            . When results are out,{" "}
            <Link href="/ugc-application-guide" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              here is how the UGC application works
            </Link>
            . Or see where last round&apos;s cut-offs sit against your own Z-score:{" "}
            <Link
              href="/university-pathways#check"
              className="font-semibold text-ict-accent-fg underline underline-offset-4"
            >
              Use the free checker
            </Link>
            .
          </p>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">Five routes after A/L</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            A state university is not the only way to a degree or a career. Most students keep more
            than one of these open until selection results are out.
          </p>
          <ul className="mt-5 space-y-3">
            {ROUTES.map((r) => (
              <li key={r.title}>
                <Card radius="card" className="flex gap-4 p-5">
                  <IconBadge icon={r.icon} size={40} />
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-ict-fg">{r.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ict-fg-soft">{r.body}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">What to do while you wait</SectionHeading>
          <Card radius="card" className="mt-5 p-6">
            <ul className="space-y-3">
              {WHILE_YOU_WAIT.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ict-fg-soft">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-fg-dim" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>

          {/* The one feature card on the page, and the one place it sells. */}
          <Card variant="feature" radius="panel" className="mt-5 p-6 sm:p-8">
            <h3 className="font-display text-lg font-extrabold">
              Do the first four in one go, with a teacher
            </h3>
            <p className="mt-2 text-sm text-ict-on-feature-soft">
              Campus Ready is a 12-week online course in Sinhala for exactly this wait: Word and
              Excel, Python, statistics, referencing and honest use of AI, taught by Dr. Yasas Sri
              Wickramasinghe. One payment, two intakes a year. It needs a laptop.
            </p>
            <ButtonLink href="/campus-ready" variant="primary" className="mt-5">
              See Campus Ready
            </ButtonLink>
          </Card>
        </section>

        <FaqList faqs={FAQS} heading="Common questions after A/L" />

        <CampusFooter exclude={["/after-al"]} />
      </main>
    </>
  );
}
