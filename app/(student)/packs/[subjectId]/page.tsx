import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getProduct, listContent } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getPayHereConfig, getPaymentSettings, isBankSlipEnabled } from "@/lib/payments/records";
import { paymentsPaused } from "@/lib/payments/launch";
import { formatDate, formatLKR } from "@/lib/format";
import { getT, getLocale } from "@/lib/i18n/server";
import {
  AI_NOTE,
  PACK_BUNDLED_FILES,
  PACK_ITEMS,
  SURVIVAL_PACK,
  bundledFileForSlot,
  pick,
} from "@/lib/content/survival-pack";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { DownloadButton } from "@/components/content/DownloadButton";
import { PackFileButton } from "@/components/packs/PackFileButton";
import {
  Badge,
  ButtonLink,
  Card,
  Eyebrow,
  IconBadge,
  Notice,
  PageHeader,
  SectionBar,
  StatusChip,
  StatusDot,
} from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";

/**
 * The Campus Survival Pack, for a signed-in student.
 *
 * Its own route rather than a branch inside `/subjects/[subjectId]`, for the
 * same reason the cohort has one: `getSubject` is A/L-only by design and would
 * 404 on this id, and what a pack shows — slots, files, guides — has nothing in
 * common with a subscription's timetable.
 *
 * The whole list is readable before buying. Asking someone for money and
 * showing them nothing but a price is how a pack gets refunded, and the list
 * is the sales pitch as much as the contents page.
 */
export default async function PackPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const user = await requirePageUser(`/packs/${subjectId}`);

  const subject = await getProduct(subjectId);
  if (!subject?.product) notFound();
  const product = subject.product;

  const [access, payhere, paymentSettings, items, t, locale] = await Promise.all([
    hasAccess(user.uid, subjectId),
    getPayHereConfig(),
    getPaymentSettings(),
    listContent(subjectId),
    getT(),
    getLocale(),
  ]);

  const owned = access.allowed;
  // Trial-only launch — see `lib/payments/launch.ts`. The pack is a one-off
  // download, so it is not handed out with the trial: the panel says it is not
  // on sale yet rather than quoting a price nobody can pay.
  const paused = paymentsPaused();
  const cardPaymentsOn = !paused && payhere.configured;
  const bankSlipOn = !paused && isBankSlipEnabled(paymentSettings);
  const fee = formatLKR(product.feeLKR);

  // One file per slot, newest wins — `listContent` is already newest-first, so
  // re-uploading a corrected template quietly replaces the old one on the page
  // without the teacher having to delete anything first.
  const packFiles = items.filter((i) => i.kind === "pack");
  const bySlug = new Map<string, (typeof packFiles)[number]>();
  for (const file of packFiles) {
    if (file.slug && !bySlug.has(file.slug)) bySlug.set(file.slug, file);
  }
  const unslotted = packFiles.filter((f) => !f.slug || !PACK_ITEMS.some((i) => i.key === f.slug));

  // The notebook's dataset and the BibTeX library. Only offered for a product
  // that actually ships files, which today is the Survival Pack.
  const bundledExtras =
    subject.id === SURVIVAL_PACK.id ? PACK_BUNDLED_FILES.filter((f) => !f.slot) : [];

  return (
    <PageShell width="reading">
      <PageHeader title={subject.name} subtitle={pick(SURVIVAL_PACK.tagline, locale)} />

      <div className="mt-5 space-y-3">
        <Card variant="feature" radius="panel" className="p-6">
          {owned ? (
            <>
              <Eyebrow>{subject.name}</Eyebrow>
              <p className="mt-3">
                <StatusChip tone="success">
                  {access.enrollment
                    ? t("pack.yoursUntil", { date: formatDate(access.enrollment.currentPeriodEnd) })
                    : t("pack.open")}
                </StatusChip>
              </p>
              <p className="mt-4 text-sm text-ict-paper-200">{t("pack.phoneOk")}</p>
              <Link
                href="/account"
                className="mt-4 inline-block text-sm font-semibold text-ict-paper-50 underline-offset-4 hover:underline"
              >
                {t("pack.seeReceipt")}
              </Link>
            </>
          ) : (
            <>
              <Eyebrow>{paused ? t("launch.eyebrow") : subject.name}</Eyebrow>
              <p className="mt-3 font-display text-3xl font-extrabold text-ict-paper-50">{fee}</p>
              <p className="mt-1 text-sm text-ict-paper-200">
                {paused ? t("launch.waitlist") : t("pack.onePayment", { price: fee })}
              </p>
              {paused ? (
                <div className="mt-5">
                  <Notice tone="info">{t("launch.body")}</Notice>
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {cardPaymentsOn ? (
                    <SubscribeButton
                      subjectId={subject.id}
                      sandbox={payhere.mode === "sandbox"}
                      label={t("pack.buy", { price: fee })}
                      kind="product"
                    />
                  ) : null}
                  {bankSlipOn ? (
                    <Link
                      href={`/pay/slip?subject=${subject.id}`}
                      className="text-sm font-semibold text-ict-paper-50 underline-offset-4 hover:underline"
                    >
                      {t("dash.payByBank")}
                    </Link>
                  ) : null}
                </div>
              )}
            </>
          )}
        </Card>

        {owned ? null : <Notice tone="info">{t("pack.phoneOk")}</Notice>}

        <section>
          <SectionBar title={t("pack.inside")} />
          <div className="grid gap-3 sm:grid-cols-2">
            {PACK_ITEMS.map((item) => {
              const file = item.kind === "download" ? bySlug.get(item.key) : undefined;
              return (
                <Card key={item.key} radius="card" className="flex gap-3.5 p-4">
                  <IconBadge icon={item.icon} tone={owned ? "soft" : "dark"} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-ict-paper-50">
                        {pick(item.title, locale)}
                      </span>
                      {item.fileLabel ? <Badge tone="neutral">{item.fileLabel}</Badge> : null}
                    </p>
                    <p className="mt-1 text-sm text-ict-ink-300">{pick(item.blurb, locale)}</p>

                    <div className="mt-3">
                      {!owned ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ict-ink-400">
                          <StatusDot tone="neutral" />
                          {t("pack.locked")}
                        </span>
                      ) : item.kind === "guide" ? (
                        <ButtonLink
                          href={`/packs/${subject.id}/${item.key}`}
                          variant="outline"
                          size="sm"
                          arrow="right"
                        >
                          {t("pack.read")}
                        </ButtonLink>
                      ) : file ? (
                        // An uploaded file wins over the bundled one, so any of
                        // these can be replaced from the console without a deploy.
                        <DownloadButton
                          contentId={file.id}
                          label={t("pack.download")}
                          expiredMessage={t("pack.expired")}
                        />
                      ) : bundledFileForSlot(item.key) ? (
                        <PackFileButton
                          subjectId={subject.id}
                          name={bundledFileForSlot(item.key)!.name}
                          label={t("pack.download")}
                          expiredMessage={t("pack.expired")}
                        />
                      ) : (
                        // A slot with neither says so plainly. An error here
                        // would read as "you paid and it is broken".
                        <StatusChip tone="neutral">{t("pack.comingSoon")}</StatusChip>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {owned && (unslotted.length > 0 || bundledExtras.length > 0) ? (
          <section>
            <SectionBar title={t("pack.moreFiles")} />
            <Card radius="card" className="divide-y divide-ict-border-dark p-1">
              {bundledExtras.map((extra) => (
                <div key={extra.name} className="flex items-center justify-between gap-3 p-3.5">
                  <span className="min-w-0 truncate text-sm text-ict-paper-50">{extra.name}</span>
                  <PackFileButton
                    subjectId={subject.id}
                    name={extra.name}
                    label={t("pack.download")}
                    expiredMessage={t("pack.expired")}
                  />
                </div>
              ))}
              {unslotted.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 p-3.5">
                  <span className="min-w-0 truncate text-sm text-ict-paper-50">{file.title}</span>
                  <DownloadButton
                    contentId={file.id}
                    label={t("pack.download")}
                    expiredMessage={t("pack.expired")}
                  />
                </div>
              ))}
            </Card>
          </section>
        ) : null}

        <p className="pt-2 text-xs text-ict-ink-400">{pick(AI_NOTE, locale)}</p>
      </div>
    </PageShell>
  );
}
