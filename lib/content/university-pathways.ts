/**
 * Where A/L ICT can lead: state university degree programmes an ICT
 * background makes a student eligible for, with Z-score cutoffs from the
 * UGC's own most recently published admission round.
 *
 * Every figure and eligibility rule here is transcribed from two official
 * UGC / Ministry of Higher Education documents (see SOURCES in the page),
 * not estimated. Z-scores are reproduced as a MIN–MAX range across the
 * districts that had a qualifying candidate that year, rather than a single
 * number — Sri Lanka's admission system runs on a district quota (not one
 * island-wide cutoff), so a single figure would misrepresent it. NQC
 * ("No Qualified Candidates") districts are excluded from the range, not
 * treated as zero.
 *
 * This still goes stale every year by design — see DisclaimerSection in the
 * page itself. Static, not Firestore: fixed reference content the same way
 * /command-words and /papers are.
 */

export interface University {
  name: string;
  zMin: number;
  zMax: number;
  note?: string;
}

export interface DegreeProgram {
  id: string;
  name: string;
  shortLabel: string;
  universities: University[];
  eligibilitySummary: string;
  sourceRef: string;
  /** Which toggles in the eligibility checker this program lights up for. */
  matches: (flags: EligibilityFlags) => boolean;
}

export interface EligibilityFlags {
  technologyStream: boolean;
  ictCredit: boolean;
  mathsOrPhysicsCredit: boolean;
  physicalScienceWithICT: boolean;
}

export const DEGREE_PROGRAMS: DegreeProgram[] = [
  {
    id: "bict",
    name: "Bachelor of Information & Communication Technology (BICT)",
    shortLabel: "BICT — Technology stream",
    eligibilitySummary:
      "The direct match for the Technology stream: Science for Technology + Engineering Technology or Biosystems Technology + ICT as the third subject. Rajarata and the Vavuniya Campus also run a second admission list open to a Credit pass in ICT (or several other subjects) from any stream — see the source for the exact list.",
    sourceRef: "UGC 2024/2025 admissions round, course codes 104A–104U; UGC Part Two §4.6",
    universities: [
      { name: "University of Colombo", zMin: 1.13, zMax: 1.40 },
      { name: "University of Sri Jayewardenepura", zMin: 1.89, zMax: 2.23 },
      { name: "University of Kelaniya", zMin: 2.05, zMax: 2.49 },
      { name: "University of Ruhuna", zMin: 1.77, zMax: 1.99 },
      { name: "Eastern University, Sri Lanka", zMin: 0, zMax: 0, note: "offered; figures not captured this round" },
      { name: "South Eastern University of Sri Lanka", zMin: 1.59, zMax: 1.71 },
      { name: "Rajarata University of Sri Lanka", zMin: 1.31, zMax: 1.61 },
      { name: "Vavuniya Campus, University of Jaffna", zMin: 0.56, zMax: 1.27 },
      { name: "Uva Wellassa University of Sri Lanka", zMin: 1.41, zMax: 1.72 },
    ],
    matches: (f) => f.technologyStream || f.ictCredit,
  },
  {
    id: "information-systems",
    name: "Bachelor of Information Systems (BIS)",
    shortLabel: "Information Systems (UCSC)",
    eligibilitySummary:
      "Needs a Credit (C) pass in at least TWO subjects from a long list that includes ICT — alongside Higher/Combined Maths, Physics, Chemistry, Accounting, Business Statistics, Economics, Business Studies, Biology, Logic & Scientific Method, Civil Technology, Geography, Mechanical Technology and Electrical/Electronic & IT. English medium only.",
    sourceRef: "UGC 2024/2025 admissions round, course codes 096T/096C/096L; UGC Part Two, Information Systems section",
    universities: [
      { name: "University of Colombo School of Computing (UCSC)", zMin: 1.79, zMax: 2.23 },
      { name: "University of Sri Jayewardenepura", zMin: 1.74, zMax: 1.79 },
      { name: "Sabaragamuwa University of Sri Lanka", zMin: 0.85, zMax: 1.60 },
    ],
    matches: (f) => f.ictCredit,
  },
  {
    id: "computer-science",
    name: "Bachelor of Computer Science",
    shortLabel: "Computer Science",
    eligibilitySummary:
      "Needs a Credit (C) in Combined Maths, Physics or Higher Maths first — that's the anchor, ICT alone does not qualify — plus an 'S' pass in two more of Combined/Higher Maths, Physics, Chemistry, ICT or Mathematics. Confirmed for UCSC, Jaffna and Ruhuna; also offered at Sri Jayewardenepura, Kelaniya and the Trincomalee Campus under what may be a different rule — check the official handbook for those three.",
    sourceRef: "UGC 2024/2025 admissions round, course codes 012T/012C/012D/012E/012F/012W; UGC Part Two §4.5",
    universities: [
      { name: "UCSC (University of Colombo)", zMin: 1.66, zMax: 1.77 },
      { name: "University of Sri Jayewardenepura", zMin: 1.58, zMax: 1.60, note: "eligibility rule to confirm" },
      { name: "University of Kelaniya", zMin: 1.57, zMax: 1.62, note: "eligibility rule to confirm" },
      { name: "University of Jaffna", zMin: 1.18, zMax: 1.40 },
      { name: "University of Ruhuna", zMin: 1.41, zMax: 1.55 },
      { name: "Trincomalee Campus, Eastern University", zMin: 0.46, zMax: 1.38, note: "eligibility rule to confirm" },
    ],
    matches: (f) => f.mathsOrPhysicsCredit,
  },
  {
    id: "physical-science-ict",
    name: "Physical Science – ICT",
    shortLabel: "Physical Science – ICT",
    eligibilitySummary:
      "A Physical Science stream track built around an ICT specialisation — for students who took Combined/Higher Maths and Chemistry or Physics, with ICT as the third subject.",
    sourceRef: "UGC 2024/2025 admissions round, course codes 108C/108D",
    universities: [
      { name: "University of Sri Jayewardenepura", zMin: 1.10, zMax: 1.23 },
      { name: "University of Kelaniya", zMin: 0.04, zMax: 1.32 },
    ],
    matches: (f) => f.physicalScienceWithICT,
  },
  {
    id: "applied-sciences",
    name: "Applied Sciences (Physical Science), ICT combination",
    shortLabel: "Applied Sciences (incl. Computer Science & Technology)",
    eligibilitySummary:
      "Needs 'S' grades in three subjects that must include (Combined or Higher Maths) AND (Chemistry or Physics) — ICT is one accepted third subject. Sabaragamuwa's version of this includes a named Computer Science & Technology special degree.",
    sourceRef: "UGC 2024/2025 admissions round, course codes 015K/015L/015M/015R; UGC Part Two §4.7",
    universities: [
      { name: "Rajarata University of Sri Lanka", zMin: 0.97, zMax: 1.02 },
      { name: "Sabaragamuwa University of Sri Lanka (incl. Computer Science & Technology)", zMin: 1.03, zMax: 1.04 },
      { name: "Vavuniya Campus, University of Jaffna (Applied Maths & Computing)", zMin: 0.72, zMax: 1.06 },
      { name: "Wayamba University of Sri Lanka", zMin: 0.92, zMax: 1.01 },
    ],
    matches: (f) => f.physicalScienceWithICT,
  },
];

/** Degrees where ICT is accepted as one qualifying subject among several, but isn't the headline match — mentioned for completeness, no Z-score table. */
export const ALSO_WORTH_KNOWING: Array<{ name: string; note: string; sourceRef: string }> = [
  {
    name: "Engineering Technology (ET) & Biosystems Technology (BST)",
    note: "The other two Technology-stream degrees, offered alongside BICT at most of the same universities — the natural fallback/alternative preference for a Technology stream student.",
    sourceRef: "UGC 2024/2025 admissions round, course codes 102A–102U and 103A–103U",
  },
  {
    name: "Quantity Surveying (University of Moratuwa)",
    note: "ICT counts as one of the accepted second subjects alongside a Combined/Higher Maths credit.",
    sourceRef: "UGC Part Two §6.1",
  },
  {
    name: "Town & Country Planning (University of Moratuwa)",
    note: "ICT is one of many accepted subjects for the second-subject requirement.",
    sourceRef: "UGC Part Two §6.3",
  },
  {
    name: "Architecture / Landscape Architecture (University of Moratuwa)",
    note: "ICT is accepted as a supporting subject — but portfolio and aptitude testing matter far more here than the Z-score.",
    sourceRef: "UGC Part Two §7.1, §7.3",
  },
  {
    name: "Law",
    note: "ICT is one of many accepted subjects across all streams, alongside the required English O/L credit.",
    sourceRef: "UGC Part Two §8",
  },
];
