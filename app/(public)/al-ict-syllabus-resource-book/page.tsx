import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { PageHeader, Card, CardLink, SectionHeading, ButtonLink, IconBadge } from "@/components/ds-cream";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";
import { SYLLABUS_AUTHORITY } from "@/lib/seo/site";

/**
 * Four different official documents answer four different questions, and
 * students searching for one of them often don't yet know which — "syllabus"
 * (what's examinable), "resource book" (how it's taught), "teacher's guide"
 * (how it's assessed) and "text book" (the student's own copy) get typed
 * almost interchangeably. This page is the disambiguation plus the honest
 * pointer to where each one actually lives — NIE and the Ministry publish
 * all four free, so re-hosting them would only go stale the day they don't.
 *
 * The differentiator is the same one /past-papers uses: what the syllabus
 * actually contains, unit by unit, mapped to this site's own exam-targeted
 * breakdown — which is the reason to stay once the document search is done.
 */

const TITLE = "A/L ICT Syllabus, Resource Book & Teacher's Guide — Official Downloads";
const DESCRIPTION =
  "Where to find the official A/L ICT syllabus, resource book (Grade 12 & 13) and teacher's guide, in Sinhala and English medium — what each document actually contains, and the full syllabus mapped unit by unit to what gets examined.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/al-ict-syllabus-resource-book" },
  keywords: [
    "A/L ICT syllabus",
    "A/L ICT syllabus Sinhala medium",
    "A/L ICT syllabus English medium",
    "A/L ICT resource book grade 12 Sinhala medium",
    "A/L ICT resource book English medium",
    "A/L ICT teachers guide",
    "A/L ICT text book Sinhala medium",
    "උසස් පෙළ ICT විෂය නිර්දේශය",
    "උසස් පෙළ ICT සම්පත් පොත",
  ],
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/al-ict-syllabus-resource-book" },
};

// Fixed reference content, same posture as /past-papers and /revision-plan.
export const revalidate = 86400;

const DOCUMENTS = [
  {
    icon: "description" as const,
    name: "Syllabus",
    also: "the official competency list",
    body: "The single document that defines what's examinable — all 14 competency levels, their objectives, and the number of teaching periods against each. Everything on this site's syllabus pages is built from this exact structure.",
    who: "Read this to know the boundary of the exam. It doesn't teach the content.",
  },
  {
    icon: "auto_stories" as const,
    name: "Resource book",
    also: "grade 12 & grade 13, separate books",
    body: "The actual teaching content behind each competency — explanations, diagrams, worked examples — published as two separate books because Grade 12 and Grade 13 cover different units. Sinhala, English and Tamil medium editions exist as separate files.",
    who: "Read this for the explanations. It's the closest official document to a textbook.",
  },
  {
    icon: "fact_check" as const,
    name: "Teacher's guide",
    also: "for structuring lessons, not self-study",
    body: "Written for the teacher delivering the syllabus, not the student revising it — lesson sequencing, suggested activities, assessment criteria. Useful context for how a topic is meant to be taught, but it assumes a classroom around it.",
    who: "Read this if you want to understand why a topic is taught in a particular order.",
  },
  {
    icon: "school" as const,
    name: "Text book",
    also: "the student's own copy",
    body: "Where a dedicated A/L ICT text book exists for a given year, it's the student-facing companion to the resource book — shorter, more example-driven. Availability varies by year and medium; the resource book is the more consistently published of the two.",
    who: "Read this alongside the resource book, not instead of it.",
  },
] as const;

const OFFICIAL_SOURCES = [
  {
    name: `${SYLLABUS_AUTHORITY}`,
    url: "https://nie.lk/",
    note: "Publishes the syllabus, the resource books and the teachers' guides — the source for all three, in Sinhala, English and Tamil medium.",
  },
  {
    name: "e-thaksalawa (Ministry of Education)",
    url: "https://e-thaksalawa.moe.gov.lk/",
    note: "The Ministry's free learning portal — syllabuses, resource books and text books, searchable by grade, subject and medium.",
  },
] as const;

const FAQS = [
  {
    q: "Where can I download the official A/L ICT syllabus?",
    a: "The National Institute of Education (nie.lk) publishes it, along with the Ministry of Education's e-thaksalawa portal — both free, in Sinhala, Tamil and English medium. This page links to both. This site's own syllabus pages present the same 14 competency levels as an interactive, exam-mapped breakdown rather than a static PDF.",
  },
  {
    q: "What's the difference between the syllabus and the resource book?",
    a: "The syllabus is the short document that defines what's examinable — competency levels, objectives, period counts. The resource book is the much longer document that actually teaches each competency, with explanations and worked examples. A student revising wants the resource book; a student checking exam scope wants the syllabus.",
  },
  {
    q: "Is the A/L ICT resource book different for Grade 12 and Grade 13?",
    a: "Yes — two separate books, because Grade 12 (Units 1–6) and Grade 13 (Units 7–14) cover different competency levels. Both are published in Sinhala, English and Tamil medium as separate files.",
  },
  {
    q: "Is there an official A/L ICT text book?",
    a: "Availability varies by year and medium — the resource book is the more consistently published official document. Where a dedicated text book exists, e-thaksalawa is the place to check for it.",
  },
  {
    q: "Do I need the teacher's guide as a student?",
    a: "Not for self-study — it's written for a teacher planning lessons, not a student revising. It's worth reading only if you want to understand why a topic is sequenced the way it is.",
  },
  {
    q: "Is the syllabus the same in Sinhala and English medium?",
    a: "The competency levels, objectives and period counts are identical — only the language of the document changes. A Sinhala-medium student and an English-medium student are examined on exactly the same syllabus.",
  },
] as const;

export default function SyllabusResourceBookPage() {
  const grade12 = AL_ICT_UNITS.filter((u) => u.gradeYear === 12);
  const grade13 = AL_ICT_UNITS.filter((u) => u.gradeYear === 13);

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Syllabus & resource book", path: "/al-ict-syllabus-resource-book" },
        ])}
      />
      <SiteHeader user={null} />

      <main className="bg-ict-paper-100">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <PageHeader
            eyebrow="Official documents"
            title="A/L ICT syllabus, resource book & teacher's guide"
            subtitle="Four different official documents, four different jobs. What each one actually contains, where to get it free in Sinhala and English medium, and the syllabus itself mapped unit by unit to what gets examined."
          />

          {/* Direct route to the landing page, right after the header — the
              visitor who already knows they want the class shouldn't have to
              scroll past the document explainer to find it. */}
          <Card variant="dark" radius="panel" className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="font-display text-lg font-extrabold text-ict-paper-50">
                Prefer it already taught, not just listed<span className="text-ict-orange-500">?</span>
              </p>
              <p className="mt-1.5 text-sm text-ict-ink-300">
                Live A/L ICT classes cover this exact syllabus, unit by unit — first 7 days free, no card.
              </p>
            </div>
            <ButtonLink href="/al-ict-classes" variant="primary" className="shrink-0">
              See the classes
            </ButtonLink>
          </Card>

          <Card radius="card" className="mt-8 flex items-start gap-3 p-4">
            <IconBadge icon="info" tone="soft" size={32} />
            <p className="text-sm text-ict-ink-500">
              We don&apos;t re-host these — they&apos;re published free by {SYLLABUS_AUTHORITY} and the
              Ministry of Education, and a copy here would only go stale the day theirs updates.{" "}
              <a href="#official" className="font-semibold text-ict-orange-600 underline underline-offset-2">
                Official links are below
              </a>
              . What&apos;s on this page is knowing which document you actually want.
            </p>
          </Card>

          {/* Sinhala summary — a large share of this exact search is typed in
              Sinhala script. */}
          <section lang="si" className="si mt-8">
            <Card radius="card" className="p-6">
              <SectionHeading as="h2">උසස් පෙළ ICT විෂය නිර්දේශය සහ සම්පත් පොත — සිංහල මාධ්‍යය</SectionHeading>
              <ul className="mt-4 space-y-2.5 text-sm text-ict-ink-500">
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  විෂය නිර්දේශය (Syllabus) — විභාගයට අදාළ ඒකක 14ම සහ ඒවායේ අරමුණු ලැයිස්තුගත කරයි.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  සම්පත් පොත (Resource book) — 12 සහ 13 ශ්‍රේණි සඳහා වෙනම, විෂය අන්තර්ගතය පැහැදිලි කරන පොත.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  දෙකම නොමිලේ nie.lk සහ e-thaksalawa වෙබ් අඩවි වලින් සිංහල, ඉංග්‍රීසි සහ දෙමළ මාධ්‍යයෙන්
                  ලබාගත හැක.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ict-orange-500" aria-hidden />
                  මෙම වෙබ් අඩවියේ විෂය නිර්දේශයම, ඒකකයෙන් ඒකකයට, විභාග අවශ්‍යතා සමඟ නොමිලේ බලාගත හැක.
                </li>
              </ul>
              <p className="mt-4 text-sm">
                <Link href="/syllabus/al-ict" className="font-semibold text-ict-orange-600 underline underline-offset-2">
                  විෂය නිර්දේශය දැන් බලන්න
                </Link>
              </p>
            </Card>
          </section>

          <section className="mt-12">
            <SectionHeading as="h2">Four documents, four different jobs</SectionHeading>
            <p className="mt-2 text-ict-ink-500">
              Students often search for one when they actually need another. This is what each one is
              for, so you download the right file the first time.
            </p>
            <div className="mt-5 space-y-3">
              {DOCUMENTS.map((doc) => (
                <Card key={doc.name} radius="card" className="flex gap-4 p-5">
                  <IconBadge icon={doc.icon} tone="soft" size={40} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="font-display font-bold text-ict-ink-900">{doc.name}</h3>
                      <span className="text-xs text-ict-ink-400">{doc.also}</span>
                    </div>
                    <p className="mt-2 text-sm text-ict-ink-500">{doc.body}</p>
                    <p className="mt-2 text-xs font-semibold text-ict-orange-600">{doc.who}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* The differentiator: the syllabus's own structure, already broken
              down and linked to this site's exam-mapped unit pages. */}
          <section className="mt-12">
            <SectionHeading as="h2">The syllabus itself, unit by unit</SectionHeading>
            <p className="mt-2 text-ict-ink-500">
              The same 14 competency levels the official syllabus defines, split by grade exactly as NIE
              publishes them — each one links to this site&apos;s own exam-targeted breakdown of that
              unit.
            </p>
            {[
              { year: 12 as const, units: grade12 },
              { year: 13 as const, units: grade13 },
            ].map(({ year, units }) => (
              <div key={year} className="mt-6">
                <h3 className="font-display text-lg font-extrabold text-ict-ink-900">
                  Grade {year}
                  <span className="ml-2 text-sm font-normal text-ict-ink-400">
                    units {units[0]?.competencyNumber}–{units[units.length - 1]?.competencyNumber}
                  </span>
                </h3>
                <ul className="mt-3 space-y-2">
                  {units.map((u) => (
                    <li key={u.id}>
                      <CardLink
                        href={`/syllabus/al-ict/${u.id}`}
                        radius="md"
                        className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
                      >
                        <span className="font-semibold text-ict-ink-900">
                          <span className="text-ict-orange-500">{u.competencyNumber}.</span> {u.title}
                        </span>
                        <span className="text-xs text-ict-ink-400">
                          {u.lessons.length} lessons · {u.periods} periods
                        </span>
                      </CardLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section id="official" className="mt-12 scroll-mt-6">
            <SectionHeading as="h2">Where to download the official documents</SectionHeading>
            <p className="mt-2 text-ict-ink-500">
              Published free, direct from the syllabus authority and the Ministry — always check the
              medium and grade on the exact file you open.
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

          <FreeResourcesFooter exclude={["/al-ict-syllabus-resource-book"]} />

          <ResourcePageCta
            title="Want the syllabus taught, not just explained?"
            body="Every unit above is covered live, in Sinhala and English medium. First 7 days free, no card required."
            guestHref="/al-ict-classes"
            guestLabel="See the A/L ICT classes"
          />
        </div>
      </main>
    </>
  );
}
