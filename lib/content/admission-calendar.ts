/**
 * The dates a student leaving A/Ls plans around, in one place.
 *
 * Read by `/after-al`, the UGC application guide and their Sinhala twins, so a
 * date is corrected once rather than on four pages that then disagree. Every
 * date is either **confirmed** — published by the Department of Examinations or
 * the UGC, with the source beside it — or **expected**, and the pages print
 * which. Nothing here is a guess dressed as a fact: an expected date that
 * turns out wrong costs a student a deadline.
 *
 * ## Updating it each cycle
 *
 * When the UGC announces the next application window, move it from `next` to
 * confirmed with its source, and bump `checkedOn`. The pages print `checkedOn`
 * so a reader can see how fresh the calendar is.
 */

export interface CalendarStep {
  /** What happens, in the student's words. */
  what: string;
  /** When, as printed. */
  when: string;
  status: "confirmed" | "expected";
  /** One line of what to do about it. */
  note: string;
  source?: { label: string; url: string };
}

/** When a person last checked every date below against its source. */
export const CALENDAR_CHECKED_ON = "22 September 2026";

/**
 * The cycle that has just finished: the 2025 A/L exam, admitting to the
 * 2025/2026 academic year. Shown as "what happened last time" — the most
 * reliable guide to the shape of the next one.
 */
export const LAST_CYCLE: CalendarStep[] = [
  {
    what: "Online university applications (2025/2026 intake)",
    when: "28 April to 19 May 2026",
    status: "confirmed",
    note: "About three weeks, online only at ugc.ac.lk. 176,527 candidates qualified to apply. No application was accepted after 19 May.",
    source: {
      label: "Department of Government Information",
      url: "https://www.dgi.gov.lk/dgi-media/press-release/online-applications-for-university-admission-academic-year-2025-2026-closing-date-19-05-2026",
    },
  },
  {
    what: "Z-score cut-offs for 2025/2026 published",
    when: "By September 2026",
    status: "confirmed",
    note: "The minimum Z-score for every course in every district, after re-scrutiny. This is the table the free checker reads.",
    source: {
      label: "UGC cut-off marks 2025/2026 (PDF)",
      url: "https://www.ugc.ac.lk/downloads/admissions/cutoff_2026/COP_2025_2026-ENGLISH_Final.pdf",
    },
  },
];

/** The cycle a student who has just sat the 2026 exam is in. */
export const NEXT_CYCLE: CalendarStep[] = [
  {
    what: "2026 A/L examination",
    when: "10 August to 5 September 2026",
    status: "confirmed",
    note: "Marking began on 3 September.",
    source: {
      label: "Ada Derana",
      url: "https://adaderana.lk/news/cmsmupyda0005356p9rs1c5ue",
    },
  },
  {
    what: "2026 A/L results",
    when: "Before the end of 2026",
    status: "expected",
    note: "The Commissioner General of Examinations has said results will be out before year-end. Your Z-score is printed on the results sheet.",
    source: {
      label: "Ada Derana",
      url: "https://adaderana.lk/news/cmsmupyda0005356p9rs1c5ue",
    },
  },
  {
    what: "UGC handbook and online application (2026/2027 intake)",
    when: "Announced by the UGC after results",
    status: "expected",
    note: "Last time the window was three weeks long. Have your course list ready before it opens, not during.",
  },
  {
    what: "Z-score cut-offs and selection",
    when: "Several months after applications close",
    status: "expected",
    note: "Selection is by Z-score, district and the order of your preferences. Aptitude-test courses have their own dates in the handbook.",
  },
];

/**
 * How long the wait usually is, stated the same way everywhere. Matches the
 * Campus Ready FAQ, which is where it was first written.
 */
export const WAIT_MONTHS = "roughly ten to fourteen months";
