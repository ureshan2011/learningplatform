import Link from "next/link";
import { notFound } from "next/navigation";
import { isStaff, requirePageUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { getPayHereConfig } from "@/lib/payments/records";
import { listContent } from "@/lib/queries";
import { formatDate, formatLKR, formatSessionTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import {
  EXAM_PACK,
  EXAM_PACK_ID,
  EXAM_PACK_SLOTS,
  PAPER_IDS,
  PRINT_DOCS,
  accessMonths,
  pick,
} from "@/lib/exam-pack/config";
import { COPY, INSIDE, c, fill } from "@/lib/exam-pack/copy";
import { getExamPack } from "@/lib/exam-pack/ensure";
import { getExamPackSettings } from "@/lib/exam-pack/settings";
import { ensureUpcomingLives, upcomingLives, type LiveView } from "@/lib/exam-pack/lives";
import { attachBookingMeet, getBooking } from "@/lib/exam-pack/consultations";
import { getMySittings } from "@/lib/exam-pack/sittings";
import { getPaper, previewQuestions } from "@/lib/exam-pack/papers";
import { WEEKDAYS, WEEKDAYS_SI, formatWallTime } from "@/lib/exam-pack/time";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { DownloadButton } from "@/components/content/DownloadButton";
import { JoinMeetButton } from "@/components/exam-pack/JoinMeetButton";
import { SampleQuestions } from "@/components/exam-pack/SampleQuestions";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  Badge,
  ButtonLink,
  Card,
  CardLink,
  Eyebrow,
  IconBadge,
  Notice,
  PageHeader,
  SectionBar,
  StatusChip,
} from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import type { ConsultBooking, ExamPackSettings, PaperSitting } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The A/L ICT 2027 Exam Pack — the flagship product's home.
 *
 * One route, two faces. Before buying: the price, everything inside, and real
 * questions with their walkthroughs to try first. After: the next Saturday
 * live, the two ranked papers, the consultation, and the downloads.
 *
 * Hidden from students until the owner turns it on (`settings/examPack2027`).
 * A buyer keeps their pack even if it is later taken off sale — "off sale"
 * stops new purchases, it does not take back what was bought. Staff always
 * see it, and can add `?view=buyer` to see the page a student sees before
 * paying.
 */
export default async function ExamPackPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requirePageUser(EXAM_PACK.appPath);
  const { view } = await searchParams;
  const staff = isStaff(user.role);

  const [subject, settings, access, locale, payhere] = await Promise.all([
    getExamPack(),
    getExamPackSettings(),
    hasAccess(user.uid, EXAM_PACK_ID),
    getLocale(),
    getPayHereConfig(),
  ]);
  if (!subject?.product) notFound();
  if (!settings.enabled && !staff && !access.allowed) notFound();

  const buyerView = staff && view === "buyer";
  const owned = access.allowed && !buyerView;

  return (
    <PageShell width="reading">
      <PageHeader
        eyebrow={pick(COPY.eyebrow, locale)}
        title={pick(COPY.title, locale)}
        subtitle={pick(EXAM_PACK.tagline, locale)}
        actions={
          owned && access.enrollment ? (
            <StatusChip tone="success">
              {c("yoursUntil", locale, { date: formatDate(access.enrollment.currentPeriodEnd) })}
            </StatusChip>
          ) : undefined
        }
      />

      {staff ? (
        <div className="mt-4 space-y-2">
          {!settings.enabled ? <Notice tone="warning">{pick(COPY.notOnSaleStaff, locale)}</Notice> : null}
          {buyerView ? <Notice tone="info">{pick(COPY.buyerPreviewStaff, locale)}</Notice> : null}
          <p className="text-sm text-ict-fg-soft">
            <Link href={buyerView ? EXAM_PACK.appPath : `${EXAM_PACK.appPath}?view=buyer`} className="underline">
              {buyerView ? "See it as a buyer" : "See it before purchase"}
            </Link>{" "}
            ·{" "}
            <Link href="/teacher/exam-pack" className="underline">
              Exam Pack console
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        {owned ? (
          <OwnedPack uid={user.uid} settings={settings} locale={locale} staff={staff} />
        ) : (
          <SellPack
            feeLKR={subject.product.feeLKR}
            accessDays={subject.product.accessDays}
            settings={settings}
            locale={locale}
            sandbox={payhere.mode === "sandbox"}
            cardReady={payhere.configured}
            rehearsal={staff && payhere.mode === "sandbox"}
          />
        )}
      </div>

      <p className="mt-8 text-xs text-ict-fg-soft">{pick(COPY.aiNote, locale)}</p>
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Before buying                                                               */
/* -------------------------------------------------------------------------- */

function liveVars(settings: ExamPackSettings, locale: "en" | "si") {
  return {
    title: settings.live.title,
    weekday: (locale === "si" ? WEEKDAYS_SI : WEEKDAYS)[settings.live.weekday],
    time: formatWallTime(settings.live.time),
  };
}

function SellPack({
  feeLKR,
  accessDays,
  settings,
  locale,
  sandbox,
  cardReady,
  rehearsal,
}: {
  feeLKR: number;
  accessDays: number;
  settings: ExamPackSettings;
  locale: "en" | "si";
  sandbox: boolean;
  cardReady: boolean;
  /** The owner, with PayHere in sandbox: may rehearse the real checkout while the pack is off sale. */
  rehearsal: boolean;
}) {
  const price = formatLKR(feeLKR);
  const samples = previewQuestions();
  const vars = liveVars(settings, locale);

  return (
    <div className="space-y-6">
      <Card variant="feature" radius="panel" className="p-6 sm:p-8">
        <Eyebrow>{EXAM_PACK.name}</Eyebrow>
        <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.03em]">{price}</p>
        <p className="mt-1 text-sm opacity-80">{c("onePayment", locale, { months: accessMonths(accessDays) })}</p>
        <div className="mt-5">
          {!settings.enabled && !rehearsal ? (
            <StatusChip tone="neutral">{pick(COPY.openingSoon, locale)}</StatusChip>
          ) : cardReady ? (
            <SubscribeButton
              subjectId={EXAM_PACK_ID}
              sandbox={sandbox}
              label={c("buy", locale, { price })}
              kind="exam_pack"
            />
          ) : (
            <p className="text-sm">{pick(COPY.cardNotReady, locale)}</p>
          )}
        </div>
      </Card>

      <section>
        <SectionBar title={pick(COPY.insideTitle, locale)} />
        <div className="grid gap-3 sm:grid-cols-2">
          {INSIDE.map((item) => (
            <Card key={item.icon} radius="card" className="flex gap-3.5 p-4">
              <IconBadge icon={item.icon as IconName} tone="soft" size={40} />
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-ict-fg">{fill(item.title, locale, vars)}</p>
                <p className="mt-1 text-sm text-ict-fg-soft">{fill(item.body, locale, vars)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionBar title={pick(COPY.tryTitle, locale)} hint={pick(COPY.tryHint, locale)} />
        <SampleQuestions
          items={samples}
          defaultLang={locale}
          labels={{ show: COPY.showAnswer, hide: COPY.hideAnswer, walkthrough: { en: "Walkthrough", si: "Walkthrough" } }}
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* After buying                                                                */
/* -------------------------------------------------------------------------- */

async function OwnedPack({
  uid,
  settings,
  locale,
  staff,
}: {
  uid: string;
  settings: ExamPackSettings;
  locale: "en" | "si";
  staff: boolean;
}) {
  // A buyer's view prepares the coming weeks (and their Meet links); the owner
  // looking at an unlaunched pack does not, so browsing the console never puts
  // a class in the owner's calendar that no student can join.
  const lives = settings.enabled || !staff ? await ensureUpcomingLives(settings) : await upcomingLives(settings);

  let booking = await getBooking(uid);
  if (booking?.status === "booked" && !booking.meetUrl && !booking.manualUrl) {
    await attachBookingMeet(booking.id);
    booking = await getBooking(uid);
  }

  const [sittings, files] = await Promise.all([
    getMySittings(uid),
    listContent(EXAM_PACK_ID).then((items) => items.filter((i) => i.kind === "pack")),
  ]);
  const bySlot = new Map<string, (typeof files)[number]>();
  for (const file of files) if (file.slug && !bySlot.has(file.slug)) bySlot.set(file.slug, file);

  return (
    <div className="space-y-6">
      <LiveFeature lives={lives} settings={settings} locale={locale} booking={booking} />

      <section>
        <SectionBar title={pick(COPY.papersTitle, locale)} hint={pick(COPY.papersHint, locale)} />
        <div className="grid gap-3 sm:grid-cols-2">
          {PAPER_IDS.map((id) => (
            <PaperCard key={id} paperId={id} sitting={sittings[id]} locale={locale} />
          ))}
          <CardLink href="/exam-pack/paper-2" radius="card" className="flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <IconBadge icon="edit_note" tone="soft" size={40} />
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-ict-fg">{pick(COPY.paperTwoTitle, locale)}</p>
                <p className="mt-1 text-sm text-ict-fg-soft">{pick(COPY.paperTwoBlurb, locale)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-ict-accent-fg">{pick(COPY.open, locale)}</span>
          </CardLink>
        </div>
      </section>

      <section>
        <SectionBar title={pick(COPY.consultTitle, locale)} hint={pick(COPY.consultBlurb, locale)} />
        <Card radius="card" className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <IconBadge icon="co_present" tone="soft" size={40} />
            <p className="text-sm text-ict-fg">{consultLine(booking, locale)}</p>
          </div>
          <ButtonLink
            href="/exam-pack/consultation"
            variant={booking && booking.status !== "cancelled" ? "outline" : "primary"}
            size="sm"
          >
            {booking && booking.status !== "cancelled" ? pick(COPY.consultManage, locale) : pick(COPY.consultBook, locale)}
          </ButtonLink>
        </Card>
      </section>

      <section>
        <SectionBar title={pick(COPY.downloadsTitle, locale)} hint={pick(COPY.downloadsHint, locale)} />
        <Card radius="card" className="divide-y divide-ict-line p-1">
          {PRINT_DOCS.map((doc) => {
            // An answer copy opens once that paper has been submitted, so the
            // key cannot be printed first and the ranked sitting taken with it.
            const paperId = doc.key.endsWith("-answers") ? doc.key.slice(0, -"-answers".length) : null;
            const locked =
              !staff && paperId !== null && !sittings[paperId as (typeof PAPER_IDS)[number]]?.submittedAt;
            const label = (
              <span className="flex min-w-0 items-center gap-2.5">
                <Icon name={locked ? "lock" : "print"} className="!text-base shrink-0 text-ict-fg-soft" />
                <span className="min-w-0">{pick(doc.title, locale)}</span>
              </span>
            );
            return locked ? (
              <div key={doc.key} className="flex items-center justify-between gap-3 p-3.5 text-sm text-ict-fg-soft">
                {label}
                <StatusChip tone="neutral">{pick(COPY.afterYouSit, locale)}</StatusChip>
              </div>
            ) : (
              <Link
                key={doc.key}
                href={`/exam-pack/print/${doc.key}${locale === "si" ? "?lang=si" : ""}`}
                className="flex items-center justify-between gap-3 p-3.5 text-sm text-ict-fg hover:text-ict-accent-fg"
              >
                {label}
                <Badge tone="neutral">PDF</Badge>
              </Link>
            );
          })}
        </Card>
      </section>

      <section>
        <SectionBar title={pick(COPY.filesTitle, locale)} />
        <div className="grid gap-3 sm:grid-cols-2">
          {EXAM_PACK_SLOTS.map((slot) => {
            const file = bySlot.get(slot.key);
            return (
              <Card key={slot.key} radius="card" className="p-4">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-ict-fg">{pick(slot.title, locale)}</span>
                  <Badge tone="neutral">{slot.fileLabel}</Badge>
                </p>
                <p className="mt-1 text-sm text-ict-fg-soft">{pick(slot.blurb, locale)}</p>
                <div className="mt-3">
                  {file ? (
                    <DownloadButton
                      contentId={file.id}
                      label={pick(COPY.download, locale)}
                      expiredMessage={pick(COPY.expired, locale)}
                    />
                  ) : (
                    <StatusChip tone="neutral">{pick(COPY.comingSoon, locale)}</StatusChip>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function consultLine(booking: ConsultBooking | null, locale: "en" | "si"): string {
  if (!booking || booking.status === "cancelled") return pick(COPY.consultBlurb, locale);
  if (booking.status === "completed") return pick(COPY.consultDone, locale);
  if (booking.status === "no_show") return pick(COPY.consultMissed, locale);
  return c("consultBooked", locale, { when: formatSessionTime(booking.startsAt) });
}

function LiveFeature({
  lives,
  settings,
  locale,
  booking,
}: {
  lives: LiveView[];
  settings: ExamPackSettings;
  locale: "en" | "si";
  booking: ConsultBooking | null;
}) {
  const vars = liveVars(settings, locale);
  const next = lives[0];
  const unbooked = !booking || booking.status === "cancelled";

  return (
    <Card variant="feature" radius="panel" className="p-6 sm:p-8">
      <Eyebrow>{pick(COPY.nextStep, locale)}</Eyebrow>
      {!settings.live.enabled || !next ? (
        <p className="mt-3 text-base">{pick(COPY.liveOff, locale)}</p>
      ) : (
        <>
          <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">
            {next.status === "cancelled"
              ? c("liveCancelled", locale, { when: formatSessionTime(next.startsAt) })
              : c("liveNext", locale, { when: formatSessionTime(next.startsAt) })}
          </p>
          <p className="mt-1 text-sm opacity-80">{c("liveWhen", locale, vars)}</p>
          {next.status !== "cancelled" ? (
            <div className="mt-5">
              <JoinMeetButton
                endpoint="/api/exam-pack/live/join"
                labels={{
                  join: pick(COPY.join, locale),
                  joining: pick(COPY.joining, locale),
                  notOpen: pick(COPY.joinNotOpen, locale),
                  noLink: pick(COPY.joinNoLink, locale),
                  cancelled: pick(COPY.joinCancelled, locale),
                  failed: pick(COPY.joinFailed, locale),
                }}
              />
            </div>
          ) : null}
          <p className="mt-4 text-xs opacity-80">{pick(COPY.liveHowTo, locale)}</p>
        </>
      )}
      {unbooked ? (
        <Link href="/exam-pack/consultation" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
          <Icon name="co_present" className="!text-base" />
          {pick(COPY.consultBook, locale)}
        </Link>
      ) : null}
    </Card>
  );
}

function PaperCard({
  paperId,
  sitting,
  locale,
}: {
  paperId: (typeof PAPER_IDS)[number];
  sitting: PaperSitting | undefined;
  locale: "en" | "si";
}) {
  const paper = getPaper(paperId);
  const done = Boolean(sitting?.submittedAt);
  const status = done
    ? c("scored", locale, {
        score: sitting?.correctCount ?? 0,
        total: sitting?.totalQuestions ?? paper.questions.length,
        rank: sitting?.rank ?? 1,
        of: sitting?.totalSittings ?? 1,
      })
    : sitting
      ? pick(COPY.inProgress, locale)
      : pick(COPY.notStarted, locale);

  return (
    <CardLink href={`/exam-pack/papers/${paperId}`} radius="card" className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <IconBadge icon={paper.kind === "predicted" ? "auto_awesome" : "description"} tone="soft" size={40} done={done} />
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-ict-fg">{pick(paper.title, locale)}</p>
          <p className="mt-1 text-sm text-ict-fg-soft">{pick(paper.blurb, locale)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusChip tone={done ? "success" : sitting ? "warning" : "neutral"}>{status}</StatusChip>
        <span className="text-sm font-semibold text-ict-accent-fg">
          {done ? pick(COPY.review, locale) : sitting ? pick(COPY.continue, locale) : pick(COPY.start, locale)}
        </span>
      </div>
    </CardLink>
  );
}
