/**
 * The A/L ICT 2027 Exam Pack, in one place — the flagship product.
 *
 * Pure and client-safe: the sales page, the pack page, the console and the
 * payment screens all need the id, the price and the access period, and none of
 * them should reach into Firestore or the answer keys to get them. Nothing in
 * here is secret. The papers' answers live in `lib/exam-pack/papers.ts`, which
 * is server-only.
 *
 * ## What a buyer gets
 *
 * - Two full Paper I sittings, timed and scored on the server, ranked against
 *   every other pack holder: the 2027 predicted paper and the real 2026 paper.
 * - A worked walkthrough of every question in both, shown after submitting.
 * - The 2027 predicted Paper II with its mark scheme, and the focus-areas
 *   briefing behind both predicted papers.
 * - Personalised print-ready copies of every paper and answer key, carrying the
 *   student's name — saved as a PDF from the phone's own print dialog, which is
 *   the only PDF route that shapes Sinhala correctly.
 * - Dr. Yasas's own files: walkthroughs and revision sheets, uploaded from the
 *   console into the slots below.
 * - One 30-minute one-to-one consultation with Dr. Yasas, booked in the app.
 * - The weekly "Saturday live with Dr. Yasas from New Zealand", on Google Meet.
 *
 * ## Why Rs 9,900
 *
 * Monthly A/L ICT classes sell at Rs 1,000 to Rs 4,000. This is not a class: it
 * is the exam year's papers, a personal half hour with a PhD, and roughly forty
 * Saturday lives, bought once. Rs 9,900 is under three months of one subject's
 * fees, a price a parent can say yes to for the exam year — and it is high
 * enough that every buyer's 30 minutes stay deliverable (200 buyers is 100
 * hours of consultations). The console can change it; this is the default.
 */

import type { ExamPackLiveSchedule } from "@/lib/types";

export const EXAM_PACK_ID = "al-ict-exam-pack-2027";

/** The settings document under `settings/`. One per exam year, like the predicted paper's. */
export const EXAM_PACK_SETTINGS_DOC = "examPack2027";

export const EXAM_PACK = {
  id: EXAM_PACK_ID,
  name: "A/L ICT 2027 Exam Pack",
  shortName: "Exam Pack",
  examYear: 2027,
  /** Default price. The console edits `product.feeLKR`; this is only what a new pack starts at. */
  feeLKR: 9_900,
  /**
   * Thirteen months from purchase. The 2026 exam ran in August, so a student
   * buying today keeps the pack through a 2027 exam held as late as November.
   */
  accessDays: 400,
  consultMinutes: 30,
  /** The public sales page. Signed-in screens use `/exam-pack`. */
  publicPath: "/al-ict-exam-pack",
  appPath: "/exam-pack",
  tagline: {
    en: "Every 2027 paper, worked through — plus a one-to-one with Dr. Yasas and a live class every Saturday.",
    si: "2027 exam එකට ඕන papers ඔක්කොම, හැම ප්‍රශ්නයක්ම පැහැදිලි කරලා — Dr. Yasas එක්ක one-to-one එකක් සහ හැම සෙනසුරාදාම live class එකක්.",
  },
} as const;

/** The weekly live, unless the owner changes it in the console: Saturday, 4pm Sri Lanka time, an hour. */
export const LIVE_DEFAULTS: ExamPackLiveSchedule = {
  enabled: true,
  weekday: 6,
  time: "16:00",
  // A free Google account ends a group call at 60 minutes. Longer needs Google
  // One or Workspace — the console says so beside this field.
  durationMinutes: 60,
  title: "Saturday live with Dr. Yasas from New Zealand",
};

/** The join button opens this long before a live starts — the same window the class timetable uses. */
export const JOIN_OPENS_BEFORE_MS = 15 * 60 * 1000;
/** And stays open this long after the scheduled end, for a class that runs over. */
export const JOIN_CLOSES_AFTER_MS = 30 * 60 * 1000;

/** How far ahead a slot must be to book it. Gives the owner a chance to see it before it starts. */
export const CONSULT_BOOK_LEAD_MS = 3 * 60 * 60 * 1000;
/** A student can move their own booking until this long before it. After that, only the owner can. */
export const CONSULT_CANCEL_CUTOFF_MS = 12 * 60 * 60 * 1000;
/** Longest note a student can leave for the consultation. */
export const CONSULT_NOTE_MAX = 500;

export type Bilingual = { en: string; si: string };

export function pick(text: Bilingual, locale: "en" | "si"): string {
  return locale === "si" ? text.si : text.en;
}

/** The two papers a buyer sits. The keys are stable — sittings are stored under them. */
export const PAPER_IDS = ["predicted-2027-p1", "al-2026-p1"] as const;
export type PaperId = (typeof PAPER_IDS)[number];

export function isPaperId(value: string): value is PaperId {
  return (PAPER_IDS as readonly string[]).includes(value);
}

/**
 * Files Dr. Yasas uploads from the console — Content, "Pack file", choose the
 * Exam Pack, then the slot. A slot with no file yet says "Coming soon" on the
 * pack page; the console counts how many are filled before the pack goes on sale.
 */
export interface ExamPackSlot {
  key: string;
  title: Bilingual;
  blurb: Bilingual;
  /** Shown as a badge: "PDF", "Video". */
  fileLabel: string;
}

export const EXAM_PACK_SLOTS: ExamPackSlot[] = [
  {
    key: "p1-2025-walkthrough",
    title: { en: "2025 Paper I — full walkthrough", si: "2025 Paper I — සම්පූර්ණ walkthrough එක" },
    blurb: {
      en: "Every MCQ worked through, with the trap in each wrong option.",
      si: "හැම MCQ එකක්ම විසඳලා, වැරදි options වල තියෙන උගුල් එක්කම.",
    },
    fileLabel: "PDF",
  },
  {
    key: "p2-2025-model-answers",
    title: { en: "2025 Paper II — model answers", si: "2025 Paper II — model answers" },
    blurb: {
      en: "Structured and essay answers written the way the marking scheme rewards.",
      si: "Marking scheme එකට ලකුණු දෙන විදිහට ලියපු structured සහ essay answers.",
    },
    fileLabel: "PDF",
  },
  {
    key: "p1-2024-walkthrough",
    title: { en: "2024 Paper I — full walkthrough", si: "2024 Paper I — සම්පූර්ණ walkthrough එක" },
    blurb: {
      en: "The year before, worked the same way, so you see which ideas come back.",
      si: "ඊට කලින් අවුරුද්දත් ඒ විදිහටම — ආපහු එන ideas මොනවද කියලා පේනවා.",
    },
    fileLabel: "PDF",
  },
  {
    key: "p2-2024-model-answers",
    title: { en: "2024 Paper II — model answers", si: "2024 Paper II — model answers" },
    blurb: {
      en: "Full-mark answers for every structured and essay question.",
      si: "හැම structured සහ essay ප්‍රශ්නයකටම full marks ලැබෙන answers.",
    },
    fileLabel: "PDF",
  },
  {
    key: "revision-sheets",
    title: { en: "One-page revision sheets", si: "පිටුවේ revision sheets" },
    blurb: {
      en: "Number systems, logic, SQL, networking and Python, one page each, for the last weeks.",
      si: "Number systems, logic, SQL, networking සහ Python — එකකට පිටුවයි, අන්තිම සති ටිකට.",
    },
    fileLabel: "PDF",
  },
  {
    key: "exam-day-plan",
    title: { en: "Exam-day plan", si: "Exam දවසේ plan එක" },
    blurb: {
      en: "How to spend the two hours of Paper I and the three of Paper II, minute by minute.",
      si: "Paper I පැය දෙක සහ Paper II පැය තුන විනාඩියෙන් විනාඩියට පාවිච්චි කරන හැටි.",
    },
    fileLabel: "PDF",
  },
];

/** The personalised print copies. Keys are the `/exam-pack/print/[doc]` segment. */
export const PRINT_DOCS = [
  {
    key: "predicted-2027-p1",
    title: { en: "2027 predicted Paper I — question paper", si: "2027 predicted Paper I — ප්‍රශ්න පත්‍රය" },
  },
  {
    key: "predicted-2027-p1-answers",
    title: {
      en: "2027 predicted Paper I — answers and walkthrough",
      si: "2027 predicted Paper I — answers සහ walkthrough",
    },
  },
  {
    key: "predicted-2027-p2",
    title: {
      en: "2027 predicted Paper II — with mark scheme",
      si: "2027 predicted Paper II — mark scheme එක්ක",
    },
  },
  {
    key: "al-2026-p1",
    title: { en: "2026 Paper I — question paper", si: "2026 Paper I — ප්‍රශ්න පත්‍රය" },
  },
  {
    key: "al-2026-p1-answers",
    title: { en: "2026 Paper I — answers and walkthrough", si: "2026 Paper I — answers සහ walkthrough" },
  },
] as const satisfies ReadonlyArray<{ key: string; title: Bilingual }>;

export type PrintDocKey = (typeof PRINT_DOCS)[number]["key"];

export function isPrintDocKey(value: string): value is PrintDocKey {
  return PRINT_DOCS.some((d) => d.key === value);
}

/** Where a buyer is sent after paying. Lives here so the payment watcher does not import the pack's server code. */
export function isExamPackId(subjectId: string | null | undefined): boolean {
  return subjectId === EXAM_PACK_ID;
}
