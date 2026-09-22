import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { Badge, ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ds";
import {
  CUTOFF_ROUND,
  formatZ,
  getCutoffCourse,
  listCutoffCourses,
  siblingCourses,
} from "@/lib/campus-match/cutoff-pages";
import { campusMetadata } from "@/lib/seo/campus";
import { breadcrumbJsonLd, datasetJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

/**
 * One course's Z-score cut-offs for the newest round, every university and
 * every district, as plain HTML a search engine can read.
 *
 * Built at deploy from the static UGC dataset; an unknown slug is a 404, not
 * a render. See `lib/campus-match/cutoff-pages.ts` for why only the newest
 * round is shown here and what stays in the paid report.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return listCutoffCourses().map((c) => ({ course: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getCutoffCourse(slug);
  if (!course) return {};
  const range =
    course.lowest !== null && course.highest !== null
      ? ` From ${formatZ(course.lowest)} to ${formatZ(course.highest)} across districts.`
      : "";
  return campusMetadata({
    title: `${course.name} Z-score cut-off ${CUTOFF_ROUND.coverYear}`,
    description: `${course.name} minimum Z-scores for ${CUTOFF_ROUND.coverYear}, by university and district, from the UGC's published table.${range} Free.`,
    path: `/z-score-cutoffs/${course.slug}`,
    keywords: [
      `${course.name} z score`,
      `${course.name} cut off marks`,
      `${course.name} z score ${CUTOFF_ROUND.coverYear}`,
      `${course.name} z score cut off`,
    ],
  });
}

export default async function CutoffCoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: slug } = await params;
  const course = getCutoffCourse(slug);
  if (!course) notFound();

  const path = `/z-score-cutoffs/${course.slug}`;
  const siblings = siblingCourses(course);
  const firstStream = course.streams.length === 1 ? course.streams[0].key : undefined;
  const checkerHref = firstStream
    ? `/university-pathways?s=${firstStream}#check`
    : "/university-pathways#check";

  return (
    <>
      <JsonLd
        data={graphJsonLd([
          datasetJsonLd({
            name: `${course.name} — minimum Z-scores for university admission, ${CUTOFF_ROUND.coverYear}`,
            description: `The University Grants Commission's minimum Z-score for ${course.name} at each university, in each of Sri Lanka's 25 districts, for the ${CUTOFF_ROUND.coverYear} academic year.`,
            path,
            temporalCoverage: CUTOFF_ROUND.coverYear,
            sourceUrl: CUTOFF_ROUND.source,
            keywords: [course.name, "Z-score", "cut-off", "UGC", "university admission"],
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Z-score cut-offs", path: "/z-score-cutoffs" },
            { name: course.name, path },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/z-score-cutoffs"
          className="mb-4 inline-block text-sm text-ict-fg-mute transition-colors duration-[120ms] hover:text-ict-fg"
        >
          All courses
        </Link>
        <PageHeader
          eyebrow={`UGC cut-offs · ${CUTOFF_ROUND.coverYear}`}
          title={`${course.name} Z-score cut-off ${CUTOFF_ROUND.coverYear}`}
          subtitle={`The lowest Z-score that got a place in ${course.name}, at every university and in every district, in the newest round the UGC has published.`}
        />

        <p lang="si" className="mt-4 text-sm text-ict-fg-soft">
          {course.name} සඳහා {CUTOFF_ROUND.coverYear} Z-score cut-off, විශ්වවිද්‍යාලය සහ
          දිස්ත්‍රික්කය අනුව. ඔයාගේ දිස්ත්‍රික්කය හොයාගෙන බලන්න.
        </p>

        {/* The facts a student checks before the numbers. */}
        <Card radius="card" className="mt-8 p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ict-fg-mute">Lowest cut-off, any district</dt>
              <dd className="mt-0.5 font-display text-2xl font-extrabold text-ict-fg">
                {formatZ(course.lowest)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ict-fg-mute">Highest cut-off, any district</dt>
              <dd className="mt-0.5 font-display text-2xl font-extrabold text-ict-fg">
                {formatZ(course.highest)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ict-fg-mute">Streams that can apply</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {course.streams.map((s) => (
                  <Badge key={s.key}>{s.name}</Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ict-fg-mute">Course</dt>
              <dd className="mt-0.5 text-sm text-ict-fg-soft">
                Code {course.code}
                {course.duration ? ` · ${course.duration.replace(/^0/, "")}` : ""}
                {course.intake ? ` · planned intake ${course.intake.toLocaleString("en-LK")}` : ""}
                {course.medium ? ` · ${course.medium} medium` : ""}
              </dd>
            </div>
          </dl>
          {course.aptitudeTest ? (
            <p className="mt-4 text-sm text-ict-fg-soft">
              This course needs an aptitude or practical test as well as the Z-score. The dates are
              in the UGC handbook.
            </p>
          ) : null}
        </Card>

        <section className="mt-12">
          <SectionHeading as="h2">Cut-offs by university and district</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            NQC is the UGC&apos;s mark for &ldquo;no qualified candidates&rdquo; from that district in
            that round. It can happen for several reasons, so it does not mean the course is closed to
            the district. Many places are allocated district by district, which is why the same course
            needs a different Z-score in different districts.
          </p>
          <div className="mt-5 space-y-3">
            {course.universities.map((u, i) => (
              <details
                key={`${u.university}-${u.printedTitle}`}
                open={i === 0}
                className="group rounded-ict-card border border-ict-line bg-ict-surface-card shadow-(--shadow-ict-card)"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2 p-5">
                  <span className="font-display text-base font-bold text-ict-fg">
                    {u.university}
                  </span>
                  <span className="text-xs text-ict-fg-mute">
                    {formatZ(u.lowest)} to {formatZ(u.highest)}
                  </span>
                </summary>
                <div className="border-t border-ict-line px-5 pt-3 pb-5">
                  {u.printedTitle.toLowerCase() !== course.name.toLowerCase() ? (
                    <p className="mb-2 text-xs text-ict-fg-dim">Printed by the UGC as {u.printedTitle}</p>
                  ) : null}
                  <table className="w-full text-sm">
                    <caption className="sr-only">
                      {course.name} at {u.university}, minimum Z-score by district, {CUTOFF_ROUND.coverYear}
                    </caption>
                    <thead>
                      <tr className="text-left text-xs text-ict-fg-mute">
                        <th scope="col" className="py-1.5 font-semibold">District</th>
                        <th scope="col" className="py-1.5 text-right font-semibold">Z-score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {u.districts.map((d) => (
                        <tr key={d.key} className="border-t border-ict-line">
                          <th scope="row" className="py-1.5 text-left font-normal text-ict-fg-soft">
                            {d.name}
                          </th>
                          <td
                            className={`py-1.5 text-right font-mono ${d.cutoff === null ? "text-ict-fg-dim" : "text-ict-fg"}`}
                          >
                            {formatZ(d.cutoff)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </section>

        {course.eligibility ? (
          <section className="mt-12">
            <SectionHeading as="h2">Who can apply</SectionHeading>
            <Card radius="card" className="mt-4 p-6">
              <p className="text-sm leading-relaxed text-ict-fg-soft">{course.eligibility}</p>
              <p className="mt-3 text-xs text-ict-fg-dim">
                From the UGC handbook {CUTOFF_ROUND.handbookCoverYear}, page {course.handbookPage}.
                The handbook is the authority — read the full rules there before you apply.
              </p>
            </Card>
          </section>
        ) : null}

        {/* The one feature card: from last year's number to next year's chance. */}
        <Card variant="feature" radius="panel" className="mt-12 p-6 sm:p-8">
          <h2 className="font-display text-lg font-extrabold">Last year&apos;s cut-off is not this year&apos;s</h2>
          <p className="mt-2 text-sm text-ict-on-feature-soft">
            Cut-offs move every year. Campus Match reads eight rounds of these tables for your district
            and estimates your chance at {course.name} and every other course your stream can apply
            for in the coming round. An estimate, not a promise.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <ButtonLink href="/campus-match" variant="primary">
              See Campus Match
            </ButtonLink>
            <Link href={checkerHref} className="text-sm font-semibold text-ict-on-feature underline underline-offset-4">
              Or check your Z-score free
            </Link>
          </div>
        </Card>

        {siblings.length > 0 ? (
          <section className="mt-12">
            <SectionHeading as="h2">Other courses the same stream can apply for</SectionHeading>
            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/z-score-cutoffs/${s.slug}`}
                    className="flex items-center justify-between gap-3 rounded-ict-md px-3 py-2 text-sm text-ict-fg-soft transition-colors duration-[120ms] hover:bg-ict-surface-hover hover:text-ict-fg"
                  >
                    <span>{s.name}</span>
                    <span className="font-mono text-xs text-ict-fg-mute">from {formatZ(s.lowest)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-10 text-xs leading-relaxed text-ict-fg-dim">
          Source:{" "}
          <a href={CUTOFF_ROUND.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            UGC, minimum Z-scores for university admission {CUTOFF_ROUND.coverYear}
          </a>
          . {CUTOFF_ROUND.basis}. ICT Campus is not affiliated with the UGC, and this page is not
          official advice — check the UGC handbook before you apply. New to Z-scores?{" "}
          <Link href="/z-score" className="underline underline-offset-2">
            How the Z-score works
          </Link>
          .
        </p>

        <CampusFooter />
      </main>
    </>
  );
}
