import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { PredictedPaperDisclaimer } from "@/components/papers/PredictedPaperDisclaimer";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { Icon } from "@/components/ui/Icon";
import { Badge, ButtonLink, Card, Eyebrow, IconBadge, SectionHeading } from "@/components/ds-cream";
import { publicEnv } from "@/lib/env";
import {
  breadcrumbJsonLd,
  graphJsonLd,
  organizationJsonLd,
  personJsonLd,
} from "@/lib/seo/json-ld";
import { TEACHER_NAME } from "@/lib/seo/site";
import {
  AL_ICT_2027_PREDICTED_PAPER1,
  PREDICTED_PAPER1_QUESTION_COUNT,
  PREDICTED_PAPER_EXAM_YEAR_TARGET,
} from "@/lib/content/al-ict-2027-predicted-paper1";
import { AL_ICT_2027_PREDICTED_PAPER2 } from "@/lib/content/al-ict-2027-predicted-paper2";
import { AL_ICT_2027_FOCUS_AREAS } from "@/lib/content/al-ict-2027-focus-areas";

const PATH = "/papers/al-ict-2027-predicted-paper";
const SAMPLE_IDS = [1, 17, 31];
const TOTAL_QUESTIONS = PREDICTED_PAPER1_QUESTION_COUNT + AL_ICT_2027_PREDICTED_PAPER2.length;

export const metadata: Metadata = {
  title: "A/L ICT 2027 Predicted Paper — AI Exam Prediction, Free Preview",
  description:
    "The A/L ICT 2027 predicted paper — 60 MCQ, structured and essay questions built by ICT Campus's AI exam-prediction engine from 25 real past papers and the NIE syllabus, reviewed by Dr. Yasas Sri Wickramasinghe, PhD. Preview the focus areas free; sign in to unlock the full paper.",
  alternates: { canonical: PATH },
  keywords: [
    "A/L ICT 2027",
    "A/L ICT 2027 paper",
    "A/L ICT 2027 MCQ",
    "A/L ICT MCQ",
    "A/L ICT 2027 revision",
    "AL ICT revision 2027",
    "A/L ICT predicted paper",
    "A/L ICT model paper 2027",
    "A/L ICT shot paper 2027",
    "ICT A/L 2027",
    "grade 13 ICT 2027",
    "A/L ICT exam prediction",
    "උසස් පෙළ ICT 2027",
  ],
};

function jsonLd() {
  return graphJsonLd([
    organizationJsonLd(),
    personJsonLd(),
    {
      "@type": "LearningResource",
      "@id": `${publicEnv.appUrl}${PATH}#resource`,
      name: `A/L ICT ${PREDICTED_PAPER_EXAM_YEAR_TARGET} Predicted Paper`,
      description:
        "A probability-ranked focus list and full predicted paper for the Sri Lankan A/L ICT examination, built from historical pattern analysis and syllabus weighting — not a leaked paper, not a guarantee.",
      educationalLevel: "Advanced Level",
      about: { "@type": "Thing", name: "Information & Communication Technology" },
      learningResourceType: "Practice test",
      numberOfQuestions: TOTAL_QUESTIONS,
      inLanguage: ["si", "en"],
      author: { "@id": `${publicEnv.appUrl}/#teacher` },
      provider: { "@id": `${publicEnv.appUrl}/#organization` },
      isAccessibleForFree: false,
    },
  ]);
}

export default function PredictedPaperPromoPage() {
  const samples = AL_ICT_2027_PREDICTED_PAPER1.filter((q) => SAMPLE_IDS.includes(q.id));

  return (
    <>
      <JsonLd data={jsonLd()} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: `${PREDICTED_PAPER_EXAM_YEAR_TARGET} Predicted paper`, path: PATH }])} />
      <SiteHeader user={null} />

      <main className="bg-ict-paper-100">
        <section className="mx-auto max-w-3xl px-5 pt-10">
          <Eyebrow>AI exam-prediction engine</Eyebrow>
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-extrabold tracking-[-0.02em] text-ict-ink-900 sm:text-4xl">
            <Icon name="auto_awesome" className="!text-3xl text-ict-orange-500" />
            A/L ICT {PREDICTED_PAPER_EXAM_YEAR_TARGET} Predicted Paper
          </h1>
          <p className="mt-3 text-base text-ict-ink-400">
            Built by {TEACHER_NAME}&rsquo;s AI exam-prediction engine — run once against 25 real past-paper and syllabus
            files, scored for pattern, recency and syllabus weight, and cross-checked against current events. The
            highest-accuracy focus list we&rsquo;ve built for this subject yet: {PREDICTED_PAPER1_QUESTION_COUNT} MCQs and{" "}
            {AL_ICT_2027_PREDICTED_PAPER2.length} structured/essay questions, every one tagged with a confidence band
            and the exact evidence behind it.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={`/signin?next=/subjects/al-ict/predicted-paper&ref=predicted-paper-2027`} variant="primary" size="lg">
              Sign in to unlock the full paper
            </ButtonLink>
            <ButtonLink href="#focus-areas" variant="outline" size="lg" arrow="none">
              See the free focus areas
            </ButtonLink>
          </div>

          <div className="mt-6">
            <PredictedPaperDisclaimer lang="en" />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-8">
          <SectionHeading as="h2" className="!text-lg">
            How the prediction was built
          </SectionHeading>
          <ul className="mt-3 space-y-2 text-sm text-ict-ink-400">
            <li className="flex items-start gap-2">
              <Icon name="fact_check" className="!text-base mt-0.5 shrink-0 text-ict-orange-500" />
              594 real past-paper MCQs across 12 sittings (2011-2026), each tagged against the NIE syllabus&rsquo;s own
              competency numbering.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="auto_stories" className="!text-base mt-0.5 shrink-0 text-ict-orange-500" />
              The full NIE A/L ICT syllabus, including every unit&rsquo;s teaching-period allocation, so a topic that is
              over- or under-tested for its size shows up as a real statistical signal.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="search" className="!text-base mt-0.5 shrink-0 text-ict-orange-500" />
              Live web research for syllabus changes, exam-format announcements and the real Sri Lankan current
              events examiners tend to build scenario questions around — cited with a source and an access date, not
              invented.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="account_circle" className="!text-base mt-0.5 shrink-0 text-ict-orange-500" />
              Reviewed by <Link href="/dr-yasas" className="font-semibold text-ict-ink-900 underline">{TEACHER_NAME}</Link>, PhD in Human Interface
              Technology, University of Canterbury, before it reaches a single student.
            </li>
          </ul>
        </section>

        <section id="focus-areas" className="mx-auto max-w-3xl px-5 py-8">
          <SectionHeading as="h2" className="!text-lg">
            Focus areas briefing — free
          </SectionHeading>
          <p className="mt-1 text-sm text-ict-ink-400">
            Every examinable competency, ranked by how likely it is to appear in {PREDICTED_PAPER_EXAM_YEAR_TARGET}.
          </p>
          <ul className="mt-4 space-y-2">
            {AL_ICT_2027_FOCUS_AREAS.map((f) => (
              <li key={f.competencyNumber}>
                <Card radius="md" className="p-3.5 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ict-ink-900">{f.topic}</p>
                    <Badge tone={f.band === "high" ? "success" : f.band === "medium" ? "brand" : "neutral"} className="shrink-0">
                      {f.band === "high" ? "High" : f.band === "medium" ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-ict-ink-400">{f.rationale}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-8">
          <SectionHeading as="h2" className="!text-lg">
            Sample questions
          </SectionHeading>
          <p className="mt-1 text-sm text-ict-ink-400">
            3 of {PREDICTED_PAPER1_QUESTION_COUNT} predicted MCQs. Answers, explanations and the remaining{" "}
            {PREDICTED_PAPER1_QUESTION_COUNT - samples.length} questions plus the full Paper II unlock once you sign
            in.
          </p>
          <ol className="mt-4 space-y-4">
            {samples.map((q, i) => (
              <li key={q.id}>
                <Card radius="card" className="p-4">
                  <p className="font-semibold text-ict-ink-900">
                    {i + 1}. {q.en.stem}
                  </p>
                  {q.code ? (
                    <pre className="mt-2 overflow-x-auto rounded-ict-sm bg-ict-paper-100 p-2 font-mono text-xs whitespace-pre">{q.code}</pre>
                  ) : null}
                  <ol className="mt-2 ml-4 list-decimal space-y-0.5 text-sm text-ict-ink-400">
                    {q.en.options.map((opt, j) => <li key={j}>{opt}</li>)}
                  </ol>
                  <p className="mt-2 text-xs text-ict-ink-400">{q.topic}</p>
                </Card>
              </li>
            ))}
            <li className="flex flex-col items-center gap-2 rounded-ict-card border border-dashed border-ict-paper-300 bg-ict-paper-0 p-5 text-center text-sm text-ict-ink-400">
              <IconBadge icon="lock" tone="soft" size={36} />
              <p>
                {PREDICTED_PAPER1_QUESTION_COUNT - samples.length} more MCQs, all 10 Paper II questions, mark
                schemes and every confidence rationale
              </p>
            </li>
          </ol>

          <Card radius="card" className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-ict-ink-400">
              One free account unlocks the full predicted paper, live classes and every past paper on ICT Campus.
            </p>
            <ButtonLink href="/signin?next=/subjects/al-ict/predicted-paper&ref=predicted-paper-2027" variant="secondary" size="md" className="shrink-0">
              Sign in — it&rsquo;s free to start
            </ButtonLink>
          </Card>

          <FreeResourcesFooter exclude={[PATH]} />
        </section>
      </main>
    </>
  );
}
