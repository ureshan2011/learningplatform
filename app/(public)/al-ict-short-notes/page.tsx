import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd, ORG_ID } from "@/lib/seo/json-ld";
import { publicEnv } from "@/lib/env";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { PrintPageButton } from "@/components/content/PrintPageButton";
import { PageHeader, Card, SectionHeading, ButtonLink, Badge } from "@/components/ds-cream";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";
import { isHighYield } from "@/lib/content/unit-visuals";

/**
 * "A/L ICT short notes pdf" is a real, high-volume search — but the honest
 * answer isn't a file to host, it's a page condensed enough that a browser's
 * own print-to-PDF produces exactly what the query wants. Built straight
 * from the same `examObjectives` this site's interactive syllabus pages use,
 * so a fix to one keeps both in sync rather than a hand-copied file drifting
 * out of date the first time the syllabus content is corrected.
 *
 * One outcome per line, unit by unit, nothing else — the point of "short"
 * notes is that they're not the full notes.
 */

const TITLE = "A/L ICT Short Notes — Every Unit, Exam-Ready (Sinhala & English)";
const DESCRIPTION =
  "Condensed A/L ICT short notes for Grade 12 and 13 — every syllabus unit's exam objectives in one line each, free to read online or save as a PDF. Built from the full NIE syllabus, in Sinhala and English medium.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/al-ict-short-notes" },
  keywords: [
    "A/L ICT short notes pdf",
    "A/L ICT short notes",
    "A/L ICT quick revision notes",
    "A/L ICT summary notes",
    "උසස් පෙළ ICT කෙටි සටහන්",
  ],
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/al-ict-short-notes" },
};

export const revalidate = 86400;

const FAQS = [
  {
    q: "Can I download these A/L ICT short notes as a PDF?",
    a: "Yes — use the \"Save as PDF\" button on this page, which opens your browser's print dialog with \"Save as PDF\" as a destination. It saves exactly what's on the page, so it's always the current version rather than a file that can go stale.",
  },
  {
    q: "Are short notes enough to pass A/L ICT?",
    a: "No — they're a revision aid for material you've already studied, not a replacement for it. Each objective below links back to its full unit breakdown, with the explanation, exam focus areas and (where published) worked lesson content.",
  },
  {
    q: "What's the difference between these and the full syllabus breakdown?",
    a: "The full breakdown on this site's syllabus pages includes the exam-focus notes and, where written, full worked explanations for each lesson. These short notes are only the exam objectives themselves — one line each, meant for a final scan before a paper, not first-time learning.",
  },
  {
    q: "Are the short notes the same for Sinhala and English medium?",
    a: "The content is identical — only the language of instruction in the live class differs. The syllabus objectives themselves don't change between mediums.",
  },
] as const;

export default function ShortNotesPage() {
  const grade12 = AL_ICT_UNITS.filter((u) => u.gradeYear === 12);
  const grade13 = AL_ICT_UNITS.filter((u) => u.gradeYear === 13);
  const totalObjectives = AL_ICT_UNITS.reduce(
    (n, u) => n + u.lessons.reduce((m, l) => m + l.examObjectives.length, 0),
    0,
  );

  const schema = graphJsonLd([
    {
      "@type": "LearningResource",
      "@id": `${publicEnv.appUrl}/al-ict-short-notes#resource`,
      name: TITLE,
      description: DESCRIPTION,
      url: `${publicEnv.appUrl}/al-ict-short-notes`,
      learningResourceType: ["Summary", "Revision notes", "Study guide"],
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
          { name: "Short notes", path: "/al-ict-short-notes" },
        ])}
      />
      <div className="print:hidden">
        <SiteHeader user={null} />
      </div>

      <main className="bg-ict-paper-100 print:bg-white">
        <div className="mx-auto max-w-3xl px-5 py-12 print:px-0 print:py-4">
          <PageHeader
            eyebrow="Free resource · exam-ready"
            title="A/L ICT short notes — every unit, one line per objective"
            subtitle={`All ${totalObjectives} exam objectives across the full syllabus, condensed to one line each. Read online, or save as a PDF for offline revision.`}
            actions={
              <div className="print:hidden">
                <PrintPageButton />
              </div>
            }
          />

          <div className="print:hidden">
            <Card variant="dark" radius="panel" className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="font-display text-lg font-extrabold text-ict-paper-50">
                  Short notes are for revision, not first pass<span className="text-ict-orange-500">.</span>
                </p>
                <p className="mt-1.5 text-sm text-ict-ink-300">
                  Learn it properly first, live, in Sinhala or English — first 7 days free, no card.
                </p>
              </div>
              <ButtonLink href="/al-ict-classes" variant="primary" className="shrink-0">
                See the classes
              </ButtonLink>
            </Card>
          </div>

          <p className="mt-8 hidden text-xs text-ict-ink-400 print:block">
            ictcampus.lk/al-ict-short-notes — A/L ICT short notes, Grades 12 & 13
          </p>

          {[
            { year: 12 as const, units: grade12 },
            { year: 13 as const, units: grade13 },
          ].map(({ year, units }) => (
            <section key={year} className="mt-10 break-inside-avoid print:mt-6">
              <SectionHeading as="h2">Grade {year}</SectionHeading>
              <div className="mt-4 space-y-4">
                {units.map((unit) => (
                  <Card key={unit.id} radius="card" className="break-inside-avoid p-5 print:border print:shadow-none">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display font-bold text-ict-ink-900">
                        <span className="text-ict-orange-500">{unit.competencyNumber}.</span> {unit.title}
                      </h3>
                      {isHighYield(unit.periods) ? (
                        <span className="print:hidden">
                          <Badge tone="brand">High-yield</Badge>
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-3">
                      {unit.lessons.map((lesson) => (
                        <div key={lesson.id}>
                          <p className="text-xs font-semibold tracking-wide text-ict-ink-400 uppercase">
                            {lesson.id} {lesson.title}
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {lesson.examObjectives.map((objective, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-ict-ink-700">
                                <Icon
                                  name="check_circle"
                                  className="mt-0.5 !text-sm shrink-0 text-ict-green-500 print:hidden"
                                />
                                <span className="hidden text-ict-ink-500 print:inline">·</span>
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/syllabus/al-ict/${unit.id}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ict-orange-600 print:hidden"
                    >
                      Full unit breakdown
                      <Icon name="chevron_right" className="!text-base" />
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          <div className="print:hidden">
            <section className="mt-12">
              <SectionHeading as="h2">Questions students ask</SectionHeading>
              <div className="mt-4 space-y-3">
                {FAQS.map((faq) => (
                  <Card key={faq.q} radius="card" className="overflow-hidden">
                    <details>
                      <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ict-ink-900">
                        {faq.q}
                      </summary>
                      <p className="border-t border-ict-paper-300 px-5 py-4 text-sm text-ict-ink-500">{faq.a}</p>
                    </details>
                  </Card>
                ))}
              </div>
            </section>

            <FreeResourcesFooter exclude={["/al-ict-short-notes"]} />

            <ResourcePageCta
              title="Ready to learn this properly, not just revise it?"
              body="Live A/L ICT classes cover every unit above in full, with quizzes and marked practice. First 7 days free, no card."
              guestHref="/al-ict-classes"
              guestLabel="See the A/L ICT classes"
            />
          </div>
        </div>
      </main>
    </>
  );
}
