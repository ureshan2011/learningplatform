import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { formatSessionTime } from "@/lib/format";
import { CONSULT_CANCEL_CUTOFF_MS, CONSULT_NOTE_MAX, EXAM_PACK } from "@/lib/exam-pack/config";
import { requireExamPackPage } from "@/lib/exam-pack/page-gate";
import { attachBookingMeet, getBooking, listOpenSlots } from "@/lib/exam-pack/consultations";
import { colomboParts, formatWallTime } from "@/lib/exam-pack/time";
import { ConsultationBooker, CancelBookingButton, type SlotOption } from "@/components/exam-pack/ConsultationBooker";
import { JoinMeetButton } from "@/components/exam-pack/JoinMeetButton";
import { COPY } from "@/lib/exam-pack/copy";
import { Icon } from "@/components/ui/Icon";
import { Card, Eyebrow, Notice, PageHeader, StatusChip } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";

export const dynamic = "force-dynamic";

type Locale = "en" | "si";

const T = {
  title: { en: "Your 30 minutes with Dr. Yasas", si: "Dr. Yasas එක්ක ඔයාගේ විනාඩි 30" },
  subtitle: {
    en: "One-to-one on Google Meet, once per Exam Pack. Pick a time that suits you — all times are Sri Lanka time.",
    si: "Google Meet එකේ one-to-one, Exam Pack එකකට එක පාරයි. ඔයාට ගැළපෙන වෙලාවක් තෝරන්න — හැම වෙලාවක්ම ලංකාවේ වෙලාව.",
  },
  booked: { en: "Booked", si: "Book කරලා" },
  bookedFor: { en: "{when}, {minutes} minutes", si: "{when}, විනාඩි {minutes}" },
  yourNote: { en: "What you said you want to talk about", si: "ඔයා කතා කරන්න ඕන කියපු දේ" },
  howToJoin: {
    en: "The Join button works from 15 minutes before. You will wait in Meet's waiting room until Dr. Yasas lets you in. Have your question paper or notes ready.",
    si: "Join button එක විනාඩි 15කට කලින් ඉඳන් වැඩ. Dr. Yasas ඇතුළට ගන්නකම් Meet waiting room එකේ ඉන්න. ප්‍රශ්න පත්‍රය හරි notes හරි ළඟ තියාගන්න.",
  },
  moveRule: {
    en: "Need another time? You can move it yourself until 12 hours before.",
    si: "වෙන වෙලාවක් ඕනද? පැය 12කට කලින් වෙනකන් ඔයාටම වෙනස් කරන්න පුළුවන්.",
  },
  tooLateToMove: {
    en: "It is less than 12 hours away, so it can no longer be moved here. If you cannot make it, message Dr. Yasas.",
    si: "තව පැය 12ක් වත් නෑ, ඒ නිසා මෙතනින් වෙනස් කරන්න බෑ. එන්න බැරි නම් Dr. Yasas ට message කරන්න.",
  },
  done: { en: "Your consultation is done. Thank you for coming.", si: "ඔයාගේ consultation එක ඉවරයි. ආවට ස්තූතියි." },
  missed: {
    en: "This was marked as missed. If something went wrong, message Dr. Yasas — a missed consultation can be given back.",
    si: "මේක miss වුණා කියලා mark කරලා. මොකක් හරි වැරදුණා නම් Dr. Yasas ට message කරන්න — ආපහු දෙන්න පුළුවන්.",
  },
  pick: { en: "Pick a time", si: "වෙලාවක් තෝරන්න" },
  note: { en: "What do you want to talk about? (optional)", si: "මොනවද කතා කරන්න ඕන? (ඕන නම්)" },
  notePlaceholder: {
    en: "For example: I keep losing marks on SQL questions in Paper II.",
    si: "උදාහරණයක්: Paper II එකේ SQL ප්‍රශ්න වලින් marks නැති වෙනවා.",
  },
  book: { en: "Book this time", si: "මේ වෙලාව book කරන්න" },
  booking: { en: "Booking…", si: "Book කරනවා…" },
  none: {
    en: "No times are open right now. Dr. Yasas adds new times every week — check back in a day or two.",
    si: "දැනට open වෙලාවල් නෑ. Dr. Yasas හැම සතියෙම අලුත් වෙලාවල් දානවා — දවසක් දෙකකින් ආපහු බලන්න.",
  },
  taken: { en: "Someone has just booked that time. Pick another.", si: "කවුරුහරි දැන් ඒ වෙලාව book කළා. වෙන එකක් තෝරන්න." },
  tooSoon: { en: "That time is too close now. Pick a later one.", si: "ඒ වෙලාව දැන් ගොඩක් ළඟයි. ඊට පස්සේ එකක් තෝරන්න." },
  already: { en: "You already have a consultation booked.", si: "ඔයාට දැනටමත් consultation එකක් book කරලා තියෙනවා." },
  failed: { en: "Could not book it. Try again.", si: "Book කරන්න බැරි වුණා. ආපහු try කරන්න." },
  cancel: { en: "Move it to another time", si: "වෙන වෙලාවකට මාරු කරන්න" },
  confirmCancel: { en: "Tap again to release this time", si: "මේ වෙලාව අත්හරින්න ආපහු tap කරන්න" },
  cancelTooLate: { en: "It is too close to move now.", si: "දැන් මාරු කරන්න ගොඩක් ළඟයි." },
} as const;

function t(key: keyof typeof T, locale: Locale, vars: Record<string, string | number> = {}): string {
  return T[key][locale].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

function slotOption(id: string, startsAt: number, locale: Locale): SlotOption {
  const parts = colomboParts(startsAt);
  const day = new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", {
    timeZone: "Asia/Colombo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(startsAt));
  return { id, day, time: formatWallTime(parts.time) };
}

/**
 * Booking the one-to-one that comes with every Exam Pack.
 *
 * Slots are listed only to buyers, and a booking is a server transaction, so
 * nobody books a slot someone else holds. The Meet link is never printed in
 * this page — the Join button fetches it inside the join window.
 */
export default async function ExamPackConsultationPage() {
  const { user } = await requireExamPackPage("/exam-pack/consultation");
  const locale = await getLocale();

  let booking = await getBooking(user.uid);
  if (booking?.status === "booked" && !booking.meetUrl && !booking.manualUrl) {
    await attachBookingMeet(booking.id);
    booking = await getBooking(user.uid);
  }
  const holding = booking && booking.status !== "cancelled";
  const slots = holding ? [] : await listOpenSlots();
  // eslint-disable-next-line react-hooks/purity -- server component, one render per request
  const now = Date.now();

  return (
    <PageShell width="reading">
      <Link
        href="/exam-pack"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ict-fg-soft transition-colors duration-[120ms] hover:text-ict-accent-fg"
      >
        <Icon name="arrow_back" className="!text-base" />
        Exam Pack
      </Link>

      <div className="mt-4">
        <PageHeader title={t("title", locale)} subtitle={t("subtitle", locale)} />
      </div>

      <div className="mt-5 space-y-4">
        {booking && booking.status === "booked" ? (
          <>
            <Card variant="feature" radius="panel" className="p-6 sm:p-8">
              <Eyebrow>{t("booked", locale)}</Eyebrow>
              <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">
                {t("bookedFor", locale, {
                  when: formatSessionTime(booking.startsAt),
                  minutes: booking.durationMinutes,
                })}
              </p>
              <div className="mt-5">
                <JoinMeetButton
                  endpoint="/api/exam-pack/consultation/join"
                  labels={{
                    join: COPY.join[locale],
                    joining: COPY.joining[locale],
                    notOpen: COPY.joinNotOpen[locale],
                    noLink: COPY.joinNoLink[locale],
                    cancelled: COPY.joinCancelled[locale],
                    failed: COPY.joinFailed[locale],
                  }}
                />
              </div>
              <p className="mt-4 text-xs opacity-80">{t("howToJoin", locale)}</p>
            </Card>

            {booking.note ? (
              <Card radius="card" className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-ict-fg-soft">{t("yourNote", locale)}</p>
                <p className="mt-2 text-sm whitespace-pre-line text-ict-fg">{booking.note}</p>
              </Card>
            ) : null}

            {booking.startsAt - now >= CONSULT_CANCEL_CUTOFF_MS ? (
              <Card radius="card" className="flex flex-wrap items-center justify-between gap-3 p-5">
                <p className="text-sm text-ict-fg-soft">{t("moveRule", locale)}</p>
                <CancelBookingButton
                  labels={{
                    cancel: t("cancel", locale),
                    confirm: t("confirmCancel", locale),
                    tooLate: t("cancelTooLate", locale),
                    failed: t("failed", locale),
                  }}
                />
              </Card>
            ) : (
              <Notice tone="info">{t("tooLateToMove", locale)}</Notice>
            )}
          </>
        ) : booking?.status === "completed" ? (
          <Card radius="card" className="flex items-center gap-3 p-5">
            <StatusChip tone="success">{EXAM_PACK.consultMinutes} min</StatusChip>
            <p className="text-sm text-ict-fg">{t("done", locale)}</p>
          </Card>
        ) : booking?.status === "no_show" ? (
          <Notice tone="warning">{t("missed", locale)}</Notice>
        ) : (
          <ConsultationBooker
            slots={slots.map((s) => slotOption(s.id, s.startsAt, locale))}
            noteMax={CONSULT_NOTE_MAX}
            labels={{
              pick: t("pick", locale),
              note: t("note", locale),
              notePlaceholder: t("notePlaceholder", locale),
              book: t("book", locale),
              booking: t("booking", locale),
              none: t("none", locale),
              taken: t("taken", locale),
              tooSoon: t("tooSoon", locale),
              already: t("already", locale),
              failed: t("failed", locale),
            }}
          />
        )}
      </div>
    </PageShell>
  );
}
