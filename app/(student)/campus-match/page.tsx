import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { resolveSession, signInUrl } from "@/lib/auth/session";
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
import {
  Badge,
  ButtonLink,
  Card,
  Eyebrow,
  Notice,
  PageHeader,
  SectionHeading,
  StatusDot,
  type StatusTone,
} from "@/components/ds";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { PageShell } from "@/components/ds/PageShell";
import districts from "@/lib/content/ugc/districts.json";
import { campusMetadata } from "@/lib/seo/campus";
import streams from "@/lib/content/ugc/streams.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = campusMetadata({
  title: "Campus Match — which degrees your Z-score can reach",
  description:
    "A one-payment report estimating your chance at every state university course in your district for the coming admission round, from the UGC's own published cut-offs. An estimate, not a promise.",
  path: "/campus-match",
});

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

const HOW_IT_WORKS = [
  {
    title: "Tell it your Z-score, district and stream",
    body: "The three things on your results sheet. If you came from the free checker, they are already filled in.",
  },
  {
    title: "It reads every published round for your district",
    body: "The UGC's cut-off tables from 2018/2019 to the newest round, for every course your stream can apply for, and estimates where each course's line is likely to fall next round.",
  },
  {
    title: "You get a chance for every course, and an order to apply in",
    body: "Each course sorted into a band, and a builder that shows what the list you are about to submit is likely to return.",
  },
];

const BANDS: { name: string; range: string; tone: StatusTone; body: string }[] = [
  { name: "Likely", range: "70% or more", tone: "success", body: "Your Z-score is comfortably above what these have needed." },
  { name: "Possible", range: "35% to 69%", tone: "warning", body: "Could go either way. This is where the order of your list matters most." },
  { name: "Reach", range: "10% to 34%", tone: "info", body: "Below what these usually need, but not out of reach in a soft year." },
  { name: "Unlikely", range: "under 10%", tone: "neutral", body: "Well below recent cut-offs. Listed so you see the whole picture." },
];

const SALES_FAQS = [
  {
    q: "Is this the official UGC result?",
    a: "No. It is an estimate from the UGC's own published cut-offs, made by ICT Campus. ICT Campus is not affiliated with the UGC. Selection is decided only by the UGC, and its handbook is the authority on who may apply for what.",
  },
  {
    q: "How accurate is it?",
    a: "The method was tested by forecasting six past rounds using only the rounds before each one. On average the forecast cut-off was within about 0.14 of the real one, and students it called Likely got in far more often than not. It is still an estimate, not a promise — every screen says so.",
  },
  {
    q: "What does it cost, and how long do I keep it?",
    a: "One payment, not a subscription. It stays open for the whole admission cycle — results, the application window, selection and any appeal — so you can come back when the cut-offs are published.",
  },
  {
    q: "Do I need a laptop?",
    a: "No. It is built for a phone, for results day.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. The free checker shows last round's cut-off for every course your stream can apply for in your district. Campus Match adds the forecast, the chance, the bands and the order builder.",
  },
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
  /* Signed out: the public sales page, on the app's dark system              */
  /* ---------------------------------------------------------------------- */
  // Dark like the rest of the after-A/L cluster — the cut-off pages and the
  // Z-score guide send people here, and a student should not feel they have
  // left the site between the free half and the paid half.
  //
  // This is also the version search engines see, so it carries the content a
  // results-day searcher needs to decide: how it works, what the bands mean,
  // where the numbers come from, and how far to trust them.
  if (!user) {
    const paused = paymentsPaused();
    return (
      <div className="ict-app min-h-dvh">
        <JsonLd
          data={graphJsonLd([
            productJsonLd({
              name: CAMPUS_MATCH_NAME,
              description:
                "A one-payment report estimating a student's chance at every state university course in their district for the coming admission round, from the UGC's published cut-offs.",
              path: "/campus-match",
              priceLKR: subject?.product?.feeLKR ?? CAMPUS_MATCH_FEE_LKR,
              availability: paused || freshness.stale ? "PreOrder" : "InStock",
            }),
            faqJsonLd(SALES_FAQS),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Campus Match", path: "/campus-match" },
            ]),
          ])}
        />
        <SiteHeader user={null} />
        <main className="mx-auto w-full max-w-[760px] px-5 py-10 sm:py-14">
          <Eyebrow>{ADMISSION_ROUND} admission round</Eyebrow>
          <h1 className="mt-2.5 font-display text-[clamp(30px,5vw,46px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-ict-fg">
            Which degrees your Z-score can actually reach
            <span className="text-ict-orange-500">.</span>
          </h1>
          <p className="mt-4 max-w-[56ch] text-lg text-ict-fg-mute">
            An estimated chance at every state university course your stream can apply for, in your
            own district, for the {ADMISSION_ROUND} round — built from the UGC&rsquo;s own
            published cut-offs.
          </p>

          {chips.length > 0 ? (
            <p className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <Badge key={c.label} tone="neutral">
                  {c.label}: {c.value}
                </Badge>
              ))}
            </p>
          ) : null}

          <Card variant="feature" radius="panel" className="mt-6 p-6 sm:p-8">
            <p className="font-display text-3xl font-extrabold tracking-[-0.03em]">{fee}</p>
            <p className="mt-1 text-sm text-ict-on-feature-soft">One payment. Yours for the whole cycle.</p>
            <ul className="mt-5 space-y-2">
              {WHAT_YOU_GET.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm text-ict-on-feature-soft">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ict-orange-400" />
                  {line}
                </li>
              ))}
            </ul>
            {/* Through sign-in and back here with the checker's answers intact.
                This used to link to this same page, which for a signed-out
                visitor is this same card — a loop every results-day visitor
                from the free checker fell into. */}
            <ButtonLink
              href={signInUrl(query ? `/campus-match?${query}` : "/campus-match")}
              variant="primary"
              className="mt-6"
            >
              Sign in to continue
            </ButtonLink>
            <p className="mt-2 text-xs text-ict-on-feature-soft">
              One SMS code, no password. Everything you typed is kept.
            </p>
          </Card>

          <section className="mt-12">
            <SectionHeading as="h2">How it works</SectionHeading>
            <ol className="mt-4 space-y-3">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step.title}>
                  <Card radius="card" className="flex gap-4 p-5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ict-surface-raised font-display text-sm font-bold text-ict-fg">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-ict-fg">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ict-fg-soft">{step.body}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <SectionHeading as="h2">The four bands</SectionHeading>
            <p className="mt-2 text-sm text-ict-fg-mute">
              Every course gets an estimated chance. The bands sort the list so you can see at a
              glance where your application is safe and where it is a gamble.
            </p>
            <Card radius="card" className="mt-4 p-2">
              <ul>
                {BANDS.map((b) => (
                  <li key={b.name} className="flex items-start gap-3 rounded-ict-md px-3 py-3">
                    <StatusDot tone={b.tone} className="mt-2" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ict-fg">
                        {b.name} <span className="font-normal text-ict-fg-mute">· {b.range}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-ict-fg-soft">{b.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <FaqList faqs={SALES_FAQS} heading="Before you buy" />

          <p className="mt-10 text-xs leading-relaxed text-ict-fg-dim">{sourceLine}</p>
          <p className="mt-3 text-sm">
            <Link
              href={query ? `/university-pathways?${query}` : "/university-pathways"}
              className="font-semibold text-ict-accent-fg underline underline-offset-4"
            >
              Check last round&rsquo;s cut-offs free first
            </Link>
          </p>

          <CampusFooter exclude={["/campus-match"]} />
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
