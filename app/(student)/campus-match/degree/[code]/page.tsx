import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { getInputs } from "@/lib/campus-match/inputs";
import { courseHistory, getProfile, profileCodes } from "@/lib/campus-match/profiles";
import { handbookCoverYear } from "@/lib/campus-match/data";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import { getLocale, localeAttrs } from "@/lib/i18n/server";
import { Badge, Card, Eyebrow, PageHeader } from "@/components/ds";
import { CutoffHistory } from "@/components/campus-match/CutoffHistory";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * One degree, in the reader's language.
 *
 * Owned only, like the report: the cut-off history in a student's own district
 * is the paid half of this product. Two sources sit side by side here and are
 * labelled as such — the UGC's handbook and cut-off tables for everything with
 * a number in it, and ICT Campus's own plain description of the subject, which
 * carries no figure at all.
 */

const DISTRICT_NAMES = new Map(districts.districts.map((d) => [d.key, d.name]));
const STREAM_NAMES = new Map(streams.streams.map((s) => [s.key, s.name]));

export default async function DegreeProfilePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!profileCodes().includes(code)) notFound();

  const user = await requirePageUser(`/campus-match/degree/${code}`);
  const access = await hasAccess(user.uid, CAMPUS_MATCH_ID);
  if (!access.allowed) redirect("/campus-match");

  const [locale, loc, inputs] = await Promise.all([
    getLocale(),
    localeAttrs(),
    getInputs(user.uid),
  ]);

  const profile = getProfile(code, locale);
  if (!profile) notFound();

  const district = inputs?.district;
  const history = district ? courseHistory(code, district) : [];
  const districtName = district ? (DISTRICT_NAMES.get(district) ?? district) : null;
  const admits = profile.course.streams.map((s) =>
    s === "any" ? "Any stream" : (STREAM_NAMES.get(s) ?? s),
  );

  return (
    <main
      lang={loc.lang}
      className={`${loc.className} mx-auto max-w-[760px] px-4 py-5 sm:px-6 sm:py-6`}
    >
      <PageHeader
        eyebrow={profile.faculty[locale === "si" ? "si" : "en"]}
        title={profile.course.name}
        subtitle={profile.about}
      />

      <Card radius="panel" className="mt-5 p-5 sm:p-6">
        <Eyebrow>Who may apply</Eyebrow>
        <p className="mt-2.5 flex flex-wrap gap-2">
          {admits.map((name) => (
            <Badge key={name} tone="neutral">
              {name}
            </Badge>
          ))}
          {profile.course.aptitudeTest ? <Badge tone="warning">Aptitude test</Badge> : null}
        </p>
        {/* True of every course today: the handbook writes its subject rules as
            prose with alternatives, and none has been reduced to a machine rule.
            Saying so is the honest version of not having reduced it. */}
        <p className="mt-3 text-sm leading-relaxed text-ict-ink-300">
          The stream is the only rule applied here. Several courses also ask for particular
          subjects, and the handbook writes those as prose with alternatives — read the
          handbook entry before you apply.
          {profile.course.handbookPage
            ? ` This course is on page ${profile.course.handbookPage} of the ${handbookCoverYear() ?? ""} Courses of Study handbook.`
            : ""}
        </p>
      </Card>

      {profile.universities.length > 0 ? (
        <Card radius="panel" className="mt-4 p-5 sm:p-6">
          <Eyebrow>Where it is offered</Eyebrow>
          <ul className="mt-2.5">
            {profile.universities.map((name) => (
              <li
                key={name}
                className="border-t border-ict-border-dark py-2.5 text-sm text-ict-paper-50 first:border-t-0"
              >
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ict-ink-400">
            As listed in the most recent published cut-off table.
          </p>
        </Card>
      ) : null}

      {history.length > 0 && districtName ? (
        <Card radius="panel" className="mt-4 p-5 sm:p-6">
          <Eyebrow>What it has needed in {districtName}</Eyebrow>
          <div className="mt-4">
            <CutoffHistory points={history} districtName={districtName} z={inputs?.z} />
          </div>
        </Card>
      ) : null}

      <Card variant="feature" radius="panel" className="mt-4 p-5 sm:p-6">
        <Eyebrow>While you wait</Eyebrow>
        <p className="mt-2.5 text-sm leading-relaxed text-ict-paper-200">
          Results to registration is a long gap. Campus Ready is a twelve-week programme for
          exactly that stretch.
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/campus-ready"
            className="font-semibold text-ict-paper-50 underline underline-offset-4"
          >
            See what Campus Ready covers
          </Link>
        </p>
      </Card>

      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">
        Cut-offs and eligibility are from the UGC&rsquo;s own published tables and handbook. The
        description of the subject is ICT Campus&rsquo;s own plain summary, not the UGC&rsquo;s
        words and not a syllabus — the handbook and the university decide what is taught. ICT
        Campus is not affiliated with the UGC.
      </p>

      <p className="mt-4 text-sm">
        <Link
          href="/campus-match/report"
          className="font-semibold text-ict-orange-400 underline underline-offset-4"
        >
          Back to my report
        </Link>
      </p>
    </main>
  );
}
