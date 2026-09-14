import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { getInputs, saveInputs } from "@/lib/campus-match/inputs";
import { buildReport } from "@/lib/campus-match/report";
import { dataFreshness, handbookCoverYear, roundSpan } from "@/lib/campus-match/data";
import { ADMISSION_ROUND, CAMPUS_MATCH_ID, CAMPUS_MATCH_NAME } from "@/lib/campus-match/cycle";
import { Badge, Card, Eyebrow, Notice, PageHeader, StatCard } from "@/components/ds";
import { Bands } from "@/components/campus-match/Bands";
import { ChangeAnswers } from "@/components/campus-match/ChangeAnswers";
import { ReportInputs } from "@/components/campus-match/ReportInputs";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Campus Match report",
  robots: { index: false, follow: false },
};

/**
 * The paid report.
 *
 * Behind `hasAccess`, which stays the platform's only access check. Everything
 * on the page is computed here from the published rounds: the dataset does not
 * reach the browser, nothing calls a model, and the arithmetic lives in
 * `lib/campus-match/forecast.ts` where the backtest can score it.
 *
 * A student arriving from the free checker brings their answers in the query
 * string. Those are saved once and then stripped from the URL, so a refresh
 * does not rewrite the document — and so a report link they paste somewhere
 * does not carry their Z-score with it.
 */

const DISTRICT_KEYS = new Set(districts.districts.map((d) => d.key));
const STREAM_KEYS = new Set(streams.streams.map((s) => s.key));
const { min: Z_MIN, max: Z_MAX } = streams.zScoreRange;

const CHECKER_DISTRICTS = districts.districts.map((d) => ({ key: d.key, name: d.name }));
const CHECKER_STREAMS = streams.streams.map((s) => ({
  key: s.key,
  name: s.name,
  subjects: s.subjects,
}));

/** The three answers a query string has to carry before it is worth saving. */
function fromQuery(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const z = Number(one("z"));
  const district = one("d") ?? "";
  const stream = one("s") ?? "";
  if (!Number.isFinite(z) || z < Z_MIN || z > Z_MAX) return null;
  if (!DISTRICT_KEYS.has(district) || !STREAM_KEYS.has(stream)) return null;

  // The checker carries subjects as slugs; the stored document carries the
  // handbook's own spelling, which is what the eligibility rules are written in.
  const slugs = new Set((one("p") ?? "").split(",").filter(Boolean));
  const subjects = CHECKER_STREAMS.find((s) => s.key === stream)?.subjects ?? [];
  const passes = subjects.filter((s) =>
    slugs.has(s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")),
  );

  return { z, district, stream, passes, medium: one("m") === "en" };
}

export default async function CampusMatchReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  ).toString();

  const user = await requirePageUser(
    query ? `/campus-match/report?${query}` : "/campus-match/report",
  );
  const access = await hasAccess(user.uid, CAMPUS_MATCH_ID);
  if (!access.allowed) redirect(query ? `/campus-match?${query}` : "/campus-match");

  const inputs = await getInputs(user.uid);

  // Bootstrap from the free checker, once. Saved only when it actually says
  // something new, then redirected to the bare URL so a refresh is a read.
  const carried = fromQuery(params);
  if (carried) {
    const changed =
      !inputs ||
      inputs.z !== carried.z ||
      inputs.district !== carried.district ||
      inputs.stream !== carried.stream;
    if (changed) {
      await saveInputs({
        uid: user.uid,
        tenantId: user.tenantId,
        ...carried,
        preferences: inputs?.preferences ?? [],
      });
    }
    redirect("/campus-match/report");
  }

  const freshness = dataFreshness();
  const span = roundSpan();
  const sourceLine = `Estimated from UGC rounds ${span.from ?? "—"} to ${span.to ?? "—"}, and the Courses of Study handbook${handbookCoverYear() ? ` (${handbookCoverYear()})` : ""}. An estimate from published figures, not a promise. ICT Campus is not affiliated with the UGC.`;

  /* ---------------------------------------------------------------------- */
  /* Nothing stored yet — bought from the dashboard, not through the checker  */
  /* ---------------------------------------------------------------------- */
  if (!inputs) {
    return (
      <main className="mx-auto max-w-[820px] px-4 py-5 sm:px-6 sm:py-6">
        <PageHeader
          eyebrow={`${ADMISSION_ROUND} admission round`}
          title={CAMPUS_MATCH_NAME}
          subtitle="Three answers and your report is ready."
        />
        <Card radius="panel" className="mt-5 p-5 sm:p-6">
          <ReportInputs
            districts={CHECKER_DISTRICTS}
            streams={CHECKER_STREAMS}
            zMin={Z_MIN}
            zMax={Z_MAX}
          />
        </Card>
        <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">{sourceLine}</p>
      </main>
    );
  }

  const report = buildReport({ z: inputs.z, district: inputs.district, stream: inputs.stream });
  const streamName =
    CHECKER_STREAMS.find((s) => s.key === inputs.stream)?.name ?? inputs.stream;
  const shortlist = report.counts.likely + report.counts.possible;

  return (
    <main className="mx-auto max-w-[820px] px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        eyebrow={`${ADMISSION_ROUND} admission round`}
        title={CAMPUS_MATCH_NAME}
        subtitle={`Z-score ${inputs.z}, ${report.districtName} district, ${streamName}.`}
      />

      {freshness.stale ? (
        <div className="mt-4">
          <Notice tone="warning">
            A newer round has probably been published since this report&rsquo;s figures were
            collected. Check the UGC&rsquo;s own site before you apply.
          </Notice>
        </div>
      ) : null}

      <Card variant="feature" radius="panel" className="mt-5 p-6 sm:p-8">
        <Eyebrow>Where you stand</Eyebrow>
        <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-ict-paper-50">
          {shortlist} {shortlist === 1 ? "course is" : "courses are"} worth putting near the top of
          your list
        </p>
        <p className="mt-2 max-w-[56ch] text-sm text-ict-orange-200">
          {report.counts.likely} likely and {report.counts.possible} possible, out of{" "}
          {report.counts.likely +
            report.counts.possible +
            report.counts.reach +
            report.counts.unlikely}{" "}
          your stream can apply for in {report.districtName}.
        </p>
        <p className="mt-4 flex flex-wrap gap-2">
          <Badge tone="neutral">Typical year-to-year move: {report.typicalMove} Z</Badge>
          {freshness.coverYear ? (
            <Badge tone="neutral">Latest published round: {freshness.coverYear}</Badge>
          ) : null}
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="check_circle" label="Likely" value={report.counts.likely} />
        <StatCard icon="flag" label="Possible" value={report.counts.possible} />
        <StatCard icon="trending_up" label="Reach" value={report.counts.reach} />
        <StatCard icon="info" label="Unlikely" value={report.counts.unlikely} />
      </div>

      <Bands report={report} />

      <Card radius="panel" className="mt-4 p-5 sm:p-6">
        <p className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
          How these numbers were worked out
        </p>
        {/* Said plainly and in full, because the whole product rests on a
            student believing a percentage that nobody can verify on the day. */}
        <p className="mt-2 text-sm leading-relaxed text-ict-ink-300">
          For each course, the cut-off your district has needed in each published round is carried
          forward — half of the recent trend, not all of it, because one strong cohort should not
          become a prediction of more of the same. The spread of past years around that line
          becomes the chance your Z-score clears it. Courses whose history in your district is two
          or three years long are marked &ldquo;short history&rdquo; and given a wider spread.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ict-ink-300">
          No chance is printed above 97% or below 3%. Cut-offs move with who applies each year, and
          no method reading published figures can be certain either way.
        </p>
        <p className="mt-4 text-sm">
          <Link
            href="/university-pathways"
            className="font-semibold text-ict-orange-400 underline underline-offset-4"
          >
            See last round&rsquo;s published cut-offs
          </Link>
        </p>
      </Card>

      <div className="mt-5">
        <ChangeAnswers
          districts={CHECKER_DISTRICTS}
          streams={CHECKER_STREAMS}
          zMin={Z_MIN}
          zMax={Z_MAX}
          initial={{
            z: inputs.z,
            district: inputs.district,
            stream: inputs.stream,
            passes: inputs.passes,
            medium: inputs.medium,
          }}
        />
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">{sourceLine}</p>
    </main>
  );
}
