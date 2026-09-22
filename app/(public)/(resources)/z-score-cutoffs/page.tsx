import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ds";
import {
  CUTOFF_ROUND,
  cutoffCoursesByStream,
  formatZ,
  listCutoffCourses,
} from "@/lib/campus-match/cutoff-pages";
import { campusMetadata } from "@/lib/seo/campus";
import { breadcrumbJsonLd, datasetJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = `Z-score cut-offs ${CUTOFF_ROUND.coverYear} for every course`;
const DESCRIPTION = `UGC minimum Z-scores for ${CUTOFF_ROUND.coverYear}, for every state university course, by university and district. Grouped by A/L stream. Free, sourced, no sign-in.`;

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/z-score-cutoffs",
  keywords: [
    `z score cut off ${CUTOFF_ROUND.coverYear}`,
    "z score cut off marks",
    "UGC cut off marks",
    "university cut off marks Sri Lanka",
    "z score by district",
    "Z ලකුණු කඩඉම්",
    "cut off marks 2026",
  ],
});

/**
 * Every course with a published cut-off, grouped by the A/L stream that may
 * apply for it. The hub for the per-course pages — a student finds their
 * stream, then their course, in two taps, and a search engine finds every
 * course page from one place.
 *
 * A course open to several streams is listed under each. That repeats a few
 * links, and is still right: an Arts student looking for their list should
 * not have to know the course also admits Commerce.
 */
export default function CutoffHubPage() {
  const groups = cutoffCoursesByStream().filter((g) => g.courses.length > 0);
  const total = listCutoffCourses().length;

  return (
    <>
      <JsonLd
        data={graphJsonLd([
          datasetJsonLd({
            name: `Minimum Z-scores for university admission in Sri Lanka, ${CUTOFF_ROUND.coverYear}`,
            description: `The University Grants Commission's minimum Z-score for each state university course, at each university and in each of the 25 districts, for ${CUTOFF_ROUND.coverYear}.`,
            path: "/z-score-cutoffs",
            temporalCoverage: CUTOFF_ROUND.coverYear,
            sourceUrl: CUTOFF_ROUND.source,
            keywords: ["Z-score", "cut-off", "UGC", "university admission", "Sri Lanka"],
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Z-score cut-offs", path: "/z-score-cutoffs" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow={`UGC cut-offs · ${CUTOFF_ROUND.coverYear}`}
          title="Z-score cut-offs for every course"
          subtitle={`${total} state university courses, every university and every district, from the newest table the UGC has published. Find your stream, then your course.`}
        />

        <p lang="si" className="mt-4 text-sm text-ict-fg-soft">
          හැම course එකකටම {CUTOFF_ROUND.coverYear} Z-score cut-off, දිස්ත්‍රික්කය අනුව. ඔයාගේ
          stream එක තෝරලා course එක බලන්න.
        </p>

        <Card radius="card" className="mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="min-w-0 flex-1 basis-[260px] text-sm text-ict-fg-soft">
            Already have your Z-score? Put it in once and see every course your stream can apply for,
            against your own district&apos;s cut-off.
          </p>
          <ButtonLink href="/university-pathways#check" variant="primary" size="sm">
            Free checker
          </ButtonLink>
        </Card>

        <nav aria-label="Streams" className="mt-8 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.key}
              href={`#${g.key}`}
              className="inline-flex h-8 items-center rounded-full border border-ict-line px-3.5 text-sm text-ict-fg-soft transition-colors duration-[120ms] hover:border-ict-line-strong-hover hover:text-ict-fg"
            >
              {g.name}
            </a>
          ))}
        </nav>

        {groups.map((g) => (
          <section key={g.key} id={g.key} className="mt-12 scroll-mt-6">
            <SectionHeading as="h2">{g.name} stream</SectionHeading>
            <Card radius="card" className="mt-4 p-2">
              <ul>
                {g.courses.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/z-score-cutoffs/${c.slug}`}
                      className="flex items-center justify-between gap-3 rounded-ict-md px-3 py-2.5 text-sm transition-colors duration-[120ms] hover:bg-ict-surface-hover"
                    >
                      <span className="text-ict-fg">{c.name}</span>
                      <span className="shrink-0 font-mono text-xs text-ict-fg-mute">
                        {formatZ(c.lowest)} – {formatZ(c.highest)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}

        <p className="mt-10 text-xs leading-relaxed text-ict-fg-dim">
          Ranges are the lowest and highest district cut-off across every university offering the
          course. Source:{" "}
          <a href={CUTOFF_ROUND.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            UGC, minimum Z-scores for university admission {CUTOFF_ROUND.coverYear}
          </a>
          . {CUTOFF_ROUND.basis}. ICT Campus is not affiliated with the UGC. New to Z-scores?{" "}
          <Link href="/z-score" className="underline underline-offset-2">
            How the Z-score works
          </Link>
          .
        </p>

        <CampusFooter exclude={["/z-score-cutoffs"]} />
      </main>
    </>
  );
}
