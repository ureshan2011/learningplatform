import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { ZScoreForm } from "@/components/content/ZScoreForm";
import { Card, PageHeader, SectionHeading } from "@/components/ds";
import { EXAMPLE_FINAL_Z, EXAMPLE_SUBJECTS, subjectZ, z4 } from "@/lib/content/z-score";
import { campusMetadata } from "@/lib/seo/campus";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = "What is a Z-score? How the A/L Z-score works";
const DESCRIPTION =
  "The A/L Z-score explained simply: what it measures, how it is calculated from your three subjects, a worked example, and why cut-offs differ by district and year.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/z-score",
  languages: { en: "/z-score", si: "/si/z-score" },
  keywords: [
    "what is z score",
    "z score A/L",
    "how to calculate z score",
    "z score Sri Lanka",
    "z score kiyanne mokakda",
    "z score hadanne kohomada",
    "Z ලකුණ",
    "Z ලකුණ ගණනය කරන්නේ කොහොමද",
  ],
});

/**
 * The Z-score explained.
 *
 * ## No raw-marks calculator, on purpose
 *
 * The pages that rank for "z score calculator" ask for raw marks and print a
 * number. They cannot know the answer: a subject's Z-score depends on that
 * year's average and spread for that subject, which are not published before
 * results. This page teaches the method with a clearly invented example and
 * then does the thing that is actually possible — takes the Z-score from the
 * results sheet and shows which courses it reached last round.
 */

const FAQS = [
  {
    q: "What is a Z-score in A/L?",
    a: "A number that shows how far your result in each subject was above or below the average of everyone who sat that subject in the same year, measured in standard deviations. Your final Z-score is the average of your three subjects' Z-scores. It is printed on your results sheet.",
  },
  {
    q: "Can I calculate my Z-score from my marks?",
    a: "Not in advance. You need each subject's island-wide average and standard deviation for that year, and those are not published before results. Online calculators that take raw marks are guessing those numbers.",
  },
  {
    q: "Is a Z-score of 1 good?",
    a: "It means you were one standard deviation above the average across your three subjects — well above the middle. Whether it is enough depends on the course and your district. Compare it with last round's cut-off for the courses you want.",
  },
  {
    q: "Why does the same course need a different Z-score in each district?",
    a: "Many university places are allocated district by district, so each district has its own competition and its own cut-off. That is why the UGC publishes one cut-off per course, per university, per district.",
  },
  {
    q: "Why do cut-offs change every year?",
    a: "A cut-off is simply the Z-score of the last student selected. It moves with how many students applied, how they performed, how many places there are and the order students put the courses in. Last year's cut-off is a guide, not a promise.",
  },
];

export default function ZScorePage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/z-score",
            dateModified: "2026-09-22",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Z-score", path: "/z-score" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="mb-4 text-sm">
          <Link
            href="/si/z-score"
            lang="si"
            className="text-ict-fg-mute underline underline-offset-4 hover:text-ict-fg"
          >
            සිංහලෙන් කියවන්න
          </Link>
        </p>
        <PageHeader
          eyebrow="Free guide · university admission"
          title="What is a Z-score?"
          subtitle="The number on your A/L results sheet that decides which state university course you can get. What it measures, how it is worked out, and what to do with yours."
        />

        <Card radius="card" className="mt-8 p-6">
          <h2 className="font-display text-lg font-extrabold text-ict-fg">The short answer</h2>
          <p className="mt-2 text-sm leading-relaxed text-ict-fg-soft">
            Your Z-score compares you with everyone who sat the same subjects in the same year. In
            each subject it measures how far your mark was above or below the average, in units of
            that subject&apos;s spread (its standard deviation). Your final Z-score is the average
            of your three subjects. That way a hard paper and an easy paper are put on the same
            scale, and a student is not punished for choosing a subject that was marked harshly
            that year.
          </p>
          <p lang="si" className="mt-3 text-sm leading-relaxed text-ict-fg-soft">
            සරලවම, Z-score එකෙන් පෙන්නන්නේ ඒ අවුරුද්දේ ඒ subject එක ලියපු අනිත් හැමෝටම වඩා ඔයා
            කොච්චර ඉස්සරහින්ද පස්සෙන්ද කියලා. subject තුනේම Z-score වල සාමාන්‍යය තමයි ඔයාගේ final
            Z-score එක.
          </p>
        </Card>

        <section className="mt-12">
          <SectionHeading as="h2">How it is calculated</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <p className="text-sm text-ict-fg-soft">For each subject:</p>
            <p className="mt-2 rounded-ict-md bg-ict-surface px-4 py-3 font-mono text-sm text-ict-fg">
              z = (your mark − subject average) ÷ subject standard deviation
            </p>
            <p className="mt-4 text-sm text-ict-fg-soft">Then:</p>
            <p className="mt-2 rounded-ict-md bg-ict-surface px-4 py-3 font-mono text-sm text-ict-fg">
              Z-score = (z₁ + z₂ + z₃) ÷ 3
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ict-fg-mute">
              A Z-score of 0 is exactly average. Positive is above average, negative is below. Most
              students fall between about −2 and +2, and a Z-score above 2 is rare.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading as="h2">A worked example</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            The numbers below are invented to show the method. Real averages and standard deviations
            change every year and are not published before results.
          </p>
          <Card radius="card" className="mt-4 p-4 sm:p-6">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-xs text-ict-fg-mute">
                  <th scope="col" className="py-2 font-semibold">Subject</th>
                  <th scope="col" className="py-2 text-right font-semibold">Mark</th>
                  <th scope="col" className="py-2 text-right font-semibold">Avg</th>
                  <th scope="col" className="py-2 text-right font-semibold">SD</th>
                  <th scope="col" className="py-2 text-right font-semibold">z</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_SUBJECTS.map((s) => (
                  <tr key={s.subject} className="border-t border-ict-line">
                    <th scope="row" className="py-2 text-left font-normal text-ict-fg-soft">{s.subject.replace("Subject ", "S")}</th>
                    <td className="py-2 text-right font-mono text-ict-fg">{s.mark}</td>
                    <td className="py-2 text-right font-mono text-ict-fg">{s.average}</td>
                    <td className="py-2 text-right font-mono text-ict-fg">{s.sd}</td>
                    <td className="py-2 text-right font-mono text-ict-fg">{z4(subjectZ(s))}</td>
                  </tr>
                ))}
                <tr className="border-t border-ict-line-strong">
                  <th scope="row" colSpan={4} className="py-2 text-left font-semibold text-ict-fg">
                    Z-score (average of the three)
                  </th>
                  <td className="py-2 text-right font-mono font-bold text-ict-fg">{z4(EXAMPLE_FINAL_Z)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading as="h2">Why your district matters</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <p className="text-sm leading-relaxed text-ict-fg-soft">
              Selection uses your Z-score together with the district you sat the exam from. Many
              places on each course are allocated district by district, so the same course has a
              different cut-off in every district, and some courses are filled on island-wide merit
              alone. That is why a Z-score that reached Medicine in one district may not have reached
              it in another.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ict-fg-soft">
              See every course&apos;s cut-off in every district:{" "}
              <Link href="/z-score-cutoffs" className="font-semibold text-ict-accent-fg underline underline-offset-4">
                Z-score cut-offs by course
              </Link>
              .
            </p>
          </Card>
        </section>

        {/* The one feature card: the Z-score is only useful against a course. */}
        <Card variant="feature" radius="panel" className="mt-12 p-6 sm:p-8">
          <h2 className="font-display text-lg font-extrabold">Have your Z-score? See what it reached</h2>
          <p className="mt-2 mb-5 text-sm text-ict-on-feature-soft">
            Every course your stream can apply for, against last round&apos;s cut-off in your
            district. Free, no sign-in.
          </p>
          <ZScoreForm />
        </Card>

        <FaqList faqs={FAQS} heading="Common questions about the Z-score" />

        <CampusFooter exclude={["/z-score"]} />
      </main>
    </>
  );
}
