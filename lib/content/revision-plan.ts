/**
 * A/L ICT revision planning — the layer above /past-papers (which teaches
 * how to use a paper you already have). This page answers the question
 * that comes before that: where to start, and what to do with the time
 * actually left, especially for a repeat candidate or a student who isn't
 * sure where they stand. Static reference content, same reasoning as
 * command-words.ts and distinguish-between.ts: stable across syllabus
 * revisions, safe to publish once.
 */

export interface RevisionStage {
  window: string;
  headline: string;
  steps: string[];
}

/**
 * Deliberately framed by "weeks remaining" rather than calendar dates or
 * months before a specific sitting — a page that says "in April, do X"
 * goes stale and misleads a repeat candidate revising at a different time
 * of year entirely.
 */
export const STAGES: RevisionStage[] = [
  {
    window: "8+ weeks left",
    headline: "Time for a full pass, then a focused second one",
    steps: [
      "One full pass through every unit, in the high-yield order below — notes and lessons, not past papers yet.",
      "A second pass, but only on the units that felt shaky the first time.",
      "From about week 4 onward, one timed past paper a week, diagnosed unit by unit rather than just marked right or wrong.",
      "Final week: re-attempt the paper you did worst on — not a new one. If the same marks are still missing, that is what needs fixing, not more new papers.",
    ],
  },
  {
    window: "4–8 weeks left",
    headline: "Skip the full read-through — start where the marks are",
    steps: [
      "Go straight to the high-yield units below. A full unit-by-unit read-through is a luxury you no longer have.",
      "Sit one timed past paper this week regardless of how prepared you feel — it is a diagnosis, not a test you can fail.",
      "Alternate: revise one weak unit, then attempt just the paper questions that test it.",
      "Fix command words and \"distinguish between\" technique now. They cost almost nothing to learn and are pure free marks otherwise.",
    ],
  },
  {
    window: "Under 4 weeks left",
    headline: "Triage, not coverage",
    steps: [
      "Pick the 3–4 highest-yield units you are weakest in and go deep only there. Trying to touch all 14 units this late spreads you too thin to help any of them.",
      "One full timed past paper every remaining week, no exceptions, marked against the scheme rather than memory.",
      "Command words, in one sitting — the single highest return for the lowest time cost this close to the exam.",
      "Accept that some units will not be revised. A confident 70% of the paper beats a shaky attempt at all of it.",
    ],
  },
];

export const FAQ = [
  {
    q: "Can I repeat only A/L ICT without repeating all three subjects?",
    a: "Generally yes — Sri Lanka's Department of Examinations lets a private candidate sit individual subjects rather than all three again. But repeat and private candidates have their own registration category with real conditions (for example, a competency-development programme that stands in for School Based Assessment, and restrictions if you're still enrolled at school), and these rules are set by the Department of Examinations and can change year to year. Confirm the current year's exact requirements at doenets.lk or with your school — this page is about how to revise, not exam registration.",
  },
  {
    q: "Is it too late to start revision with only a few weeks left?",
    a: "No. A late start still moves your mark, it just changes what you do with the time you have. Skip the full read-through and go straight to the high-yield units and past-paper drilling — a focused two weeks beats an unfocused two months.",
  },
  {
    q: "How do I know which units are actually worth the most marks?",
    a: "The syllabus's own period allocation is the best public guide — units with more teaching periods carry more marks. The list on this page is every A/L ICT unit sorted by period count for exactly that reason.",
  },
  {
    q: "I don't have a recent mark or paper — how do I find my weak areas?",
    a: "Sit the free 2026 Paper I MCQ on this site as a baseline. It's free, takes about the same time as the real Paper I, and marks itself instantly, so you get an actual diagnosis instead of a guess.",
  },
  {
    q: "Should I revise every unit equally?",
    a: "No. Polishing a low-yield unit and running out of time for a high-yield one is one of the most common ways marks are lost. Work through the units in the order below, not the syllabus's own numbering.",
  },
] as const;
