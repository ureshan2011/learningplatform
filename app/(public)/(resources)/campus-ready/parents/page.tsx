import Link from "next/link";
import type { Metadata } from "next";
import { listCohorts, isEnrolmentOpen } from "@/lib/queries";
import { CAMPUS_READY } from "@/lib/content/campus-ready";
import { formatLKR } from "@/lib/format";
import { LAUNCH_NOTE, paymentsPaused } from "@/lib/payments/launch";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { ButtonLink, Card, Notice, PageHeader, SectionHeading } from "@/components/ds";
import { WAIT_MONTHS } from "@/lib/content/admission-calendar";
import { campusMetadata } from "@/lib/seo/campus";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import { TEACHER_CREDENTIALS, TEACHER_NAME } from "@/lib/seo/site";
import type { Subject } from "@/lib/types";

export const metadata: Metadata = campusMetadata({
  title: "Campus Ready for parents — what your child gets",
  description:
    "For parents of students who have finished their A/Ls: what Campus Ready teaches, who teaches it, what it costs, how payment and receipts work, and what it is not.",
  path: "/campus-ready/parents",
  keywords: [
    "course for my child after A/L",
    "after A/L course for students Sri Lanka",
    "දරුවා A/L ඉවර වුණාම",
    "campus යන්න කලින් course",
  ],
});

// Reads the next intake's fee, like the Campus Ready page; cached for an hour.
export const revalidate = 3600;

/**
 * Campus Ready, written for the person who pays.
 *
 * A parent is not searching "Python course"; they are deciding whether a year
 * at home is being wasted and whether this particular teacher and this
 * particular payment are safe. So this page answers those questions directly —
 * who, what, how much, how to pay, what you get back on paper — and repeats
 * the three things the programme is not (accredited, one-to-one, phone-only),
 * because a parent who finds them out later asks for a refund.
 *
 * It is also the link a student forwards to a parent on WhatsApp, which is why
 * it carries its own share card and a Sinhala summary at the top.
 */

const WHAT_IT_TEACHES: string[] = [
  "Word and Excel properly — the assignment format and spreadsheet work every degree assumes.",
  "Python and basic statistics, taught for students who have never programmed.",
  "Power BI dashboards, and a final project on real Sri Lankan data for a CV.",
  "Referencing with Zotero, and how to use AI in assignments without breaking university rules.",
];

export default async function CampusReadyParentsPage() {
  const cohorts = await listCohorts().catch(() => [] as Subject[]);
  // eslint-disable-next-line react-hooks/purity -- server render; see /campus-ready
  const now = Date.now();
  const enrolling = cohorts.filter((c) => isEnrolmentOpen(c, now)).at(-1)?.cohort;
  const fee = formatLKR(enrolling?.feeLKR ?? CAMPUS_READY.feeLKR);
  const paused = paymentsPaused();

  const faqs = [
    {
      q: "How much does it cost?",
      a: `${fee} for the whole ${CAMPUS_READY.weeks}-week programme, paid once. There is no monthly fee and nothing renews automatically.`,
    },
    {
      q: "How do we pay, and do we get a receipt?",
      a: "By card through PayHere, by uploading a bank deposit slip, or in cash or transfer recorded by the teacher. All three issue a numbered receipt from the same series.",
    },
    {
      q: "Does my child need a laptop?",
      a: "Yes. This is the one hard requirement. Power BI runs on Windows only and Python work is impractical on a phone. Please do not enrol without access to a laptop.",
    },
    {
      q: "Is the certificate accredited?",
      a: `No. It is issued by ICT Campus and signed by ${TEACHER_NAME}, and it is not accredited by any university or awarding body. It is earned by assessment, carries a code anyone can check, and comes with a portfolio project your child can show.`,
    },
    {
      q: "Is there one-to-one tutoring?",
      a: "No. Classes are live and shared with the cohort, recordings stay available, and marking is automatic or by structured peer review. That is what keeps the fee at one payment.",
    },
    {
      q: "Is it safe for my child online?",
      a: "Students sign in with their own mobile number and a one-time SMS code, so there is no password to share or lose. Classes are live and online, taught by the teacher named on this page.",
    },
  ];

  return (
    <>
      <JsonLd
        data={graphJsonLd([
          faqJsonLd(faqs),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Campus Ready", path: "/campus-ready" },
            { name: "For parents", path: "/campus-ready/parents" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Campus Ready · for parents"
          title="If your child has just finished their A/Ls"
          subtitle={`There are usually ${WAIT_MONTHS} between the last paper and the first lecture. This is what Campus Ready does with that time, who teaches it, and what it costs.`}
        />

        <Card radius="card" className="mt-8 p-6">
          <p lang="si" className="text-sm leading-relaxed text-ict-fg-soft">
            ඔයාගේ දරුවා A/L ඉවර කරලා campus යනකන් ඉන්නවා නම්: Campus Ready කියන්නේ සති{" "}
            {CAMPUS_READY.weeks}ක online course එකක්, සිංහලෙන්. University එකේ පළවෙනි දවසේ ඉඳන්
            ඕන වෙන computer සහ academic skills උගන්වනවා. ගාස්තුව {fee}, එක පාරක් විතරයි. Laptop
            එකක් ඕන.
          </p>
        </Card>

        <section className="mt-12">
          <SectionHeading as="h2">What your child learns</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <ul className="space-y-3">
              {WHAT_IT_TEACHES.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ict-fg-soft">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-fg-dim" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-ict-fg-mute">
              One live class a week for {CAMPUS_READY.weeks} weeks, online, taught in Sinhala with
              technical words in English. Every class is recorded and stays available after the
              programme ends. It suits any faculty — management, arts, science, health, education or
              IT.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading as="h2">Who teaches it</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <p className="font-display text-base font-bold text-ict-fg">{TEACHER_NAME}</p>
            <ul className="mt-3 space-y-1.5">
              {TEACHER_CREDENTIALS.map((c) => (
                <li key={c} className="text-sm text-ict-fg-soft">
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/dr-yasas" className="font-semibold text-ict-accent-fg underline underline-offset-4">
                Full profile
              </Link>
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading as="h2">What it is not</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <p className="text-sm leading-relaxed text-ict-fg-soft">
              It is not a degree, not accredited by any university, and not one-to-one tuition. It
              does not work on a phone alone. We say this plainly here because these are the things
              that disappoint a family when found out after paying. See the{" "}
              <Link href="/refund-policy" className="underline underline-offset-4">
                refund policy
              </Link>{" "}
              before you pay.
            </p>
          </Card>
        </section>

        {/* The one feature card on the page. */}
        <Card variant="feature" radius="panel" className="mt-12 p-6 sm:p-8">
          <p className="font-display text-3xl font-extrabold tracking-[-0.03em]">{fee}</p>
          <p className="mt-1 text-sm text-ict-on-feature-soft">
            Once, for all {CAMPUS_READY.weeks} weeks. Two intakes a year, in January and July.
          </p>
          {paused ? (
            <div className="mt-4">
              <Notice tone="info">{LAUNCH_NOTE.short}</Notice>
            </div>
          ) : null}
          <ButtonLink href="/campus-ready#intakes" variant="primary" className="mt-5">
            See intakes and enrol
          </ButtonLink>
        </Card>

        <FaqList faqs={faqs} heading="Questions parents ask" />

        <CampusFooter />
      </main>
    </>
  );
}
