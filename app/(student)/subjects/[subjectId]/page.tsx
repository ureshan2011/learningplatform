import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject, listContent, listUnits } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { formatDate, formatLKR, formatSessionTime } from "@/lib/format";
import { DownloadButton } from "@/components/content/DownloadButton";
import { StartTrialButton } from "@/components/payments/StartTrialButton";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { SubjectTabs } from "@/components/subject/SubjectTabs";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  Badge,
  ButtonLink,
  Card,
  CardLink,
  EmptyState,
  Eyebrow,
  IconBadge,
  PageHeader,
  SectionBar,
  StatusChip,
} from "@/components/ds";
import { r2Configured } from "@/lib/features";
import { getPayHereConfig } from "@/lib/payments/records";
import { getT, localeAttrs } from "@/lib/i18n/server";
import type { ContentKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<ContentKind, string> = {
  notes: "Notes",
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  replay: "Class replay",
};

const KIND_ICON: Record<ContentKind, IconName> = {
  notes: "description",
  past_paper: "receipt_long",
  marking_scheme: "check_circle",
  replay: "videocam",
};

/**
 * A subject's overview: what it is, what you get, and everything to download.
 *
 * The four study tools used to live in a right-hand "What's included" list that
 * doubled as the only route to them. They are now tabs at the top — peers of
 * this page rather than children of it — so this page can do the one job left:
 * be the library, and, when the student has not paid, be the pitch.
 */
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const user = await requirePageUser(`/subjects/${subjectId}`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  const [items, units, t, loc] = await Promise.all([
    listContent(subjectId),
    listUnits(subjectId),
    getT(),
    localeAttrs(),
  ]);

  // Locked students still see the catalogue — knowing what they are missing is
  // the most effective renewal prompt there is.
  const visible = access.allowed ? items : items.filter((i) => i.isPublic);
  const lockedCount = items.length - visible.length;
  const payhere = await getPayHereConfig();
  const cardPaymentsOn = payhere.configured;

  return (
    <main lang={loc.lang} className={`mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6 ${loc.className}`}>
      <PageHeader
        eyebrow={`${subject.grade} · ${subject.medium} medium`}
        title={subject.name}
        subtitle={subject.description}
        actions={
          access.allowed ? (
            <StatusChip tone="success">
              {access.enrollment
                ? t("subject.activeUntil", { date: formatDate(access.enrollment.currentPeriodEnd) })
                : t("subject.fullAccess")}
            </StatusChip>
          ) : (
            <StatusChip tone="warning">{t("subject.locked")}</StatusChip>
          )
        }
      />

      <div className="mt-5">
        <SubjectTabs
          subjectId={subjectId}
          locked={!access.allowed}
          labels={{
            overview: t("subject.overview"),
            practice: t("nav.practice"),
            mockExams: t("nav.mockExams"),
            codeLab: t("nav.codeLab"),
            certificate: t("nav.certificate"),
          }}
        />
      </div>

      {!access.allowed ? (
        <Card variant="feature" radius="panel" className="mt-4 p-6 sm:p-8">
          <Eyebrow>
            {access.reason === "expired" ? "Your subscription ended" : "Not subscribed yet"}
          </Eyebrow>
          <h2 className="mt-2.5 font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ict-paper-50">
            {lockedCount > 0 ? (
              <>
                {lockedCount} more resource{lockedCount === 1 ? "" : "s"}
                <br />
                unlock when you subscribe
              </>
            ) : (
              <>
                Unlock live classes
                <br />
                and every paper
              </>
            )}
          </h2>
          <p className="mt-3 max-w-md text-sm text-ict-orange-200">
            {formatLKR(subject.priceLKR)} per month — live classes, practice that targets your weak
            topics, timed mock exams and the Code Lab.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/*
              A trial is only offered where `hasAccess` found no enrollment
              document at all — see the reason comment on `startFreeTrial`. A
              lapsed or cancelled subscriber always has one, so they only ever
              see the paid routes.
            */}
            {!access.enrollment ? <StartTrialButton subjectId={subjectId} /> : null}
            {cardPaymentsOn ? (
              <SubscribeButton subjectId={subjectId} sandbox={payhere.mode === "sandbox"} />
            ) : null}
            <Link
              href={`/pay/slip?subject=${subjectId}`}
              className="text-sm font-semibold text-ict-paper-50 underline-offset-4 hover:underline"
            >
              Pay by bank deposit
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section>
            <SectionBar
              title={t("subject.notesPapers")}
              hint={
                access.allowed
                  ? `${visible.length} file${visible.length === 1 ? "" : "s"} to download`
                  : `${visible.length} free · ${lockedCount} locked`
              }
            />
            {!r2Configured() ? (
              <NotConfigured feature="r2" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon="description"
                title={t("subject.nothingPublished")}
                body="Your teacher has not uploaded notes for this subject. Free notes are available meanwhile."
                action={
                  <ButtonLink href="/notes" variant="outline" size="sm" arrow="right">
                    Browse free notes
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="space-y-2">
                {visible.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconBadge icon={KIND_ICON[item.kind]} tone="dark" size={40} round />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ict-paper-50">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ict-ink-300">
                          {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                          {item.isPublic ? " · free" : ""}
                        </p>
                      </div>
                    </div>
                    <DownloadButton contentId={item.id} label={t("subject.download")} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {units.length > 0 ? (
            <section>
              <SectionBar
                title="Syllabus"
                hint={`${units.length} units · ${units.reduce((n, u) => n + u.lessons.length, 0)} lessons`}
                href={`/syllabus/${subjectId}`}
                linkLabel="Full breakdown"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {units.slice(0, 6).map((unit) => (
                  <CardLink
                    key={unit.id}
                    href={`/syllabus/${subjectId}/${unit.id}`}
                    radius="md"
                    className="flex items-start gap-3 p-4"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ict-ink-700 font-mono text-xs font-semibold text-ict-orange-400">
                      {unit.competencyNumber}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ict-paper-50">
                        {unit.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-ict-ink-300">
                        {unit.lessons.length} lessons · Grade {unit.gradeYear}
                      </span>
                    </span>
                  </CardLink>
                ))}
              </div>
            </section>
          ) : subject.syllabusTopics.length > 0 ? (
            <section>
              <SectionBar title="Syllabus" hint={`${subject.syllabusTopics.length} topics`} />
              <ol className="grid gap-2 sm:grid-cols-2">
                {subject.syllabusTopics.map((topic, i) => (
                  <li
                    key={topic}
                    className="flex items-center gap-3 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-3.5"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ict-ink-700 font-mono text-[11px] font-semibold text-ict-orange-400">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-medium text-ict-paper-50">{topic}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[76px]">
          <Card radius="card" className="p-5">
            {access.allowed ? (
              <>
                <Eyebrow>{t("subject.yourAccess")}</Eyebrow>
                <p className="mt-2 font-display text-xl font-extrabold text-ict-paper-50">Active</p>
                {access.enrollment ? (
                  <p className="mt-1 text-sm text-ict-ink-300">
                    Renews or expires {formatSessionTime(access.enrollment.currentPeriodEnd)}
                  </p>
                ) : null}
                <ButtonLink
                  href="/account"
                  variant="outline"
                  size="sm"
                  arrow="right"
                  className="mt-4"
                >
                  Billing & receipts
                </ButtonLink>
              </>
            ) : (
              <>
                <Eyebrow>{t("subject.monthly")}</Eyebrow>
                <p className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] text-ict-paper-50">
                  {formatLKR(subject.priceLKR)}
                </p>
                <p className="mt-1 text-sm text-ict-ink-300">{t("subject.cancelAnyTime")}</p>
                <div className="mt-4 space-y-2">
                  {cardPaymentsOn ? (
                    <SubscribeButton subjectId={subjectId} sandbox={payhere.mode === "sandbox"} />
                  ) : null}
                  <ButtonLink
                    href={`/pay/slip?subject=${subjectId}`}
                    variant="outline"
                    size="sm"
                    arrow="right"
                  >
                    {t("dash.payByBank")}
                  </ButtonLink>
                </div>
              </>
            )}
          </Card>

          <Card radius="card" className="p-5">
            <Eyebrow>{t("subject.whatsIncluded")}</Eyebrow>
            <ul className="mt-3 space-y-3">
              {INCLUDED.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <Icon
                    name={access.allowed ? f.icon : "lock"}
                    className={access.allowed ? "!text-base text-ict-orange-400" : "!text-base text-ict-ink-500"}
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-ict-paper-50">
                      {f.title}
                    </span>
                    <span className="block text-xs text-ict-ink-300">{f.subtitle}</span>
                  </span>
                </li>
              ))}
            </ul>
            {access.allowed ? null : (
              <Badge tone="brand" className="mt-4">
                Unlocks on subscribe
              </Badge>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}

const INCLUDED: Array<{ icon: IconName; title: string; subtitle: string }> = [
  { icon: "videocam", title: "Live classes", subtitle: "Join on any device, replays after" },
  { icon: "quiz", title: "Practice & revision", subtitle: "Questions that adapt to weak topics" },
  { icon: "schedule", title: "Mock exams", subtitle: "Timed papers, negative marking, ranked" },
  { icon: "code", title: "Code Lab", subtitle: "Pseudocode, spreadsheet formulas and SQL" },
  { icon: "description", title: "Notes & papers", subtitle: "Every file, free to download" },
  { icon: "military_tech", title: "Certificate", subtitle: "Unlocks at the mastery bar" },
];
