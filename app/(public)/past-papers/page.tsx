import Link from "next/link";
import type { Metadata } from "next";
import { listPublicContent } from "@/lib/queries";
import { signedContentUrl } from "@/lib/content/storage";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";
import { PAPER_QUESTION_COUNT } from "@/lib/content/al-ict-2026-paper1";
import { formatDate } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { PastPapersCta } from "@/components/content/PastPapersCta";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { publicEnv } from "@/lib/env";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd, ORG_ID } from "@/lib/seo/json-ld";
import { EXAM_STRUCTURE, SYLLABUS_AUTHORITY } from "@/lib/seo/site";
import { Badge, Card, IconBadge, PageHeader, SectionHeading } from "@/components/ds-cream";
import type { ContentItem } from "@/lib/types";

/**
 * "A/L ICT past papers" is the highest-volume query this site can plausibly
 * compete for, and the incumbents are all PDF dumps — a year list, a download
 * button, nothing else. Out-dumping them is not winnable; the papers are the
 * same public documents everywhere and those sites have a decade of links.
 *
 * What is winnable is being the page that is actually *useful* once you have
 * the paper: what each paper is made of, which units the questions come from,
 * what form they take, and how to work through one so it moves your mark. All
 * of that already exists as authored data in `al-ict-units.ts`, so this page
 * is genuinely differentiated content rather than a thin keyword target — and
 * it is what an AI assistant answering "how should I use A/L ICT past papers"
 * can actually quote.
 *
 * Nothing here claims to host a paper the platform does not have. Real
 * uploads come from Firestore; official papers are linked to their official
 * sources.
 */

const TITLE = "A/L ICT Past Papers — Sinhala & English Medium, with Marking Schemes";
const DESCRIPTION =
  "A/L ICT past papers for Sri Lankan Grade 12 and 13 students: what Paper I and Paper II contain, which syllabus units each question comes from, a free 50-question 2026 Paper I MCQ you can attempt online, downloadable notes and marking schemes, and the official sources for every year's paper in Sinhala and English medium.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/past-papers" },
  keywords: [
    "A/L ICT past papers",
    "AL ICT past paper Sinhala medium",
    "A/L ICT marking scheme",
    "ICT past papers with answers",
    "A/L ICT paper 1 MCQ",
    "A/L ICT paper 2 structured essay",
    "උසස් පෙළ ICT පසුගිය ප්‍රශ්න පත්‍ර",
    "තොරතුරු තාක්ෂණය පසුගිය විභාග ප්‍රශ්න පත්‍ර",
  ],
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/past-papers" },
};

export const revalidate = 3600;

/**
 * Where the official papers actually come from. Linking out to the authority
 * rather than re-hosting is both honest and, for a site this young, a trust
 * signal — and it is the answer a student searching for "official A/L ICT past
 * paper" genuinely needs.
 */
const OFFICIAL_SOURCES = [
  {
    name: "Department of Examinations, Sri Lanka",
    url: "https://doenets.lk/",
    note: "The exam authority itself. Past papers and evaluation reports are published here first.",
  },
  {
    name: "e-thaksalawa (Ministry of Education)",
    url: "https://e-thaksalawa.moe.gov.lk/",
    note: "The Ministry's free learning portal — past papers, term papers and resource books by grade and subject, in Sinhala, Tamil and English.",
  },
  {
    name: `${SYLLABUS_AUTHORITY}`,
    url: "https://nie.lk/",
    note: "The syllabus and the Grade 12 and 13 Teachers' Guides that every paper is set against.",
  },
] as const;

/**
 * The method, not the material. This is what separates a student who has done
 * ten papers and gained nothing from one who has done three and gained a
 * grade — and it is the part no PDF site publishes.
 */
const METHOD = [
  {
    step: "01",
    title: "Sit it timed, before you revise it",
    body: `Paper I is ${EXAM_STRUCTURE.paper1.durationMinutes} minutes for ${EXAM_STRUCTURE.paper1.questions} MCQs — about 2 minutes 24 seconds each. A paper you do untimed with the notes open tells you what you recognise, which is not what the exam measures. Do it closed-book with a clock first, every time.`,
  },
  {
    step: "02",
    title: "Mark it against the scheme, not your memory",
    body: "The marking scheme awards specific words. Reading your answer and deciding it was 'basically right' is how students consistently over-predict their own grade by ten marks. Give yourself the mark only when the scheme's point is actually written down.",
  },
  {
    step: "03",
    title: "Sort every lost mark into content or command word",
    body: "There are only two reasons a mark is lost: you did not know the material, or you knew it and answered the wrong question. They need completely different fixes, and most students assume every loss is the first when a large share is the second.",
  },
  {
    step: "04",
    title: "Trace each wrong answer back to its syllabus unit",
    body: "One wrong MCQ is noise. Four wrong MCQs that all trace to Unit 4 is a diagnosis. Use the unit list below to do the tracing, then re-study that one unit rather than re-reading the whole subject.",
  },
  {
    step: "05",
    title: "Re-attempt the same paper a week later",
    body: "Not a new paper — the same one. If the marks you lost the first time are still lost, the fix did not take. This is the single most skipped step and the one that actually moves a grade.",
  },
] as const;

const FAQS = [
  {
    q: "Where can I download A/L ICT past papers in Sinhala medium?",
    a: "Official papers are published by the Department of Examinations (doenets.lk) and the Ministry of Education's e-thaksalawa portal, in Sinhala, Tamil and English medium, free. This page links to both. Any notes, papers and marking schemes we have prepared ourselves are on our free notes page, also free and with no sign-up.",
  },
  {
    q: "What is the structure of the A/L ICT paper?",
    a: `Two papers. ${EXAM_STRUCTURE.paper1.name}: ${EXAM_STRUCTURE.paper1.questions} multiple-choice questions in ${EXAM_STRUCTURE.paper1.durationMinutes / 60} hours, all to be answered. ${EXAM_STRUCTURE.paper2.name}: ${EXAM_STRUCTURE.paper2.durationMinutes / 60} hours, with structured questions in Part A and essay questions in Part B.`,
  },
  {
    q: "Should I leave a blank in the MCQ paper if I am unsure?",
    a: "No. A/L ICT Paper I does not apply negative marking, so an unanswered question and a wrong one score the same — zero. Eliminate what you can and answer every question.",
  },
  {
    q: "Is there an A/L ICT past paper I can attempt online for free?",
    a: `Yes. A full ${PAPER_QUESTION_COUNT}-question 2026 Paper I MCQ practice paper is on this site, free and with no sign-in — it runs a live exam timer, scores you instantly and shows the correct answer to every question.`,
  },
  {
    q: "Which units come up most in the A/L ICT exam?",
    a: "The syllabus's own period allocation is the best public guide: units with more teaching periods carry more marks. Programming (Unit 9), Databases (Unit 8), Networking (Unit 6) and Digital Circuits (Unit 4) are the heaviest, and they are also where structured and essay questions concentrate. The unit-by-unit list on this page gives the specific question forms for each.",
  },
  {
    q: "How many past papers should I do?",
    a: "Fewer papers worked through properly beats more papers skimmed. Three papers sat under time, marked against the scheme, diagnosed by unit and re-attempted a week later will move your mark more than ten papers read through with the answers beside you.",
  },
] as const;

const KIND_LABEL: Record<string, string> = {
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  notes: "Notes",
  replay: "Class replay",
};

export default async function PastPapersPage() {
  const items = await listPublicContent().catch(() => [] as ContentItem[]);
  // Only the paper-shaped material belongs on this page; general notes stay on
  // /notes so the two pages don't compete for the same query.
  const papers = await Promise.all(
    items
      .filter((c) => c.kind === "past_paper" || c.kind === "marking_scheme")
      // This page is revalidated hourly (see `revalidate` below), so a fresh
      // signed URL on each regeneration comfortably outlives any single visit.
      .map(async (item) => ({ ...item, downloadUrl: await signedContentUrl(item.storagePath) })),
  );

  // Page-specific node only — the root layout already ships the organisation,
  // the site and the teacher, and `provider` below resolves against them.
  const schema = graphJsonLd([
    {
      "@type": "LearningResource",
      "@id": `${publicEnv.appUrl}/past-papers#resource`,
      name: TITLE,
      description: DESCRIPTION,
      url: `${publicEnv.appUrl}/past-papers`,
      learningResourceType: ["Guide", "Exam preparation", "Past examination papers"],
      educationalLevel: "GCE Advanced Level",
      teaches: "Information & Communication Technology",
      inLanguage: ["si", "en"],
      isAccessibleForFree: true,
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "Sri Lankan Advanced Level students, Grades 12 & 13",
      },
      provider: { "@id": ORG_ID() },
    },
  ]);

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "A/L ICT past papers", path: "/past-papers" },
        ])}
      />
      <SiteHeader user={null} />

      <main className="bg-ict-paper-100">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <PageHeader
            eyebrow="Exam prep"
            title="A/L ICT past papers — Sinhala & English medium"
            subtitle="Everything a past paper is worth once you have it: what Paper I and Paper II actually contain, which syllabus unit each question comes from, and how to work through one so it changes your mark. Plus a full 2026 Paper I MCQ you can sit online right now, free and without signing in."
          />

          <Card radius="card" className="mt-6 flex items-start gap-3 p-4">
            <IconBadge icon="info" tone="soft" size={32} />
            <p className="text-sm text-ict-ink-500">
              We do not re-host the official papers. Every year&apos;s paper is published free by the
              Department of Examinations and the Ministry of Education —{" "}
              <a href="#official" className="font-semibold text-ict-orange-600 underline underline-offset-2">
                those links are below
              </a>
              . What is on this page is the part they do not give you.
            </p>
          </Card>

          {/* Sinhala summary — the audience is Sinhala medium and a large share
              of these searches are typed in Sinhala script. */}
          <section lang="si" className="si mt-8">
            <Card radius="card" className="p-6">
              <SectionHeading as="h2">
                උසස් පෙළ ICT පසුගිය විභාග ප්‍රශ්න පත්‍ර — සිංහල මාධ්‍යය
              </SectionHeading>
              <ul className="mt-4 space-y-2.5 text-sm text-ict-ink-500">
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  පළමු පත්‍රය: බහුවරණ ප්‍රශ්න {EXAM_STRUCTURE.paper1.questions}ක්, පැය{" "}
                  {EXAM_STRUCTURE.paper1.durationMinutes / 60}ක් තුළ. සියල්ලටම පිළිතුරු සැපයිය යුතුය.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  දෙවන පත්‍රය: පැය {EXAM_STRUCTURE.paper2.durationMinutes / 60}ක්. A කොටසේ ව්‍යුහගත ප්‍රශ්න
                  සහ B කොටසේ රචනා ප්‍රශ්න.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  වැරදි පිළිතුරු සඳහා ලකුණු අඩු නොකරයි. එබැවින් කිසිදු ප්‍රශ්නයක් හිස්ව නොතබන්න.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  2026 පළමු පත්‍රයේ බහුවරණ ප්‍රශ්න පත්‍රය මෙම වෙබ් අඩවියේ නොමිලේ, ලියාපදිංචියකින් තොරව.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  නිල ප්‍රශ්න පත්‍ර විභාග දෙපාර්තමේන්තුවේ සහ e-thaksalawa වෙබ් අඩවියේ නොමිලේ ලබාගත හැක.
                </li>
              </ul>
              <p className="mt-4 text-sm">
                <Link
                  href="/papers/al-ict-2026-paper-1-mcq"
                  className="font-semibold text-ict-orange-600 underline underline-offset-2"
                >
                  2026 පළමු පත්‍රය දැන් නොමිලේ කරන්න
                </Link>
              </p>
            </Card>
          </section>

          {/* The site's own free, attemptable paper — the strongest thing on the
              page and the reason a student would pick it over a PDF list. */}
          <section className="mt-12">
            <SectionHeading as="h2">Attempt a full paper online, free</SectionHeading>
            <Link href="/papers/al-ict-2026-paper-1-mcq" className="mt-4 block">
              <Card variant="dark" radius="card" hoverable className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-extrabold">A/L ICT 2026 Paper I (MCQ)</h3>
                  <Badge tone="brand">Free · no sign-in</Badge>
                </div>
                <p className="mt-2 text-sm text-ict-paper-200">
                  All {PAPER_QUESTION_COUNT} questions with a live {EXAM_STRUCTURE.paper1.durationMinutes}-minute
                  exam timer, instant scoring and every correct answer explained. Sinhala and English. The full
                  paper is also readable as plain text if you only want to check one answer.
                </p>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-ict-orange-400">
                  Start the paper
                  <Icon name="chevron_right" className="!text-base" />
                </span>
              </Card>
            </Link>
          </section>

          {/* Real uploads, when the teacher has published any. Absent rather
              than faked when the library is still empty. */}
          {papers.length > 0 ? (
            <section className="mt-12">
              <SectionHeading as="h2">Papers and marking schemes to download</SectionHeading>
              <p className="mt-2 text-sm text-ict-ink-400">Free, no sign-up needed.</p>
              <ul className="mt-4 space-y-2">
                {papers.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.downloadUrl}
                      className="ict-lift flex items-center gap-3 rounded-ict-card border border-ict-paper-300 bg-ict-paper-0 p-4 shadow-ict-sm"
                    >
                      <IconBadge
                        icon={item.kind === "marking_scheme" ? "check_circle" : "receipt_long"}
                        tone="soft"
                        size={40}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ict-ink-900">{item.title}</span>
                        <span className="block text-xs text-ict-ink-400">
                          {KIND_LABEL[item.kind] ?? item.kind} · {formatDate(item.createdAt)}
                        </span>
                      </span>
                      <Icon name="download" className="!text-lg text-ict-ink-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-12">
            <SectionHeading as="h2">What each paper contains</SectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[EXAM_STRUCTURE.paper1, EXAM_STRUCTURE.paper2].map((paper) => (
                <Card key={paper.name} radius="card" className="p-5">
                  <h3 className="font-display font-bold text-ict-ink-900">{paper.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-ict-orange-600">
                    {paper.durationMinutes / 60} hours
                    {"questions" in paper ? ` · ${paper.questions} questions` : ""}
                  </p>
                  <p className="mt-2 text-sm text-ict-ink-500">{paper.note}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <SectionHeading as="h2">How to actually use a past paper</SectionHeading>
            <p className="mt-2 text-ict-ink-500">
              Most students collect papers and read them. Reading a paper you have already seen the answers
              to feels like revision and measures nothing. Five steps, in this order:
            </p>
            <ol className="mt-4 space-y-3">
              {METHOD.map((m) => (
                <li key={m.step}>
                  <Card radius="card" className="flex gap-4 p-5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ict-orange-50 font-mono text-sm font-bold text-ict-orange-600">
                      {m.step}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-ict-ink-900">{m.title}</h3>
                      <p className="mt-2 text-sm text-ict-ink-500">{m.body}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-ict-ink-500">
              Step 3 depends on knowing what each command word demands —{" "}
              <Link href="/command-words" className="font-semibold text-ict-orange-600 underline underline-offset-2">
                every A/L ICT command word explained
              </Link>{" "}
              and{" "}
              <Link
                href="/distinguish-between"
                className="font-semibold text-ict-orange-600 underline underline-offset-2"
              >
                ten worked &quot;distinguish between&quot; answers
              </Link>{" "}
              are both free. If you&apos;re repeating, unsure of your last mark, or just short on
              time,{" "}
              <Link href="/revision-plan" className="font-semibold text-ict-orange-600 underline underline-offset-2">
                this revision plan
              </Link>{" "}
              builds on this same method.
            </p>
          </section>

          {/* The differentiator: what gets asked, unit by unit, from the
              syllabus data this site already maintains. */}
          <section className="mt-12">
            <SectionHeading as="h2">What gets asked, unit by unit</SectionHeading>
            <p className="mt-2 text-ict-ink-500">
              Use this to trace a lost mark back to the unit that caused it. Period counts are the
              syllabus&apos;s own — more periods generally tracks more marks — and the question forms are the
              ones that recur across papers.
            </p>
            <div className="mt-5 space-y-2">
              {AL_ICT_UNITS.map((unit) => {
                const asked = unit.lessons.flatMap((l) => l.importantAreas).slice(0, 4);
                return (
                  <details
                    key={unit.id}
                    className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-0 shadow-ict-sm"
                  >
                    <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2 px-5 py-4">
                      <span className="font-semibold text-ict-ink-900">
                        <span className="text-ict-orange-600">Unit {unit.competencyNumber}.</span> {unit.title}
                      </span>
                      <span className="text-xs text-ict-ink-400">
                        Grade {unit.gradeYear} · {unit.periods} periods
                      </span>
                    </summary>
                    <div className="border-t border-ict-paper-300 px-5 py-4">
                      <p className="text-sm text-ict-ink-500">{unit.competencyStatement}.</p>
                      {asked.length > 0 ? (
                        <>
                          <p className="mt-3 text-xs font-semibold tracking-wide text-ict-ink-900 uppercase">
                            Commonly asked as
                          </p>
                          <ul className="mt-2 space-y-1.5 text-sm text-ict-ink-500">
                            {asked.map((a) => (
                              <li key={a} className="flex items-start gap-2">
                                <Icon name="chevron_right" className="mt-0.5 shrink-0 !text-base text-ict-orange-500" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                      <Link
                        href={`/syllabus/al-ict/${unit.id}`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ict-orange-600"
                      >
                        Full unit breakdown
                        <Icon name="chevron_right" className="!text-base" />
                      </Link>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          <section id="official" className="mt-12 scroll-mt-6">
            <SectionHeading as="h2">Where to get every year&apos;s official paper</SectionHeading>
            <p className="mt-2 text-ict-ink-500">
              These are the authorities that publish the papers themselves, free. Always check the year and
              medium on the paper you download — Sinhala, Tamil and English medium papers are separate files.
            </p>
            <ul className="mt-4 space-y-2">
              {OFFICIAL_SOURCES.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ict-lift block rounded-ict-card border border-ict-paper-300 bg-ict-paper-0 p-4 shadow-ict-sm"
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-ict-ink-900">
                      {src.name}
                      <Icon name="north_east" className="!text-sm text-ict-ink-400" />
                    </span>
                    <span className="mt-1 block text-sm text-ict-ink-500">{src.note}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <SectionHeading as="h2">Past paper questions students ask</SectionHeading>
            <div className="mt-4 space-y-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-0 shadow-ict-sm"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ict-ink-900">
                    {faq.q}
                  </summary>
                  <p className="border-t border-ict-paper-300 px-5 py-4 text-sm text-ict-ink-500">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <FreeResourcesFooter exclude={["/past-papers"]} />

          <PastPapersCta />
        </div>
      </main>
    </>
  );
}
