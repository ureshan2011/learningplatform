import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getCohort, isEnrolmentOpen } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getPayHereConfig, getPaymentSettings, isBankSlipEnabled } from "@/lib/payments/records";
import { formatDate, formatLKR } from "@/lib/format";
import { getT, localeAttrs } from "@/lib/i18n/server";
import { CAMPUS_READY, CAMPUS_READY_WEEKS } from "@/lib/content/campus-ready";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { Badge, Card, Eyebrow, Notice, PageHeader, SectionBar, StatusChip } from "@/components/ds";

/**
 * One Campus Ready intake, for a signed-in student.
 *
 * Its own route rather than a branch inside `/subjects/[subjectId]`, because a
 * cohort is a different shape: fixed dates, one payment, a syllabus that runs
 * week by week instead of a subscription that renews. `getSubject` is A/L-only
 * by design, so that page would 404 on a cohort id anyway.
 *
 * Readable before enrolling. The week list is the sales pitch as much as the
 * timetable, and hiding it behind payment would mean asking a student for
 * Rs 30,000 without showing them what they get.
 */
export default async function CampusCohortPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const user = await requirePageUser(`/campus/${subjectId}`);

  const subject = await getCohort(subjectId);
  if (!subject?.cohort) notFound();
  const term = subject.cohort;

  const [access, payhere, paymentSettings, t, loc] = await Promise.all([
    hasAccess(user.uid, subjectId),
    getPayHereConfig(),
    getPaymentSettings(),
    getT(),
    localeAttrs(),
  ]);
  const bankSlipOn = isBankSlipEnabled(paymentSettings);

  // Server Component: renders once per request, so reading the clock here is
  // deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const enrolled = access.allowed;
  const open = isEnrolmentOpen(subject, now);
  const started = now >= term.startsAt;

  return (
    <main lang={loc.lang} className={loc.className}>
      <PageHeader title={subject.name} subtitle={CAMPUS_READY.tagline} />

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Card variant="feature" radius="panel" className="p-6">
            <Eyebrow>{CAMPUS_READY.certificateTitle}</Eyebrow>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip tone={enrolled ? "success" : open ? "brand" : "neutral"}>
                {enrolled
                  ? t("campus.enrolled")
                  : open
                    ? t("campus.enrolBy", { date: formatDate(term.enrolmentClosesAt) })
                    : t("campus.closed")}
              </StatusChip>
              <Badge tone="neutral">{t("campus.weeks", { count: CAMPUS_READY.weeks })}</Badge>
            </p>
            <p className="mt-4 text-sm text-ict-ink-300">
              {t("campus.starts", { date: formatDate(term.startsAt) })} ·{" "}
              {t("campus.runsUntil", { date: formatDate(term.endsAt) })}
            </p>

            {enrolled && !started ? (
              <div className="mt-4">
                <Notice tone="info">
                  {t("campus.notStarted", { date: formatDate(term.startsAt) })}
                </Notice>
              </div>
            ) : null}

            {!enrolled && open ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {payhere.configured ? (
                  <SubscribeButton subjectId={subject.id} sandbox={payhere.mode === "sandbox"} />
                ) : null}
                {bankSlipOn ? (
                  <Link
                    href={`/pay/slip?subject=${subject.id}`}
                    className="text-sm font-semibold text-ict-orange-400 underline-offset-4 hover:underline"
                  >
                    {t("dash.payByBank")}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </Card>

          <section>
            <SectionBar title={t("campus.whatYouLearn")} />
            <Card radius="card" className="p-5">
              <ol className="space-y-3.5">
                {CAMPUS_READY_WEEKS.map((w) => (
                  <li
                    key={w.week}
                    className="border-b border-ict-border-dark pb-3.5 last:border-0 last:pb-0"
                  >
                    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="text-xs font-semibold text-ict-ink-400">
                        {t("campus.week", { n: w.week })}
                      </span>
                      <span className="font-display text-base font-bold text-ict-paper-50">
                        {w.title}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ict-ink-300">{w.summary}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </section>
        </div>

        <aside className="space-y-3">
          <Card radius="card" className="p-5">
            <Eyebrow>{t("campus.title")}</Eyebrow>
            <p className="mt-3 font-display text-2xl font-extrabold text-ict-paper-50">
              {formatLKR(term.feeLKR)}
            </p>
            <p className="mt-1 text-sm text-ict-ink-300">
              {t("campus.onePayment", { price: formatLKR(term.feeLKR) })}
            </p>
          </Card>

          {/* Said before payment, not after. A student who finds out on day one
              that they cannot run Power BI on their phone is a refund. */}
          <Notice tone="warning">{t("campus.laptopNeeded")}</Notice>
        </aside>
      </div>
    </main>
  );
}
