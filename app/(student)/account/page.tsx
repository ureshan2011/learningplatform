import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { formatDate, formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { publicEnv } from "@/lib/env";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { ParentLinkPanel } from "@/components/account/ParentLinkPanel";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getLocale, getT, localeAttrs } from "@/lib/i18n/server";
import { Icon } from "@/components/ui/Icon";
import {
  Badge,
  ButtonLink,
  Card,
  Eyebrow,
  IconBadge,
  PageHeader,
  SectionBar,
  StatusChip,
} from "@/components/ds";
import { MAX_DEVICES_PER_USER, type Payment, type User } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  teacher: "Teacher — full access",
  admin: "Admin — full access",
  parent: "Parent",
};

/**
 * Account and billing.
 *
 * One page answering the four questions a student or their parent actually
 * arrives with: who am I signed in as, what am I paying for, where are my
 * receipts, and which devices am I using. Everything else — the referral code,
 * the parent link — sits below that.
 */
export default async function AccountPage() {
  const session = await requirePageUser("/account");

  const [t, locale, loc] = await Promise.all([getT(), getLocale(), localeAttrs()]);

  const [snap, enrollments, subjects, payments] = await Promise.all([
    col.users().doc(session.uid).get(),
    listEnrollments(session.uid),
    listSubjects(),
    // The student's own payment history. One equality filter, narrowed and
    // sorted in memory — same index-free rule as the rest of lib/queries.ts.
    col
      .payments()
      .where("uid", "==", session.uid)
      .limit(100)
      .get()
      .then((s) =>
        (s.docs.map((d) => d.data() as Payment) as Payment[])
          .filter((p) => p.status === "paid" || p.status === "refunded" || p.status === "pending")
          .sort((a, b) => (b.paidAt ?? b.createdAt) - (a.paidAt ?? a.createdAt))
          .slice(0, 24),
      )
      .catch(() => [] as Payment[]),
  ]);

  const user = snap.data() as User;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const devices = user.devices ?? [];
  const referralLink = `${publicEnv.appUrl}/signin?ref=${user.referralCode}`;
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountLKR, 0);

  return (
    <main lang={loc.lang} className={`mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6 ${loc.className}`}>
      <PageHeader
        eyebrow={t("account.title")}
        title={user.name}
        subtitle={`${ROLE_LABEL[user.role] ?? user.role} · ${formatLocal(user.phone)}`}
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section>
            <SectionBar title={t("account.subscriptions")} hint={t("account.subscriptionsHint")} />
            {enrollments.length === 0 ? (
              <Card radius="card" className="p-5">
                <p className="text-sm text-ict-ink-300">
                  {t("account.noSubscriptions")}
                </p>
                <ButtonLink href="/dashboard" variant="outline" size="sm" arrow="right" className="mt-4">
                  {t("account.browseClasses")}
                </ButtonLink>
              </Card>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {enrollments.map((e) => (
                  <li key={e.id}>
                    <Card radius="md" className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ict-paper-50">
                          {subjectById.get(e.subjectId)?.name ?? e.subjectId}
                        </p>
                        <p className="mt-0.5 text-xs text-ict-ink-300">via {e.source}</p>
                      </div>
                      <StatusChip tone={e.status === "active" ? "success" : "neutral"}>
                        {e.status === "active" ? `until ${formatDate(e.currentPeriodEnd)}` : e.status}
                      </StatusChip>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionBar
              title={t("account.payments")}
              hint={
                totalPaid > 0
                  ? t("account.totalPaid", { amount: formatLKR(totalPaid) })
                  : t("account.nothingPaid")
              }
            />
            {payments.length === 0 ? (
              <Card radius="card" className="p-5">
                <p className="text-sm text-ict-ink-300">{t("account.noPayments")}</p>
              </Card>
            ) : (
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ict-paper-50">
                        {subjectById.get(p.subjectId)?.name ?? p.subjectId} · {formatLKR(p.amountLKR)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-ict-ink-300">
                        {formatDate(p.paidAt ?? p.createdAt)}
                        {p.receiptNo ? ` · ${p.receiptNo}` : ""}
                      </p>
                    </div>
                    {p.status === "pending" ? (
                      <StatusChip tone="warning">{t("account.waitingApproval")}</StatusChip>
                    ) : p.status === "refunded" ? (
                      <StatusChip tone="neutral">{t("account.refunded")}</StatusChip>
                    ) : (
                      <Link
                        href={`/receipt/${p.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ict-orange-400 underline-offset-4 hover:underline"
                      >
                        <Icon name="receipt_long" className="!text-sm" />
                        {t("account.receipt")}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionBar title={t("account.parentView")} hint={t("account.parentHint")} />
            <Card radius="card" className="p-5">
              <ParentLinkPanel />
            </Card>
          </section>
        </div>

        <aside className="space-y-3">
          {/*
            The sidebar rail carries the same toggle, but that one is small and
            sits below the fold on a phone. A parent helping their child change
            the language will look in Account, so it is here too.
          */}
          <Card radius="card" className="p-5">
            <Eyebrow>{t("account.language")}</Eyebrow>
            <p className="mt-2 text-sm text-ict-ink-300">{t("account.languageHint")}</p>
            <div className="mt-3">
              <LanguageToggle current={locale} />
            </div>
          </Card>

          <Card radius="card" className="p-5">
            <Eyebrow>{t("dash.inviteTitle")}</Eyebrow>
            <p className="mt-2 text-sm text-ict-ink-300">
              Share your code — when they subscribe, you both get{" "}
              <strong className="text-ict-paper-50">3 free days</strong>.
            </p>
            <p className="mt-3 truncate rounded-ict-sm border border-ict-border-dark bg-ict-ink-900 px-3 py-2 font-mono text-xs text-ict-ink-300">
              {referralLink}
            </p>
            <div className="mt-3">
              <WhatsAppShareButton
                text={`Join me on ICT Campus for A/L ICT tuition — sign up with my code and we both get 3 free days.\n${referralLink}`}
              />
            </div>
          </Card>

          <Card radius="card" className="p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>{t("account.devices")}</Eyebrow>
              <Badge tone={devices.length >= MAX_DEVICES_PER_USER ? "warning" : "neutral"}>
                {devices.length}/{MAX_DEVICES_PER_USER}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-ict-ink-300">
              {t("account.devicesBody", { max: MAX_DEVICES_PER_USER })}
            </p>
            <ul className="mt-3 space-y-2">
              {devices.length === 0 ? (
                <li className="text-sm text-ict-ink-300">{t("account.noDevices")}</li>
              ) : (
                devices.map((device) => (
                  <li key={device.deviceHash} className="flex items-center gap-3">
                    <IconBadge icon="smartphone" tone="dark" size={34} round />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ict-paper-50">
                        {device.label}
                      </span>
                      <span className="block text-xs text-ict-ink-300">
                        {t("account.lastUsed", { date: formatDate(device.lastSeenAt) })}
                      </span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          {user.school || user.district ? (
            <Card radius="card" className="p-5">
              <Eyebrow>{t("account.details")}</Eyebrow>
              <dl className="mt-3 space-y-2 text-sm">
                {user.school ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ict-ink-300">{t("account.school")}</dt>
                    <dd className="truncate font-medium text-ict-paper-50">{user.school}</dd>
                  </div>
                ) : null}
                {user.district ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ict-ink-300">{t("account.district")}</dt>
                    <dd className="truncate font-medium text-ict-paper-50">{user.district}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
