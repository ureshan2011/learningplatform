/**
 * The Business Model Canvas tutorial and its group activity.
 *
 * Structured rather than written as prose inside a page component, for one
 * reason: nobody is sure yet where this belongs. It was asked for "under
 * MBI800", which is not a course this platform has — the syllabus here is the
 * fourteen-unit NIE A/L ICT one, and `lib/content/al-ict-units.ts` is a
 * faithful transcription of it that must not gain a unit the NIE never wrote.
 * So it lives as data with one page rendering it, and moving it later is an
 * import change rather than a rewrite.
 *
 * The canvas is by Alexander Osterwalder and Yves Pigneur (*Business Model
 * Generation*, 2010) and is published under Creative Commons BY-SA 3.0. The
 * attribution below is not decoration: a teacher reproducing the nine boxes on
 * a handout is relying on that licence.
 */

export const CANVAS_ATTRIBUTION =
  "The Business Model Canvas is by Alexander Osterwalder and Yves Pigneur (Business Model Generation, 2010), published under Creative Commons BY-SA 3.0.";

/**
 * Which half of the canvas a block sits in.
 *
 * The split is the teaching point, not a layout detail: the right side is the
 * market, the left is the machine that serves it, and the value proposition is
 * the hinge the two turn on. A student who learns the boxes without the split
 * has learned a form to fill in.
 */
export type CanvasSide = "market" | "hinge" | "machine" | "money";

export interface CanvasBlock {
  /** Position in the order these are filled, which is not left to right. */
  order: number;
  key: string;
  title: string;
  /** The question this block actually answers. */
  question: string;
  /** The mistake a first-time group makes here. */
  watchOut: string;
  side: CanvasSide;
}

/**
 * The nine blocks, in the order they should be filled.
 *
 * Customer first, because everything else is a consequence of who you chose.
 * Money before machinery, because knowing what people will pay for is what
 * tells you what you actually need to build.
 */
export const CANVAS_BLOCKS: CanvasBlock[] = [
  {
    order: 1,
    key: "segments",
    title: "Customer segments",
    question: "Who exactly are we serving?",
    watchOut: "“Everyone” is not a segment. Who are the first hundred?",
    side: "market",
  },
  {
    order: 2,
    key: "value",
    title: "Value propositions",
    question: "Which problem do we solve, and why us?",
    watchOut: "A feature list is not a value proposition. What would they do if this did not exist?",
    side: "hinge",
  },
  {
    order: 3,
    key: "channels",
    title: "Channels",
    question: "How do they find us, buy, and get help afterwards?",
    watchOut: "Almost every group forgets after-sale support.",
    side: "market",
  },
  {
    order: 4,
    key: "relationships",
    title: "Customer relationships",
    question: "Self-service, personal, or community?",
    watchOut: "Whichever you pick has a cost. It belongs in the cost structure.",
    side: "market",
  },
  {
    order: 5,
    key: "revenue",
    title: "Revenue streams",
    question: "What will they actually pay for, and how?",
    watchOut: "Users and payers are not always the same people. Whose money is it?",
    side: "money",
  },
  {
    order: 6,
    key: "resources",
    title: "Key resources",
    question: "What must we own or control?",
    watchOut: "List what is critical, not everything the business touches.",
    side: "machine",
  },
  {
    order: 7,
    key: "activities",
    title: "Key activities",
    question: "What must we do brilliantly?",
    watchOut: "This is not a description of the whole company.",
    side: "machine",
  },
  {
    order: 8,
    key: "partners",
    title: "Key partners",
    question: "Who do we not need to become ourselves?",
    watchOut: "A partner nobody has contacted is a wish. Why would they say yes?",
    side: "machine",
  },
  {
    order: 9,
    key: "costs",
    title: "Cost structure",
    question: "What are the big, unavoidable costs?",
    watchOut: "The largest line is the one groups miss. What dominates the bank statement?",
    side: "money",
  },
];

/**
 * A worked example, walked through in about five minutes before groups start.
 *
 * Food delivery on purpose: it is two-sided, so the "who is the customer"
 * question has two honest answers, and every student has used one.
 */
export const WORKED_EXAMPLE = {
  business: "A food delivery app",
  rows: [
    {
      block: "Customer segments",
      note: "Two of them, and this is the lesson: hungry customers and restaurants. Riders are a third if you treat them as a segment rather than a resource.",
    },
    {
      block: "Value propositions",
      note: "Customers: choice and speed without leaving the house. Restaurants: orders without hiring delivery staff.",
    },
    { block: "Channels", note: "The app for customers; a partner portal for restaurants." },
    {
      block: "Customer relationships",
      note: "Automated and self-service for customers; account-managed for the large chains.",
    },
    {
      block: "Revenue streams",
      note: "Commission per order, the delivery fee, and paid placement in search results.",
    },
    { block: "Key resources", note: "The app, the rider network, the restaurant list." },
    {
      block: "Key activities",
      note: "Matching orders to riders, onboarding restaurants, handling complaints.",
    },
    { block: "Key partners", note: "Restaurants, the payment gateway, and the riders themselves." },
    {
      block: "Cost structure",
      note: "Rider payments are the big one, then engineering, then marketing to acquire both sides.",
    },
  ],
  /** The question that teaches the canvas is a system rather than nine boxes. */
  systemQuestion:
    "Now ask the room one question: what happens to every other box if riders become employees instead of contractors?",
};

export interface RunSheetRow {
  at: string;
  minutes: number;
  what: string;
}

/** Ninety minutes, including a compact introduction. */
export const RUN_SHEET: RunSheetRow[] = [
  { at: "0:00", minutes: 10, what: "Introduce the canvas — the nine blocks and the left/right split" },
  { at: "0:10", minutes: 5, what: "Walk the worked example on the board" },
  { at: "0:15", minutes: 5, what: "Form groups of six, assign roles, choose a business" },
  { at: "0:20", minutes: 35, what: "Build the canvas" },
  { at: "0:55", minutes: 10, what: "Prepare the three-minute pitch" },
  { at: "1:05", minutes: 21, what: "Pitches — three minutes each, up to seven groups" },
  { at: "1:26", minutes: 4, what: "Debrief and close" },
];

export const RUN_SHEET_NOTE =
  "If the lecture happened in an earlier session, drop the first fifteen minutes and give the build phase fifty instead.";

export interface GroupRole {
  order: number;
  title: string;
  does: string;
}

/**
 * Six jobs for six people.
 *
 * A six-person group with no roles is two people working and four watching,
 * which is the single most common way this activity fails. Value propositions
 * is deliberately nobody's job alone — the whole group does that block
 * together, because it is the hinge everything else hangs off.
 */
export const GROUP_ROLES: GroupRole[] = [
  {
    order: 1,
    title: "Facilitator and timekeeper",
    does: "Calls the order of blocks, holds the clock, makes sure all six contribute",
  },
  {
    order: 2,
    title: "Scribe",
    does: "Owns the sheet — nothing goes on it without being said aloud first",
  },
  {
    order: 3,
    title: "Customer lead",
    does: "Drives segments, channels and customer relationships",
  },
  {
    order: 4,
    title: "Operations lead",
    does: "Drives key activities, key resources and key partners",
  },
  { order: 5, title: "Money lead", does: "Drives revenue streams and cost structure" },
  {
    order: 6,
    title: "Challenger and presenter",
    does: "Asks “would someone really pay for this?” throughout, then presents",
  },
];

/** How the thirty-five build minutes are spent, so nobody loses twenty on key partners. */
export const BUILD_TIMINGS: Array<{ block: string; minutes: number }> = [
  { block: "Customer segments", minutes: 5 },
  { block: "Value propositions", minutes: 7 },
  { block: "Channels and customer relationships", minutes: 5 },
  { block: "Revenue streams", minutes: 5 },
  { block: "Key resources, activities and partners", minutes: 8 },
  { block: "Cost structure", minutes: 5 },
];

/**
 * The one instruction that does more work than the rest of the session.
 *
 * Called at the thirty-minute mark, once every box has something in it.
 */
export const LINKING_INSTRUCTION =
  "Draw a line from each value proposition to the customer segment it serves. If a proposition has no line, it is a feature nobody asked for — take it off.";

export const MATERIALS = [
  "One A1 sheet or flipchart page with the nine boxes drawn on it",
  "Sticky notes in at least three colours, around forty per group",
  "Marker pens",
];

export const MATERIALS_NOTE =
  "Sticky notes rather than writing straight onto the sheet, deliberately: the exercise is about moving things when one box forces another to change, and a canvas written in pen is a canvas nobody revises.";

export const CHOOSING_RULES = [
  "It must be specific. “A restaurant” is not a business; “a vegetarian lunch delivery for office workers in the city centre” is.",
  "No two groups may pick the same business. First come, first served.",
];

export interface PitchPoint {
  order: number;
  seconds: number;
  what: string;
}

/** Strictly timed. Point four is what separates understanding from box-filling. */
export const PITCH_POINTS: PitchPoint[] = [
  { order: 1, seconds: 20, what: "The business, in one sentence" },
  { order: 2, seconds: 60, what: "The customer segment, and the value proposition that serves it" },
  { order: 3, seconds: 40, what: "How it makes money" },
  { order: 4, seconds: 40, what: "The single biggest risk in the model" },
  { order: 5, seconds: 20, what: "One question from the class" },
];

export interface RubricRow {
  criterion: string;
  marks: number;
  full: string;
}

/** Twenty marks. Adjust the weights; keep the criteria. */
export const RUBRIC: RubricRow[] = [
  {
    criterion: "Customer segments are specific",
    marks: 3,
    full: "Named, narrow, and you could go and find one tomorrow",
  },
  {
    criterion: "Value proposition matches the segment",
    marks: 5,
    full: "States a problem rather than a feature list, and every proposition links to a segment",
  },
  {
    criterion: "Revenue and cost are plausible",
    marks: 4,
    full: "The biggest cost is identified, and revenue comes from someone who would really pay",
  },
  {
    criterion: "The left side delivers the right side",
    marks: 4,
    full: "Resources, activities and partners are the ones this model actually needs",
  },
  {
    criterion: "Pitch quality",
    marks: 4,
    full: "Within time, all five points covered, and the risk named honestly",
  },
];

export const RUBRIC_TOTAL = RUBRIC.reduce((sum, row) => sum + row.marks, 0);

/** Have these ready for the debrief — each is a mistake and the question that exposes it. */
export const COMMON_MISTAKES: Array<{ mistake: string; ask: string }> = [
  { mistake: "“Everyone” as a customer segment", ask: "Who are the first hundred?" },
  {
    mistake: "Users confused with payers, which is common in anything ad-funded or two-sided",
    ask: "Whose money is it?",
  },
  {
    mistake: "A value proposition that is really a feature list",
    ask: "What would the customer do if this did not exist?",
  },
  {
    mistake: "A cost structure missing the biggest cost",
    ask: "What is the largest line on this business's bank statement?",
  },
  { mistake: "Partners nobody has ever contacted", ask: "Why would they say yes?" },
];

/** One question to the room, which makes everyone re-read someone else's canvas as a system. */
export const DEBRIEF_QUESTION =
  "Which group's model would break fastest if their biggest key partner walked away?";
