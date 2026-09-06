/**
 * A/L ICT 2027 — Focus Areas Briefing (Step 4 of the exam-pattern-analyst
 * output), reused by both the public promo page (as free, indexable teaser
 * content) and the gated full predicted-paper page (as the complete
 * briefing). See `AL_ICT_2027_Predicted_Paper_Analysis.md` in the handoff for
 * the full Step 1-3 workings behind every rationale here.
 *
 * Never rank more than roughly a third of competencies "high" — a briefing
 * where everything is high has failed at its one job (Hard Rule from
 * `lib/ai/prompts/model-paper-engine.ts`'s Step 4). That is why this list is
 * 4 high / 8 medium / 1 low out of the syllabus's 13 examinable competencies,
 * not an even or optimistic spread.
 */

import type { ConfidenceBand } from "@/lib/types";

export interface FocusAreaEntry {
  competencyNumber: number;
  topic: string;
  band: ConfidenceBand;
  rationale: string;
}

/** Hard Rule 5 of the prompt: mandatory, never dropped, never buried. */
export const PREDICTED_PAPER_FRAMING_EN =
  "This is a probability-ranked focus list built from historical pattern analysis and syllabus weighting. It is not a leaked paper, it is not sourced from any exam board, and it is not a guarantee of what will appear on the 2027 paper.";
export const PREDICTED_PAPER_FRAMING_SI =
  "මෙය අතීත ප්‍රවණතා විශ්ලේෂණයක් සහ විෂය නිර්දේශයේ බැරකම මත පදනම්ව සකස් කළ, සම්භාවිතාව අනුව අනුපිළිවෙළ ගැස්වූ අවධානම් ලැයිස්තුවකි. මෙය කාන්දු වූ ප්‍රශ්න පත්‍රයක් නොවේ, විභාග දෙපාර්තමේන්තුවෙන් ලබාගත් එකක් නොවේ, 2027 ප්‍රශ්න පත්‍රයේ පැමිණෙන දේ පිළිබඳ සහතිකයක්ද නොවේ.";

export const AL_ICT_2027_FOCUS_AREAS: FocusAreaEntry[] = [
  {
    competencyNumber: 9,
    topic: "Algorithms & Python programming",
    band: "high",
    rationale:
      "Asked in every single supplied year — by a wide margin the most consistently tested competency, and it also carries the largest single period allocation on the syllabus. Expect 10-13 MCQs and at least one substantial Part B essay or pseudocode-tracing question.",
  },
  {
    competencyNumber: 6,
    topic: "Data communication & networking",
    band: "high",
    rationale:
      "Second-highest raw frequency and the highest recency-weight of any competency — tested heavily and recently. IP addressing, DNS, TCP/UDP and the OSI/TCP-IP models dominate within this competency.",
  },
  {
    competencyNumber: 10,
    topic: "Web development (HTML/CSS/PHP)",
    band: "high",
    rationale:
      "Large historical volume and the second-largest period allocation on the syllabus — but nearly all that volume is basic HTML tag recognition. CSS, authoring tools and PHP/MySQL are almost never tested despite a full sub-unit devoted to each. Statistically under-priced for its size — expect the exam to reach further into CSS and PHP this time.",
  },
  {
    competencyNumber: 8,
    topic: "Databases & SQL",
    band: "high",
    rationale:
      "Third-highest volume, close to proportional to its period share. ER diagrams, normalisation and SQL DDL/DML are reliably tested sub-units.",
  },
  {
    competencyNumber: 2,
    topic: "Computer evolution, hardware & memory",
    band: "medium",
    rationale:
      'Heavily tested relative to its modest period share — a perennial "easy MCQ fodder" area (memory hierarchy, CPU architecture, generations of computers), reliably present but not "due" for a jump since it is already over-represented.',
  },
  {
    competencyNumber: 7,
    topic: "Systems analysis & design (SDLC)",
    band: "medium",
    rationale:
      'Under-tested against its large period allocation — a "due" signal, and this is also the competency most likely to carry a scenario-based Part B essay question (feasibility study, SDLC model choice, testing types).',
  },
  {
    competencyNumber: 3,
    topic: "Data/number representation",
    band: "medium",
    rationale:
      "A reliable small-volume presence slightly ahead of its period share — binary/hex conversions and two's-complement questions are near-certain to reappear, as they have every year supplied.",
  },
  {
    competencyNumber: 1,
    topic: "Basic ICT concepts & societal impact",
    band: "medium",
    rationale:
      "Roughly proportional presence; frequently the vehicle for real-world scenario wrapping, so likely to reappear dressed in a current-events scenario rather than as a pure definitional MCQ.",
  },
  {
    competencyNumber: 4,
    topic: "Logic gates & digital circuits",
    band: "medium",
    rationale:
      "Exactly proportional to its period share — no signal either way, but a fixture of every supplied year (truth tables, Boolean simplification, half/full adders).",
  },
  {
    competencyNumber: 5,
    topic: "Operating systems",
    band: "medium",
    rationale:
      'Clearly under-tested relative to its period share, and has the lowest recency-weight of any core competency — a real statistical "due" signal, kept at Medium rather than High only because its absolute historical volume is thin. The real 2026 A/L paper skipped this competency entirely, sharpening rather than softening the "due" read.',
  },
  {
    competencyNumber: 12,
    topic: "ICT in business / e-commerce",
    band: "medium",
    rationale:
      "Hasn't appeared since 2023 — a 3-year gap against a roughly 2-3-year historical cycle — due on cyclical grounds, and separately carries the strongest current-events hook available (Sri Lanka AI Week 2026, the national digital-economy push). The real 2026 A/L paper also skipped this competency, the only other one besides Operating systems to do so.",
  },
  {
    competencyNumber: 13,
    topic: "New trends & future directions (AI etc.)",
    band: "medium",
    rationale:
      "Small historical footprint but the most current-events-aligned competency this cycle given the AI Week 2026 coverage — a plausible Part B essay hook even without strong historical precedent.",
  },
  {
    competencyNumber: 11,
    topic: "IoT & embedded systems",
    band: "low",
    rationale:
      "Almost no historical MCQ presence and the smallest period allocation among examinable competencies. This under-representation looks developmental — a still-young addition to the syllabus — rather than cyclical, so it is not weighted heavily, but it stays on the paper since it remains on the syllabus.",
  },
];
