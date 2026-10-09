/**
 * The Exam Pack's student-facing words, in English and Sinhala.
 *
 * Kept beside the product rather than in `lib/i18n/dictionary.ts`, the same
 * way the Survival Pack keeps its own: this is product copy that changes with
 * the product, and the pages pick the locale server-side, so none of it is
 * shipped to the browser except the strings a client component is handed.
 *
 * Sinhala is everyday spoken Sinhala, and the words students say in English —
 * paper, MCQ, rank, Live, Google Meet, consultation — stay in English, as
 * CLAUDE.md asks.
 */

import type { Bilingual } from "@/lib/exam-pack/config";

export const COPY = {
  eyebrow: { en: "A/L ICT 2027", si: "A/L ICT 2027" },
  title: { en: "Exam Pack", si: "Exam Pack" },
  yoursUntil: { en: "Yours until {date}", si: "{date} වෙනකන් ඔයාගේ" },
  notOnSaleStaff: {
    en: "Not on sale yet — students cannot open this page. Turn it on from Teacher console → Exam Pack.",
    si: "Not on sale yet — students cannot open this page. Turn it on from Teacher console → Exam Pack.",
  },
  buyerPreviewStaff: {
    en: "You are seeing what a student sees before they buy.",
    si: "You are seeing what a student sees before they buy.",
  },

  /* ---- selling ---- */
  onePayment: { en: "One payment · 13 months · Card only", si: "එක ගෙවීමක් · මාස 13ක් · Card එකෙන් විතරයි" },
  buy: { en: "Get the Exam Pack — {price}", si: "Exam Pack එක ගන්න — {price}" },
  openingSoon: { en: "Opening soon", si: "ළඟදීම open කරනවා" },
  cardNotReady: {
    en: "Card payment is not switched on yet. Check back soon.",
    si: "Card payment තවම on කරලා නෑ. ටිකකින් ආපහු බලන්න.",
  },
  insideTitle: { en: "What's inside", si: "ඇතුළේ තියෙන්නේ" },
  tryTitle: { en: "Try it first", si: "මුලින්ම try කරලා බලන්න" },
  tryHint: {
    en: "Real questions from the pack. Answer in your head, then tap to see the answer and the walkthrough.",
    si: "Pack එකේ ඇත්ත ප්‍රශ්න. ඔලුවෙන් answer කරලා, tap කරලා answer එකයි walkthrough එකයි බලන්න.",
  },
  showAnswer: { en: "Show the answer", si: "Answer එක බලන්න" },
  hideAnswer: { en: "Hide the answer", si: "Answer එක හංගන්න" },
  answerIs: { en: "Answer: ({n})", si: "Answer එක: ({n})" },

  /* ---- owned ---- */
  nextStep: { en: "Saturday live with Dr. Yasas", si: "Dr. Yasas එක්ක සෙනසුරාදා Live" },
  liveWhen: { en: "Every {weekday} at {time}, Sri Lanka time, on Google Meet", si: "හැම {weekday}ම {time}ට (ලංකාවේ වෙලාවෙන්), Google Meet එකේ" },
  liveNext: { en: "Next: {when}", si: "ඊළඟ එක: {when}" },
  liveCancelled: { en: "No live this week — {when}", si: "මේ සතියේ Live එකක් නෑ — {when}" },
  liveOff: { en: "The Saturday live is paused for now.", si: "සෙනසුරාදා Live එක දැනට නවත්තලා." },
  liveHowTo: {
    en: "The Join button opens 15 minutes before. You join from Meet's waiting room and Dr. Yasas lets everyone in when the class starts.",
    si: "Join button එක විනාඩි 15කට කලින් open වෙනවා. Meet එකේ waiting room එකෙන් join වෙන්න — class එක පටන් ගන්නකොට Dr. Yasas ඔක්කොටම ඇතුළට එන්න දෙනවා.",
  },
  join: { en: "Join on Google Meet", si: "Google Meet එකට join වෙන්න" },
  joining: { en: "Opening…", si: "Open වෙනවා…" },
  joinNotOpen: { en: "It opens at {time}.", si: "{time}ට open වෙනවා." },
  joinNoLink: {
    en: "The link is being set up. Try again in a minute.",
    si: "Link එක හදනවා. විනාඩියකින් ආපහු try කරන්න.",
  },
  joinCancelled: { en: "This week's live is cancelled.", si: "මේ සතියේ Live එක cancel කරලා." },
  joinFailed: { en: "Could not open the class. Try again.", si: "Class එක open කරන්න බැරි වුණා. ආපහු try කරන්න." },

  papersTitle: { en: "Papers", si: "Papers" },
  papersHint: {
    en: "Timed like the real exam, marked the moment you submit, ranked against every Exam Pack student.",
    si: "ඇත්ත exam එකේ වගේම වෙලාවට, submit කරපු ගමන් marks, හැම Exam Pack student කෙනෙක් එක්කම rank.",
  },
  notStarted: { en: "Not started", si: "තවම පටන් ගත්තේ නෑ" },
  inProgress: { en: "In progress", si: "කරගෙන යනවා" },
  scored: { en: "{score}/{total} · Rank {rank} of {of}", si: "{score}/{total} · Rank {rank} / {of}" },
  start: { en: "Start", si: "පටන් ගන්න" },
  continue: { en: "Continue", si: "දිගටම කරන්න" },
  review: { en: "Review", si: "බලන්න" },
  paperTwoTitle: { en: "2027 predicted Paper II", si: "2027 predicted Paper II" },
  paperTwoBlurb: {
    en: "Ten structured and essay questions with the mark scheme, and the focus-areas briefing behind both papers.",
    si: "Structured සහ essay ප්‍රශ්න 10ක් mark scheme එක්ක, සහ papers දෙකටම පදනම් වුණ focus areas briefing එක.",
  },
  open: { en: "Open", si: "Open කරන්න" },

  consultTitle: { en: "Your 30 minutes with Dr. Yasas", si: "Dr. Yasas එක්ක ඔයාගේ විනාඩි 30" },
  consultBlurb: {
    en: "One-to-one on Google Meet. Bring your weakest topic, a past-paper question that beat you, or your study plan.",
    si: "Google Meet එකේ one-to-one. ඔයාට අමාරුම topic එක, බැරි වුණ past paper ප්‍රශ්නයක්, නැත්නම් study plan එක අරන් එන්න.",
  },
  consultBook: { en: "Book your consultation", si: "Consultation එක book කරන්න" },
  consultBooked: { en: "Booked for {when}", si: "{when}ට book කරලා" },
  consultDone: { en: "Done — thank you for coming.", si: "ඉවරයි — ආවට ස්තූතියි." },
  consultMissed: {
    en: "Marked as missed. Message Dr. Yasas if something went wrong.",
    si: "Miss වුණා කියලා mark කරලා. මොකක් හරි වැරදුණා නම් Dr. Yasas ට message කරන්න.",
  },
  consultManage: { en: "Manage", si: "වෙනස් කරන්න" },

  downloadsTitle: { en: "Downloads", si: "Downloads" },
  downloadsHint: {
    en: "Print-ready copies with your name on them. Open one, then Save as PDF from your phone's print menu.",
    si: "ඔයාගේ නම තියෙන print කරන්න ලෑස්ති copies. එකක් open කරලා phone එකේ print menu එකෙන් Save as PDF කරන්න.",
  },
  afterYouSit: { en: "Opens after you sit it", si: "Paper එක කළාම open වෙනවා" },
  filesTitle: { en: "From Dr. Yasas", si: "Dr. Yasas ගෙන්" },
  download: { en: "Download", si: "Download" },
  comingSoon: { en: "Coming soon", si: "ළඟදීම" },
  expired: { en: "Your Exam Pack access has ended.", si: "ඔයාගේ Exam Pack access එක ඉවරයි." },
  aiNote: {
    en: "The walkthroughs and predicted papers were drafted with AI and reviewed by Dr. Yasas Sri Wickramasinghe. A predicted paper is a pattern analysis, not a leaked paper and not a guarantee.",
    si: "Walkthroughs සහ predicted papers AI එකෙන් draft කරලා Dr. Yasas Sri Wickramasinghe review කළා. Predicted paper එකක් කියන්නේ pattern analysis එකක් — leak වුණ paper එකක් නෙවෙයි, guarantee එකකුත් නෙවෙයි.",
  },
} satisfies Record<string, Bilingual>;

export type CopyKey = keyof typeof COPY;

/** Picks the locale and fills `{placeholders}`. */
export function c(key: CopyKey, locale: "en" | "si", vars?: Record<string, string | number>): string {
  const template = COPY[key][locale];
  return vars ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : template;
}

/** What a buyer gets, as the selling page lists it. Icons are names from `components/ui/Icon.tsx`. */
export const INSIDE: Array<{ icon: string; title: Bilingual; body: Bilingual }> = [
  {
    icon: "timer",
    title: { en: "Two full Paper I sittings, ranked", si: "සම්පූර්ණ Paper I දෙකක්, rank එක්ක" },
    body: {
      en: "The 2027 predicted paper and the real 2026 paper, two hours each, marked when you submit and ranked against every Exam Pack student.",
      si: "2027 predicted paper එකයි ඇත්ත 2026 paper එකයි, පැය දෙක ගානේ — submit කරපු ගමන් marks, හැම Exam Pack student කෙනෙක් එක්කම rank.",
    },
  },
  {
    icon: "fact_check",
    title: { en: "Every question worked through", si: "හැම ප්‍රශ්නයක්ම පැහැදිලි කරලා" },
    body: {
      en: "100 walkthroughs: why the answer is right, and the trap in the options that catch students.",
      si: "Walkthroughs 100ක්: answer එක හරි ඇයි, සහ ළමයි අහුවෙන options වල තියෙන උගුල.",
    },
  },
  {
    icon: "edit_note",
    title: { en: "Predicted Paper II with mark scheme", si: "Mark scheme එක්ක Predicted Paper II" },
    body: {
      en: "Structured and essay questions on the likeliest 2027 topics, and how each one is marked.",
      si: "2027ට එන්න ඉඩ වැඩි topics වල structured සහ essay ප්‍රශ්න, සහ ඒවට marks දෙන හැටි.",
    },
  },
  {
    icon: "print",
    title: { en: "Print-ready PDFs with your name", si: "ඔයාගේ නම තියෙන PDFs" },
    body: {
      en: "Every paper and answer key, ready to save as a PDF and sit on paper at home.",
      si: "හැම paper එකක්ම සහ answer key එකක්ම PDF එකක් විදිහට save කරලා ගෙදර paper එකේ ලියන්න.",
    },
  },
  {
    icon: "co_present",
    title: { en: "30 minutes one-to-one with Dr. Yasas", si: "Dr. Yasas එක්ක one-to-one විනාඩි 30" },
    body: {
      en: "A private Google Meet call, booked in the app at a time that suits you.",
      si: "ඔයාට ගැළපෙන වෙලාවකට app එකෙන් book කරන private Google Meet call එකක්.",
    },
  },
  {
    icon: "videocam",
    title: { en: "A live class every week", si: "හැම සතියෙම Live class එකක්" },
    // {title}, {weekday} and {time} are filled from the console's schedule, so
    // the page never promises a time the owner has since moved.
    body: {
      en: "\"{title}\" — every {weekday} at {time}, Sri Lanka time, on Google Meet, until the exam.",
      si: "\"{title}\" — හැම {weekday}ම {time}ට (ලංකාවේ වෙලාවෙන්) Google Meet එකේ, exam එක වෙනකන්.",
    },
  },
];

/** Fills `{placeholders}` in any bilingual template. */
export function fill(text: Bilingual, locale: "en" | "si", vars: Record<string, string | number>): string {
  return text[locale].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
