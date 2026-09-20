import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { resolveSession } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { getProduct } from "@/lib/queries";
import { getPayHereConfig, getPaymentSettings, isBankSlipEnabled } from "@/lib/payments/records";
import { paymentsPaused } from "@/lib/payments/launch";
import { formatLKR } from "@/lib/format";
import { ensureCampusMatch } from "@/lib/campus-match/ensure";
import { getCampusMatchSettings } from "@/lib/campus-match/settings";
import { dataFreshness, roundSpan } from "@/lib/campus-match/data";
import {
  ADMISSION_ROUND,
  CAMPUS_MATCH_FEE_LKR,
  CAMPUS_MATCH_ID,
  CAMPUS_MATCH_NAME,
} from "@/lib/campus-match/cycle";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Badge, Card, Eyebrow, Notice, PageHeader } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import { ButtonLink as CreamButtonLink, Card as CreamCard, Eyebrow as CreamEyebrow } from "@/components/ds-cream";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus Match — which degrees your Z-score can reach",
  description:
    "A one-payment report estimating your chance at every state university course in your district for the coming admission round, from the UGC's own published cut-offs. An estimate, not a promise.",
  alternates: { canonical: "/campus-match" },
};

/**
 * Campus Match: the sales page, the checkout, and the door to the report.
 *
 * One route, three states, because the call to action on the free checker has
 * to land somewhere that works whether or not the visitor has ever signed in.
 * Signed out it is a public sales page; signed in it is the buy card; owned it
 * redirects to the report.
 *
 * Whatever the visitor typed into the free checker arrives in the query string
 * and is carried through every one of those states — through the OTP screen and
 * out the other side — so nothing is ever typed twice.
 */

const WHAT_YOU_GET = [
  "An estimated chance for every course your stream can apply for, in your district",
  "Four bands — Likely, Possible, Reach, Unlikely — so the list sorts itself",
  "An application-order builder that shows what your list is likely to return",
  "What each degree actually teaches in first year, in Sinhala or English",
  "A printable report and a share card",
];

function summarise(
  params: Record<string, string | string[] | undefined>,
): { label: string; value: string }[] {
  const one = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const districtName = districts.districts.find((d) => d.key === one("d"))?.name;
  const streamName = streams.streams.find((s) => s.key === one("s"))?.name;
  const chips: { label: string; value: string }[] = [];
  if (one("z")) chips.push({ label: "Z-score", value: one("z") as string });
  if (districtName) chips.push({ label: "District", value: districtName });
  if (streamName) chips.push({ label: "Stream", value: streamName });
  return chips;
}

export default async function CampusMatchPage({
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

  const { user } = await resolveSession();

  // The console can edit the price, so it is read rather than assumed — but a
  // Firestore that is briefly unreachable must not 500 a public sales page.
  // The constant is the same number the product is created with.
  const subject = await getProduct(CAMPUS_MATCH_ID).catch(() => undefined);
  const freshness = dataFreshness();
  const fee = formatLKR(subject?.product?.feeLKR ?? CAMPUS_MATCH_FEE_LKR);
  const span = roundSpan();
  const sourceLine = `Based on UGC rounds ${span.from ?? "—"} to ${span.to ?? "—"}, published ${freshness.coverYear ?? "—"}. An estimate from published figures, not a promise. ICT Campus is not affiliated with the UGC.`;
  const chips = summarise(params);

  // Owned already — the report is the point, not this page.
  if (user) {
    const access = await hasAccess(user.uid, CAMPUS_MATCH_ID);
    if (access.allowed) redirect(query ? `/campus-match/report?${query}` : "/campus-match/report");
  }

  /* ---------------------------------------------------------------------- */
  /* Signed out: the public sales page, on the cream system                   */
  /* ---------------------------------------------------------------------- */
  if (!user) {
    return (
      <div>
        <SiteHeader user={null} />
        <main className="mx-auto w-full max-w-[760px] px-5 py-10 sm:py-14">
          <CreamEyebrow>{ADMISSION_ROUND} admission round</CreamEyebrow>
          <h1 className="mt-2.5 font-display text-[clamp(30px,5vw,46px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-ict-ink-900">
            Which degrees your Z-score can actually reach
            <span className="text-ict-orange-500">.</span>
          </h1>
          <p className="mt-4 max-w-[56ch] text-lg text-ict-ink-400">
            An estimated chance at every state university course your stream can apply for, in your
            own district, for the {ADMISSION_ROUND} round — built from the UGC&rsquo;s own
            published cut-offs.
          </p>

          {chips.length > 0 ? (
            <p className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex h-8 items-center rounded-full bg-ict-paper-200 px-3 text-xs font-semibold text-ict-ink-900"
                >
                  {c.label}: {c.value}
                </span>
              ))}
            </p>
          ) : null}

          <CreamCard radius="card" className="mt-6 p-6">
            <p className="font-display text-2xl font-extrabold text-ict-ink-900">{fee}</p>
            <p className="mt-1 text-sm text-ict-ink-400">One payment. Yours for the whole cycle.</p>
            <ul className="mt-4 space-y-2">
              {WHAT_YOU_GET.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm text-ict-ink-500">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ict-orange-500" />
                  {line}
                </li>
              ))}
            </ul>
            <CreamButtonLink
              href={query ? `/campus-match?${query}` : "/campus-match"}
              variant="primary"
              className="mt-5"
            >
              Sign in to continue
            </CreamButtonLink>
            <p className="mt-2 text-xs text-ict-ink-400">
              One SMS code, no password. Everything you typed is kept.
            </p>
          </CreamCard>

          <p className="mt-6 text-xs leading-relaxed text-ict-ink-400">{sourceLine}</p>
          <p className="mt-3 text-sm">
            <Link
              href={query ? `/university-pathways?${query}` : "/university-pathways"}
              className="font-semibold text-ict-orange-600 underline underline-offset-4"
            >
              Check last round&rsquo;s cut-offs free first
            </Link>
          </p>
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Signed in, not owned: the buy card, on the app's dark system             */
  /* ---------------------------------------------------------------------- */
  // Only now: creating the product and reading its publish state are writes and
  // reads nobody signed out should pay for, on a page search engines crawl.
  await ensureCampusMatch();
  const [settings, payhere, paymentSettings] = await Promise.all([
    getCampusMatchSettings(),
    getPayHereConfig(),
    getPaymentSettings(),
  ]);
  const paused = paymentsPaused();
  const onSale = settings.published && !freshness.stale && Boolean(subject?.active);
  const cardPaymentsOn = !paused && onSale && payhere.configured;
  const bankSlipOn = !paused && onSale && isBankSlipEnabled(paymentSettings);

  return (
    <PageShell width="reading">
      <PageHeader
        eyebrow={`${ADMISSION_ROUND} admission round`}
        title={CAMPUS_MATCH_NAME}
        subtitle="Which degrees your Z-score can reach, district by district."
      />

      <Card variant="feature" radius="panel" className="mt-5 p-6 sm:p-8">
        <Eyebrow>What you get</Eyebrow>
        <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-ict-paper-50">
          {fee}
        </p>
        <p className="mt-1 text-sm text-ict-orange-200">One payment. Yours for the whole cycle.</p>

        <ul className="mt-5 space-y-2">
          {WHAT_YOU_GET.map((line) => (
            <li key={line} className="flex gap-2.5 text-sm text-ict-paper-200">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ict-orange-400" />
              {line}
            </li>
          ))}
        </ul>

        {chips.length > 0 ? (
          <>
            <p className="mt-5 text-xs text-ict-orange-200">
              Kept from your check — nothing to type again:
            </p>
            <p className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => (
                <Badge key={c.label} tone="neutral">
                  {c.label}: {c.value}
                </Badge>
              ))}
            </p>
          </>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {cardPaymentsOn ? (
            <SubscribeButton
              subjectId={CAMPUS_MATCH_ID}
              sandbox={payhere.mode === "sandbox"}
              label={`Buy — ${fee}`}
              kind="campus-match"
            />
          ) : null}
          {bankSlipOn ? (
            <Link
              href={`/pay/slip?subject=${CAMPUS_MATCH_ID}`}
              className="text-sm font-semibold text-ict-paper-50 underline-offset-4 hover:underline"
            >
              Pay by bank deposit
            </Link>
          ) : null}
        </div>

        {/* Why there is nothing to click. Each of these is a real refusal the
            checkout would give, said here instead of after a failed tap. */}
        {!cardPaymentsOn && !bankSlipOn ? (
          <div className="mt-5">
            <Notice tone="info">
              {paused
                ? "We are not taking payments yet. We will tell you the day they open."
                : !settings.published
                  ? "Not on sale yet — this cycle's report is still being checked."
                  : freshness.stale
                    ? "This cycle's data is out of date and the report is not on sale."
                    : "Payment is not set up yet."}
            </Notice>
          </div>
        ) : null}
      </Card>

      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">{sourceLine}</p>

      <p className="mt-3 text-sm">
        <Link
          href={query ? `/university-pathways?${query}` : "/university-pathways"}
          className="font-semibold text-ict-orange-400 underline underline-offset-4"
        >
          Check last round&rsquo;s cut-offs free
        </Link>
      </p>
    </PageShell>
  );
}
