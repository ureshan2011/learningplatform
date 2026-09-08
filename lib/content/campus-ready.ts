/**
 * Campus Ready — the 12-week programme sold into the gap between the A/L exam
 * and the first university lecture.
 *
 * Static content, the same way `al-ict-units.ts` and `university-pathways.ts`
 * are: a syllabus is fixed reference material, not something a page should pay
 * a Firestore read for on every render. The seed route, the public product
 * page and the certificate's module list all read from here, so the programme
 * is described in exactly one place.
 *
 * See `docs/campus-ready-plan.md` for why the curriculum is shaped this way.
 */

export const CAMPUS_READY = {
  /** Stable across intakes. The intake id is this plus a term, e.g. `campus-ready-2027-jan`. */
  slug: "campus-ready",
  name: "Campus Ready",
  certificateTitle: "Certificate in Digital & Research Skills for University",
  /** The one-off programme fee in LKR rupees. */
  feeLKR: 30_000,
  weeks: 12,
  /**
   * The promise, in the students' own register. Sri Lankan students say
   * "campus", not "university" — copy that does not sound like how they talk
   * reads as an advertisement rather than advice.
   */
  tagline: "Your degree assumes you already know this. Nobody taught you.",
} as const;

/**
 * Which half of the programme a week belongs to.
 *
 * "foundations" is the must-have half the marketing leads with — the things a
 * first-year is expected to be able to do in week one and never gets taught.
 * "analysis" is the payoff half. A student who only came to survive first year
 * finishes able to do data analysis, which is how the upsell sits inside the
 * product instead of being a second sale.
 */
export type CampusStrand = "foundations" | "analysis";

export interface CampusWeek {
  week: number;
  strand: CampusStrand;
  title: string;
  summary: string;
  /** What the student produces. Every week ends in something markable without a mentor. */
  deliverable: string;
}

export const CAMPUS_READY_WEEKS: CampusWeek[] = [
  {
    week: 1,
    strand: "foundations",
    title: "How campus actually works",
    summary:
      "Moodle, reading an assignment brief, academic email, and keeping files so you can find them in year three.",
    deliverable: "Setup lab",
  },
  {
    week: 2,
    strand: "foundations",
    title: "Word, properly",
    summary:
      "Styles, an automatic table of contents, captions and cross-references — the difference between a report that looks marked-down and one that does not.",
    deliverable: "Assignment template",
  },
  {
    week: 3,
    strand: "foundations",
    title: "Spreadsheets, properly",
    summary: "Formulas, lookups and pivot tables on data that is not already tidy.",
    deliverable: "Spreadsheet lab",
  },
  {
    week: 4,
    strand: "foundations",
    title: "Collecting and cleaning data",
    summary:
      "Designing a survey in Google Forms, cleaning what comes back, and presenting findings without reading off the slide.",
    deliverable: "Milestone 1",
  },
  {
    week: 5,
    strand: "analysis",
    title: "Python foundations",
    summary: "Variables, lists, loops and functions, written in the browser with nothing to install.",
    deliverable: "Python lab",
  },
  {
    week: 6,
    strand: "analysis",
    title: "pandas",
    summary: "Load, filter, group and merge — on real Sri Lankan data, not a tutorial dataset.",
    deliverable: "Python lab",
  },
  {
    week: 7,
    strand: "analysis",
    title: "Charts that do not lie",
    summary: "Choosing the right chart, and the common ones that mislead without meaning to.",
    deliverable: "Milestone 2",
  },
  {
    week: 8,
    strand: "analysis",
    title: "Statistics for your research project",
    summary: "Sampling, confidence, t-test and chi-square — the tests your supervisor will expect.",
    deliverable: "Python and spreadsheet lab",
  },
  {
    week: 9,
    strand: "analysis",
    title: "Correlation and regression",
    summary: "Running them, and reading the output the way the person marking it will.",
    deliverable: "Quiz",
  },
  {
    week: 10,
    strand: "analysis",
    title: "Power BI",
    summary: "Data model, relationships, the DAX you actually need, and a dashboard that answers a question.",
    deliverable: "Power BI report",
  },
  {
    week: 11,
    strand: "analysis",
    title: "Research toolkit and using AI honestly",
    summary:
      "Literature search, Zotero, APA and Harvard, what Turnitin checks — and where the line sits between AI helping you and AI writing for you, including how to declare it.",
    deliverable: "Research pack",
  },
  {
    week: 12,
    strand: "analysis",
    title: "Capstone",
    summary:
      "One question, start to finish, on real Sri Lankan open data: clean it, analyse it, build the dashboard, write it up.",
    deliverable: "Portfolio project",
  },
];

/** Short topic list for the subject document and the syllabus summary. */
export const CAMPUS_READY_TOPICS: string[] = CAMPUS_READY_WEEKS.map((w) => w.title);
