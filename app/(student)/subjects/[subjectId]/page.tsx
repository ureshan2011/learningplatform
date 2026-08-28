import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, listContent, listUnits } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { formatDate, formatLKR, formatSessionTime } from "@/lib/format";
import { DownloadButton } from "@/components/content/DownloadButton";
import { StartTrialButton } from "@/components/payments/StartTrialButton";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { payhereConfigured, r2Configured } from "@/lib/features";
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

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  const items = await listContent(subjectId);
  const units = await listUnits(subjectId);

  // Locked students still see the catalogue — knowing what they are missing is
  // the most effective renewal prompt there is.
  const visible = access.allowed ? items : items.filter((i) => i.isPublic);
  const cardPaymentsOn = payhereConfigured();

  const features: Array<{ icon: IconName; title: string; subtitle: string; href: string }> = [
    { icon: "quiz", title: "Practice & revision", subtitle: "Spaced-repetition questions that adapt to weak topics", href: `/subjects/${subjectId}/practice` },
    { icon: "schedule", title: "Mock exams", subtitle: "Timed papers, negative marking, ranked results", href: `/subjects/${subjectId}/mock-exams` },
    { icon: "code", title: "Code Lab", subtitle: "Run pseudocode, spreadsheet formulas and SQL", href: `/subjects/${subjectId}/lab` },
    { icon: "military_tech", title: "Certificate", subtitle: "Unlocks once you hit the mastery bar", href: `/subjects/${subjectId}/certificate` },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
        <Icon name="arrow_back" className="!text-base" />
        Dashboard
      </Link>

      <div className="mt-4 lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="accent">{subject.grade}</StatusPill>
              <StatusPill tone="neutral">
                {subject.medium[0].toUpperCase() + subject.medium.slice(1)} medium
              </StatusPill>
              {access.allowed ? <StatusPill tone="success">Enrolled</StatusPill> : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{subject.name}</h1>
            <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{subject.description}</p>
          </div>

          {!access.allowed ? (
            <div className="mt-5 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-4 text-sm">
              <p className="font-medium text-(--color-awaken-accent)">
                {access.reason === "expired"
                  ? "Your subscription has ended."
                  : !access.enrollment
                    ? "You are not enrolled in this subject yet."
                    : "You are not enrolled in this subject."}
              </p>
              <p className="mt-1 text-(--color-awaken-ink-soft)">
                {items.length - visible.length} more resources unlock when you subscribe.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {/*
                  A trial is only offered where `hasAccess` found no enrollment
                  document at all — see the reason comment on `startFreeTrial`.
                  A lapsed or cancelled subscriber always has one, so they only
                  ever see "Subscribe".
                */}
                {!access.enrollment ? <StartTrialButton subjectId={subjectId} /> : null}
              </div>
            </div>
          ) : null}

          {units.length > 0 ? (
            <section className="mt-8">
              <h2 className="flex items-center justify-between text-lg font-semibold">
                <span>Syllabus</span>
                <Link
                  href={`/syllabus/${subjectId}`}
                  className="flex items-center gap-1 text-sm font-normal text-(--color-awaken-accent) underline"
                >
                  Full breakdown by unit
                  <Icon name="chevron_right" className="!text-base" />
                </Link>
              </h2>
              <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                {units.length} units · {units.reduce((n, u) => n + u.lessons.length, 0)} lessons, each with exam
                objectives and exam-focus notes.
              </p>
            </section>
          ) : subject.syllabusTopics.length > 0 ? (
            <section className="mt-8">
              <h2 className="flex items-center justify-between text-lg font-semibold">
                <span>Syllabus</span>
                <span className="text-sm font-normal text-(--color-awaken-ink-soft)">
                  {subject.syllabusTopics.length} topics
                </span>
              </h2>
              <ol className="mt-3 space-y-2">
                {subject.syllabusTopics.map((topic, i) => (
                  <li
                    key={topic}
                    className="flex items-center gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-indigo-soft) text-xs font-bold text-(--color-awaken-indigo)">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{topic}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Notes &amp; past papers</h2>
            {!r2Configured() ? (
              <div className="mt-3">
                <NotConfigured feature="r2" />
              </div>
            ) : visible.length === 0 ? (
              <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">Nothing published yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {visible.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)">
                        <Icon name={KIND_ICON[item.kind]} className="!text-lg" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-(--color-awaken-ink-soft)">
                          {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                          {item.isPublic ? " · free" : ""}
                        </p>
                      </div>
                    </div>
                    <DownloadButton contentId={item.id} label="Download" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="mt-8 space-y-4 lg:mt-0 lg:w-80 lg:shrink-0">
          <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {access.allowed ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">Status</p>
                <p className="mt-1 text-lg font-bold text-(--color-awaken-success)">Active</p>
                {access.enrollment ? (
                  <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                    Renews / expires {formatSessionTime(access.enrollment.currentPeriodEnd)}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-3xl font-bold tracking-tight">{formatLKR(subject.priceLKR)}</p>
                <p className="text-sm text-(--color-awaken-ink-soft)">per month</p>
                <div className="mt-4 space-y-2">
                  {cardPaymentsOn ? (
                    <div className="[&>div]:text-left [&_button]:w-full [&_button]:justify-center [&_button]:py-2.5">
                      <SubscribeButton subjectId={subjectId} />
                    </div>
                  ) : null}
                  <Link
                    href="/pay/slip"
                    className="block w-full rounded-lg border border-(--color-awaken-line) px-4 py-2.5 text-center text-sm font-semibold hover:border-(--color-awaken-accent)/40"
                  >
                    Pay by bank slip
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">
              What&apos;s included
            </p>
            <ul className="mt-3 space-y-3.5">
              {features.map((f) => (
                <li key={f.href}>
                  {access.allowed ? (
                    <Link href={f.href} className="flex items-start gap-3 group">
                      <Icon name={f.icon} className="mt-0.5 shrink-0 text-(--color-awaken-accent)" />
                      <span>
                        <span className="block text-sm font-semibold group-hover:underline">{f.title}</span>
                        <span className="block text-xs text-(--color-awaken-ink-soft)">{f.subtitle}</span>
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 opacity-60">
                      <Icon name="lock" className="mt-0.5 shrink-0" />
                      <span>
                        <span className="block text-sm font-semibold">{f.title}</span>
                        <span className="block text-xs text-(--color-awaken-ink-soft)">{f.subtitle}</span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
