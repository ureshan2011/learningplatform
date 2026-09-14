import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { getT, localeAttrs, type Translator } from "@/lib/i18n/server";
import { hasAccess } from "@/lib/payments/entitlements";
import { getInputs, saveInputs } from "@/lib/campus-match/inputs";
import { buildReport } from "@/lib/campus-match/report";
import { dataFreshness, roundSpan } from "@/lib/campus-match/data";
import { schemeRule, schemeUnstated } from "@/lib/campus-match/scheme";
import { ADMISSION_ROUND, CAMPUS_MATCH_ID, CAMPUS_MATCH_NAME } from "@/lib/campus-match/cycle";
import { Badge, Card, Eyebrow, Notice, PageHeader, StatCard } from "@/components/ds";
import { Bands } from "@/components/campus-match/Bands";
import {
  OrderBuilder,
  type OrderCandidate,
  type OrderLabels,
} from "@/components/campus-match/OrderBuilder";
import { ChangeAnswers } from "@/components/campus-match/ChangeAnswers";
import { PrintReport } from "@/components/campus-match/PrintReport";
import { ReportInputs, type InputLabels } from "@/components/campus-match/ReportInputs";
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

  const [t, loc] = await Promise.all([getT(), localeAttrs()]);
  const freshness = dataFreshness();
  const span = roundSpan();
  const sourceLine = [
    t("match.source", {
      from: span.from ?? "—",
      to: span.to ?? "—",
      date: freshness.coverYear ?? "—",
    }),
    t("match.estimate"),
    t("match.notUgc"),
  ].join(" ");

  /* ---------------------------------------------------------------------- */
  /* Nothing stored yet — bought from the dashboard, not through the checker  */
  /* ---------------------------------------------------------------------- */
  if (!inputs) {
    return (
      <main
        lang={loc.lang}
        className={`${loc.className} mx-auto max-w-[820px] px-4 py-5 sm:px-6 sm:py-6`}
      >
        <PageHeader
          eyebrow={`${ADMISSION_ROUND} admission round`}
          title={CAMPUS_MATCH_NAME}
          subtitle={t("match.needAnswers")}
        />
        <Card radius="panel" className="mt-5 p-5 sm:p-6">
          <ReportInputs
            districts={CHECKER_DISTRICTS}
            streams={CHECKER_STREAMS}
            zMin={Z_MIN}
            zMax={Z_MAX}
            labels={inputLabels(t, Z_MIN, Z_MAX)}
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

  // Everything worth ordering: the long tail of unlikely courses would make the
  // picker unusable, and a student does not write a 3% course on the form.
  const candidates: OrderCandidate[] = [
    ...report.bands.likely,
    ...report.bands.possible,
    ...report.bands.reach,
  ]
    .filter((row) => row.chance !== null)
    .map((row) => ({
      key: row.key,
      course: row.course,
      university: row.university,
      chance: row.chance as number,
    }));

  return (
    <main
      lang={loc.lang}
      className={`${loc.className} ict-print mx-auto max-w-[820px] px-4 py-5 sm:px-6 sm:py-6`}
    >
      <PageHeader
        eyebrow={`${ADMISSION_ROUND} admission round`}
        title={CAMPUS_MATCH_NAME}
        subtitle={t("match.sub", {
          z: inputs.z,
          district: report.districtName,
          stream: streamName,
        })}
      />

      {freshness.stale ? (
        <div className="mt-4">
          <Notice tone="warning">{t("match.stale")}</Notice>
        </div>
      ) : null}

      <Card variant="feature" radius="panel" className="mt-5 p-6 sm:p-8">
        <Eyebrow>{t("match.standing")}</Eyebrow>
        <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-ict-paper-50">
          {shortlist === 1 ? t("match.headlineOne") : t("match.headline", { n: shortlist })}
        </p>
        <p className="mt-2 max-w-[56ch] text-sm text-ict-orange-200">
          {t("match.breakdown", {
            likely: report.counts.likely,
            possible: report.counts.possible,
            total:
              report.counts.likely +
              report.counts.possible +
              report.counts.reach +
              report.counts.unlikely,
            district: report.districtName,
          })}
        </p>
        <p className="mt-4 flex flex-wrap gap-2">
          <Badge tone="neutral">{t("match.move", { z: report.typicalMove })}</Badge>
          {freshness.coverYear ? (
            <Badge tone="neutral">{t("match.latest", { year: freshness.coverYear })}</Badge>
          ) : null}
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="check_circle" label={t("match.bands.likely")} value={report.counts.likely} />
        <StatCard icon="flag" label={t("match.bands.possible")} value={report.counts.possible} />
        <StatCard icon="trending_up" label={t("match.bands.reach")} value={report.counts.reach} />
        <StatCard icon="info" label={t("match.bands.unlikely")} value={report.counts.unlikely} />
      </div>

      <Bands report={report} t={t} />

      <OrderBuilder
        candidates={candidates}
        initial={inputs.preferences}
        orderRuleUnstated={schemeUnstated("preferenceProcessing")}
        sourceQuote={schemeRule("preferencesOnForm")?.text}
        labels={orderLabels(t)}
      />

      <Card radius="panel" className="mt-4 p-5 sm:p-6">
        <p className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
          {t("match.methodTitle")}
        </p>
        {/* Said plainly and in full, because the whole product rests on a
            student believing a percentage that nobody can verify on the day. */}
        <p className="mt-2 text-sm leading-relaxed text-ict-ink-300">{t("match.method1")}</p>
        <p className="mt-3 text-sm leading-relaxed text-ict-ink-300">{t("match.method2")}</p>
        <p className="mt-4 text-sm">
          <Link
            href="/university-pathways"
            className="font-semibold text-ict-orange-400 underline underline-offset-4"
          >
            {t("match.seeFree")}
          </Link>
        </p>
      </Card>

      <div className="ict-print-hide mt-5 flex flex-wrap items-center gap-4">
        <PrintReport label={t("match.print")} />
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
          labels={{
            open: t("match.change"),
            hint: t("match.changeHint"),
            inputs: inputLabels(t, Z_MIN, Z_MAX),
          }}
        />
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">{sourceLine}</p>
    </main>
  );
}

/**
 * The strings the client components need, since the dictionary stays on the
 * server.
 *
 * Both return types are written out on purpose. Every field is a `string`, so
 * accidentally putting a `(x) => t(...)` in one of these is a typecheck error
 * rather than a 500 in production — React cannot serialise a function to a
 * Client Component, and it throws while rendering the page when you try.
 */
function inputLabels(t: Translator, zMin: number, zMax: number): InputLabels {
  return {
    z: t("match.zLabel"),
    zHint: t("match.zHint", { min: zMin, max: zMax }),
    district: t("match.districtLabel"),
    stream: t("match.streamLabel"),
    choose: t("match.choose"),
    passes: t("match.passes"),
    passesHint: t("match.passesHint"),
    medium: t("match.medium"),
    build: t("match.build"),
    saving: t("match.saving"),
    error: t("match.saveError"),
    cancel: t("match.deleteCancel"),
  };
}

function orderLabels(t: Translator): OrderLabels {
  return {
    title: t("match.orderTitle"),
    intro: t("match.orderIntro"),
    empty: t("match.orderEmpty"),
    // Templates, not functions: a Server Component cannot hand a function to a
    // Client Component, and `interpolate` leaves `{pct}` in place when it is
    // given no variables. The browser fills them in.
    nothing: t("match.orderNothing"),
    count: t("match.orderCount"),
    add: t("match.orderAdd"),
    choose: t("match.choose"),
    save: t("match.orderSave"),
    saved: t("match.orderSaved"),
    saving: t("match.saving"),
    error: t("match.orderError"),
    unstated: t("match.orderUnstated"),
    assumed: t("match.orderRule"),
    independence: t("match.independence"),
    quote: t("match.orderQuote"),
    up: t("match.orderUp"),
    down: t("match.orderDown"),
    remove: t("match.orderRemove"),
  };
}
