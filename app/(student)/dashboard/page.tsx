import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import {
  listEnrollments,
  listSubjects,
  listCohorts,
  listProducts,
  isEnrolmentOpen,
  listUpcomingSessions,
  getProgress,
} from "@/lib/queries";
import { formatDate, formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { getPayHereConfig, getPaymentSettings, isBankSlipEnabled } from "@/lib/payments/records";
import { paymentsPaused } from "@/lib/payments/launch";
import { getT, localeAttrs, type Translator } from "@/lib/i18n/server";
import { LaunchNotice } from "@/components/payments/LaunchNotice";
import { StartTrialButton } from "@/components/payments/StartTrialButton";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  Badge,
  ButtonLink,
  Card,
  CardLink,
  Chip,
  Eyebrow,
  IconBadge,
  ProgressBar,
  SectionBar,
  StatusChip,
  StatusDot,
} from "@/components/ds";
import type { MessageKey } from "@/lib/i18n/dictionary";
import type { ClassSession, Subject } from "@/lib/types";
import { CAMPUS_READY } from "@/lib/content/campus-ready";

export const dynamic = "force-dynamic";

/**
 * The student's home.
 *
 * Built to the design system's product archetype: one cocoa feature banner
 * carrying the single most important thing on the screen, a main column of
 * work, and a narrower schedule column beside it. The old version opened with
 * four decorative stat tiles and buried "what do I do next" below the fold —
 * this one answers that in the first 200 pixels and lets the numbers support it
 * rather than lead.
 *
 * Everything here is one tap from a destination. A card that only reports a
 * number is a card that made the student go and find the thing themselves.
 */
export default async function DashboardPage() {
  const user = await requirePageUser("/dashboard");

  const [enrollments, subjects, cohorts, products, t, loc] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
    listCohorts(),
    listProducts(),
    getT(),
    localeAttrs(),
  ]);

  // Server Component: this renders once per request, so reading the clock here
  // is deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const activeSubjectIds = enrollments
    .filter((e) => e.status === "active" && e.currentPeriodEnd > now)
    .map((e) => e.subjectId);

  const [sessions, progressList] = await Promise.all([
    listUpcomingSessions(activeSubjectIds),
    Promise.all(activeSubjectIds.map((id) => getProgress(user.uid, id))),
  ]);

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const [payhere, paymentSettings] = await Promise.all([getPayHereConfig(), getPaymentSettings()]);
  // Trial-only launch — see `lib/payments/launch.ts`. Both flags go false
  // together, so every "Pay" control on this screen disappears at once.
  const paused = paymentsPaused();
  const cardPaymentsOn = !paused && payhere.configured;
  const bankSlipOn = !paused && isBankSlipEnabled(paymentSettings);
  // Which subjects this student could still start a trial on. Any enrollment
  // document at all disqualifies one — active, lapsed or cancelled — which is
  // exactly the rule `startFreeTrial` enforces server-side, so the button is
  // only offered where it will actually work.
  const enrolledSubjectIds = new Set(enrollments.map((e) => e.subjectId));
  // Whether *any* class still has a trial going spare, for the lines that talk
  // about the student rather than about one card.
  const anyTrialAvailable = subjects.some((s) => !enrolledSubjectIds.has(s.id));

  const streakDays = progressList.reduce((max, p) => Math.max(max, p?.streakDays ?? 0), 0);
  const totalXp = progressList.reduce((sum, p) => sum + (p?.xp ?? 0), 0);
  const primary = subjects.find((s) => activeSubjectIds.includes(s.id));

  const [nextSession, ...laterSessions] = sessions;
  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <main lang={loc.lang} className={`mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6 ${loc.className}`}>
      {/* ------------------------------------------------------------------ */}
      {/* Feature banner — the system permits exactly one cocoa surface per    */}
      {/* screen, so it carries the single thing that matters most right now.  */}
      {/* ------------------------------------------------------------------ */}
      <Card variant="feature" radius="panel" className="ict-enter overflow-hidden p-6 sm:p-8">
        <div className="lg:flex lg:items-center lg:gap-10">
          <div className="min-w-0 lg:flex-1">
            <p className="text-sm text-ict-orange-200">{t("dash.greeting", { name: firstName })}</p>
            <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ict-paper-50 sm:text-[34px]">
              {nextSession ? (
                nextSession.state === "live" ? (
<Lines text={t("dash.liveNow")} />
                ) : (
                  <>
                    {nextSession.title}
                    <br />
                    <span className="text-ict-orange-200">{relativeToNow(nextSession.startsAt)}</span>
                  </>
                )
              ) : activeSubjectIds.length === 0 ? (
                <Lines text={t("dash.startClass")} />
              ) : streakDays > 0 ? (
                <Lines text={t("dash.streakHead", { days: streakDays })} />
              ) : (
                <Lines text={t("dash.ready")} />
              )}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {nextSession ? (
                <ButtonLink href={`/live/${nextSession.id}`} arrow="right">
                  {nextSession.state === "live" ? t("dash.joinNow") : t("dash.openClass")}
                </ButtonLink>
              ) : primary ? (
                <ButtonLink href={`/subjects/${primary.id}/practice`} arrow="right">
                  {t("dash.practiseNow")}
                </ButtonLink>
              ) : subjects[0] ? (
                <ButtonLink href={`/subjects/${subjects[0].id}`} arrow="right">
                  {t("dash.seeIncluded")}
                </ButtonLink>
              ) : null}

              {nextSession ? (
                <span className="text-sm text-ict-orange-200">
                  {formatSessionTime(nextSession.startsAt)}
                </span>
              ) : null}
            </div>
          </div>

          {/* The counters. Dark pill chips with a small orange glyph, per the
              system — not four boxes competing with the headline. */}
          <div className="mt-6 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0 lg:flex-col lg:items-end">
            <Chip icon="local_fire_department">{t("dash.streakChip", { days: streakDays })}</Chip>
            <Chip icon="bolt">{t("dash.xpChip", { xp: totalXp.toLocaleString("en-LK") })}</Chip>
            <Chip icon="event">{t("dash.classesAhead", { count: sessions.length })}</Chip>
          </div>
        </div>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* ---------------------------------------------------------------- */}
        {/* Main column                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="min-w-0 space-y-3">
          {primary ? (
            <Card radius="card" className="p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>{t("dash.continueStudying")}</Eyebrow>
                  <p className="mt-1.5 font-display text-lg font-extrabold text-ict-paper-50">
                    {primary.name}
                  </p>
                </div>
                <ProgressBar
                  value={levelProgress(progressList[0]?.xp ?? 0)}
                  className="w-full max-w-[220px]"
                />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {STUDY_TOOLS.map((tool) => (
                  <CardLink
                    key={tool.href}
                    href={`/subjects/${primary.id}${tool.href}`}
                    variant="raised"
                    radius="md"
                    className="flex items-center gap-3 p-3.5"
                  >
                    <IconBadge icon={tool.icon} tone="soft" size={40} round />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ict-paper-50">
                        {t(tool.title)}
                      </span>
                      <span className="block truncate text-xs text-ict-ink-300">{t(tool.blurb)}</span>
                    </span>
                    <Icon name="chevron_right" className="ml-auto !text-base text-ict-ink-400" />
                  </CardLink>
                ))}
              </div>
            </Card>
          ) : null}

          <section>
            <SectionBar
              title={t("dash.yourClasses")}
              hint={
                activeSubjectIds.length > 0
                  ? t("dash.yourClassesHint")
                  : paused
                    ? t("launch.short")
                    : t("dash.subscribeHint")
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  active={activeSubjectIds.includes(subject.id)}
                  periodEnd={
                    enrollments.find((e) => e.subjectId === subject.id)?.currentPeriodEnd
                  }
                  cardPaymentsOn={cardPaymentsOn}
                  bankSlipOn={bankSlipOn}
                  paused={paused}
                  trialAvailable={!enrolledSubjectIds.has(subject.id)}
                  sandbox={payhere.mode === "sandbox"}
                  t={t}
                />
              ))}
            </div>
          </section>

          {/* Only shown once an intake exists, so the dashboard does not carry a
              dead section for the months between cohorts. A closed intake still
              appears while a student is enrolled in it — that is their class. */}
          {(() => {
            const openCohorts = cohorts.filter(
              (c) => isEnrolmentOpen(c, now) || activeSubjectIds.includes(c.id),
            );
            // The pack is on sale every day, so unlike an intake it never leaves
            // this section — which is also why the section now survives the
            // months between cohorts.
            if (openCohorts.length === 0 && products.length === 0) return null;
            return (
              <section>
                <SectionBar title={t("campus.title")} hint={t("campus.sectionHint")} />
                {/* Neither a cohort seat nor the pack can be bought while
                    payments are off, and both cards below lead to a page with
                    no button on it — so say why here rather than there. */}
                {paused ? <LaunchNotice message={t("launch.short")} className="mb-3" /> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {openCohorts.map((cohort) => (
                    <CohortCard
                      key={cohort.id}
                      subject={cohort}
                      enrolled={activeSubjectIds.includes(cohort.id)}
                      now={now}
                      cardPaymentsOn={cardPaymentsOn}
                      paused={paused}
                      sandbox={payhere.mode === "sandbox"}
                      t={t}
                    />
                  ))}
                  {products.map((product) => (
                    <PackCard
                      key={product.id}
                      subject={product}
                      owned={activeSubjectIds.includes(product.id)}
                      paused={paused}
                      t={t}
                    />
                  ))}
                </div>
              </section>
            );
          })()}

        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Schedule column                                                   */}
        {/* ---------------------------------------------------------------- */}
        <aside className="lg:sticky lg:top-[76px]">
          <Card radius="card" className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-extrabold text-ict-paper-50">{t("dash.timetable")}</p>
              {sessions.length > 0 ? (
                <span className="text-xs text-ict-ink-300">{t("dash.timetableNext", { count: sessions.length })}</span>
              ) : null}
            </div>

            {sessions.length === 0 ? (
              <p className="mt-4 text-sm text-ict-ink-300">
                {activeSubjectIds.length > 0
                  ? t("dash.noTimetable")
                  : paused
                    ? anyTrialAvailable
                      ? t("launch.noTimetable")
                      : t("launch.short")
                    : t("dash.noTimetableLocked")}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {[nextSession, ...laterSessions].map((session) => (
                  <li key={session.id}>
                    <ScheduleRow session={session} subject={subjectById.get(session.subjectId)} t={t} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {activeSubjectIds.length > 0 ? (
            <Card radius="card" className="mt-3 p-5">
              <p className="font-display text-base font-extrabold text-ict-paper-50">
                {t("dash.inviteTitle")}
              </p>
              <p className="mt-1 text-sm text-ict-ink-300">{t("dash.inviteBody")}</p>
              <ButtonLink href="/account" variant="outline" size="sm" arrow="right" className="mt-4">
                {t("dash.inviteCta")}
              </ButtonLink>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

/** Renders a headline whose line breaks are authored in the dictionary, not wrapped. */
function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((line, i) => (
        <span key={line + i}>
          {line}
          {i < parts.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}

const STUDY_TOOLS: Array<{ href: string; title: MessageKey; blurb: MessageKey; icon: IconName }> = [
  { href: "/practice", title: "tool.practice", blurb: "tool.practiceBlurb", icon: "quiz" },
  { href: "/mock-exams", title: "tool.mockExams", blurb: "tool.mockExamsBlurb", icon: "schedule" },
  { href: "/lab", title: "tool.codeLab", blurb: "tool.codeLabBlurb", icon: "code" },
  { href: "", title: "tool.notes", blurb: "tool.notesBlurb", icon: "description" },
];

/**
 * XP to a 0-100 bar.
 *
 * 1,000 XP per level is the same arithmetic the progress engine uses; this is
 * the position *within* the current level, which is the number a student
 * recognises as "how close am I".
 */
function levelProgress(xp: number): number {
  return Math.round(((xp % 1000) / 1000) * 100);
}

/**
 * The Survival Pack on the dashboard.
 *
 * Outline button in both states, never a second orange one: the banner above
 * already carries this screen's single orange call to action, and the pack is
 * not what a student came to the dashboard to do.
 */
function PackCard({
  subject,
  owned,
  paused,
  t,
}: {
  subject: Subject;
  owned: boolean;
  /** Trial-only launch: the pack is not on sale, so its fee is not quoted. */
  paused: boolean;
  t: Translator;
}) {
  const product = subject.product;
  if (!product) return null;

  return (
    <Card radius="card" className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-ict-paper-50">{subject.name}</p>
          <p className="mt-1 text-sm text-ict-ink-300">
            {owned || !paused
              ? t("pack.onePayment", { price: formatLKR(product.feeLKR) })
              : t("launch.waitlist")}
          </p>
        </div>
        {owned ? <Badge tone="success">{t("campus.enrolled")}</Badge> : null}
      </div>

      <div className="mt-4">
        <ButtonLink href={`/packs/${subject.id}`} variant="outline" size="sm" arrow="right">
          {owned ? t("pack.open") : t("pack.seeInside")}
        </ButtonLink>
      </div>
    </Card>
  );
}

/**
 * A Campus Ready intake on the dashboard.
 *
 * Deliberately not `SubjectCard` with a flag. A cohort answers different
 * questions — when does it start, when does enrolment shut, what does the whole
 * thing cost — and bending the monthly card to cover both would leave a student
 * reading "per month" beside a Rs 30,000 fee.
 */
function CohortCard({
  subject,
  enrolled,
  now,
  cardPaymentsOn,
  paused,
  sandbox,
  t,
}: {
  subject: Subject;
  enrolled: boolean;
  now: number;
  cardPaymentsOn: boolean;
  /** Trial-only launch: enrolment is not open, so the fee is not quoted. */
  paused: boolean;
  sandbox: boolean;
  t: Translator;
}) {
  const term = subject.cohort;
  if (!term) return null;
  const open = isEnrolmentOpen(subject, now);

  return (
    <Card radius="card" className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-ict-paper-50">{subject.name}</p>
          <p className="mt-1 text-sm text-ict-ink-300">
            {enrolled
              ? t("campus.runsUntil", { date: formatDate(term.endsAt) })
              : paused
                ? t("launch.waitlist")
                : t("campus.onePayment", { price: formatLKR(term.feeLKR) })}
          </p>
        </div>
        <Badge tone={enrolled ? "success" : "neutral"}>
          {enrolled ? t("campus.enrolled") : t("campus.weeks", { count: CAMPUS_READY.weeks })}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-ict-ink-400">
        {enrolled
          ? t("campus.starts", { date: formatDate(term.startsAt) })
          : open
            ? t("campus.enrolBy", { date: formatDate(term.enrolmentClosesAt) })
            : t("campus.closed")}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ButtonLink href={`/campus/${subject.id}`} variant="outline" size="sm" arrow="right">
          {enrolled ? t("campus.open") : paused ? t("launch.seeDetails") : t("campus.enrol")}
        </ButtonLink>
        {!enrolled && open && cardPaymentsOn ? (
          <SubscribeButton subjectId={subject.id} sandbox={sandbox} />
        ) : null}
      </div>
    </Card>
  );
}

function SubjectCard({
  subject,
  active,
  periodEnd,
  cardPaymentsOn,
  bankSlipOn,
  paused,
  trialAvailable,
  sandbox,
  t,
}: {
  subject: Subject;
  active: boolean;
  periodEnd?: number;
  cardPaymentsOn: boolean;
  bankSlipOn: boolean;
  /** Trial-only launch: no fee is quoted and the trial is the only way in. */
  paused: boolean;
  /** This student has never had an enrollment on this subject, so a trial is still theirs to take. */
  trialAvailable: boolean;
  sandbox: boolean;
  t: Translator;
}) {
  return (
    <Card radius="card" className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-ict-paper-50">{subject.name}</p>
          <p className="mt-1 text-sm text-ict-ink-300">
            {active && periodEnd
              ? t("dash.paidUntil", { date: formatDate(periodEnd) })
              : paused
                ? // Trial still theirs to take, or already spent — the second
                  // is the student who has nothing to buy and nothing to start.
                  trialAvailable
                  ? t("launch.freeNow")
                  : t("launch.openingSoon")
                : t("dash.perMonth", { price: formatLKR(subject.priceLKR) })}
          </p>
        </div>
        <Badge tone={active ? "success" : "neutral"}>{active ? t("dash.active") : subject.grade}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {active ? (
          <ButtonLink href={`/subjects/${subject.id}`} variant="outline" size="sm" arrow="right">
            {t("dash.open")}
          </ButtonLink>
        ) : (
          // Card first — it unlocks the class in seconds. Bank deposit only
          // shows up if the teacher has switched it back on. During the
          // trial-only launch neither appears and the trial takes their place.
          <>
            {paused && trialAvailable ? <StartTrialButton subjectId={subject.id} /> : null}
            {cardPaymentsOn ? <SubscribeButton subjectId={subject.id} sandbox={sandbox} /> : null}
            {bankSlipOn ? (
              <Link
                href={`/pay/slip?subject=${subject.id}`}
                className="text-sm font-semibold text-ict-orange-400 underline-offset-4 hover:underline"
              >
                {t("dash.payByBank")}
              </Link>
            ) : null}
            {paused && !trialAvailable ? (
              <ButtonLink href={`/subjects/${subject.id}`} variant="outline" size="sm" arrow="right">
                {t("dash.open")}
              </ButtonLink>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}

function ScheduleRow({
  session,
  subject,
  t,
}: {
  session: ClassSession;
  subject?: Subject;
  t: Translator;
}) {
  const live = session.state === "live";
  return (
    <Link
      href={`/live/${session.id}`}
      className="ict-lift block rounded-ict-md border border-ict-border-dark bg-ict-ink-800 p-3.5 hover:border-ict-ink-500"
    >
      <p className="truncate text-[13px] font-semibold text-ict-paper-50">{session.title}</p>
      <p className="mt-1 truncate text-xs text-ict-ink-300">
        {subject?.name ?? session.subjectId}
        {session.topic ? ` · ${session.topic}` : ""}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ict-ink-300">{formatSessionTime(session.startsAt)}</span>
        {live ? (
          <StatusChip tone="success">{t("dash.liveBadge")}</StatusChip>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ict-ink-300">
            <StatusDot tone="info" />
            {relativeToNow(session.startsAt)}
          </span>
        )}
      </div>
    </Link>
  );
}
