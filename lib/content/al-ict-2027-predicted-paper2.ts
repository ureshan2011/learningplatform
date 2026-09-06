/**
 * A/L ICT 2027 — Predicted Paper II (structured & essay), gated to signed-in students.
 *
 * Companion to `al-ict-2027-predicted-paper1.ts` — same provenance (the
 * exam-pattern-analyst prompt run once against 25 real files), same gating
 * (`settings/predictedPaper2027.published`), same caveat on the Sinhala.
 *
 * The evidence behind Paper II is deliberately thinner than Paper I's: the
 * only genuine structured/essay evidence available was 6 sub-questions from
 * a cross-year topical compilation (2011, 2012, 2018, 2020, 2021, 2022) —
 * no standalone Paper II past papers existed in the source material at all.
 * `rationale` says so plainly on every item rather than dressing up a
 * thinner evidence base as an equally strong one.
 *
 * Uses `Question`'s sibling type `PredictedStructuredItem` (lib/types.ts) —
 * a multi-part, mark-scheme-graded shape that a single-best-answer MCQ
 * cannot represent. There is no auto-marking here: a student reads the
 * question and the mark scheme, the way a real Paper II past-paper booklet
 * works, because grading a free-text essay answer is not something this
 * platform does anywhere else either.
 */

import type { ConfidenceBand, PredictedStructuredItem } from "@/lib/types";

export const PREDICTED_PAPER2_DURATION_MINUTES = 180;
export const PREDICTED_PAPER2_PART_A_COUNT = 4;
export const PREDICTED_PAPER2_PART_B_COUNT = 6;
export const PREDICTED_PAPER2_PART_B_CHOOSE = 4;
/** Assumption, not a confirmed marking-scheme figure — see the disclosure on the gated page. */
export const PREDICTED_PAPER2_MARKS_SPLIT = { partA: 40, partB: 60, total: 100 };

function yearsIn(text: string): number[] {
  const matches = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  return Array.from(new Set(matches.map(Number))).sort((a, b) => a - b);
}

type RawItem = Omit<PredictedStructuredItem, "sourceYearsCited">;

const RAW: RawItem[] = [
  {
    id: "A1",
    part: "A",
    order: 1,
    topic: "Computer hardware & number systems",
    marks: 10,
    en: {},
    si: {},
    subparts: [
      { label: "a", commandWord: "State", marks: 3, en: "State the three steps of the fetch-execute cycle.", si: "ලබාගැනීම-ක්‍රියාත්මක කිරීමේ චක්‍රයේ (fetch-execute cycle) පියවර තුන සඳහන් කරන්න." },
      { label: "b", commandWord: "Convert", marks: 2, en: "Convert 2A₁₆ to its 8-bit binary equivalent.", si: "2A₁₆ බිට් 8ක ද්විමය අගයට පරිවර්තනය කරන්න." },
      {
        label: "c",
        commandWord: "Explain",
        marks: 3,
        en: "Explain why cache memory improves overall system performance, even though it is smaller than main memory.",
        si: "ක්ෂණික මතකය ප්‍රධාන මතකයට වඩා කුඩා වුවද, එය සමස්ත පද්ධති කාර්යක්ෂමතාව වැඩිදියුණු කරන්නේ මන්දැයි පැහැදිලි කරන්න.",
      },
      {
        label: "d",
        commandWord: "State",
        marks: 2,
        en: "State one advantage of using two's complement to represent negative numbers instead of signed magnitude.",
        si: "සෘණ සංඛ්‍යා නිරූපණය කිරීමට ලකුණු-විශාලත්වය (signed magnitude) වෙනුවට දෙකේ අනුපූරකය (two's complement) භාවිත කිරීමේ එක් වාසියක් සඳහන් කරන්න.",
      },
    ],
    markScheme:
      "(a) 1 mark each for Fetch, Decode, Execute in order. (b) 00101010 — part marks for a correct conversion method shown. (c) Full marks require mentioning locality of reference — frequently-used data kept closer to the CPU. (d) Full marks for mentioning simplified arithmetic circuitry (no separate subtractor needed) or the absence of the \"two zeros\" ambiguity.",
    confidenceBand: "medium",
    rationale:
      "Based on pattern from: the fetch-execute and number-system items appearing in nearly every supplied Paper I year, plus the 2011 and 2020 Paper II sub-questions on the fetch-execute cycle.",
  },
  {
    id: "A2",
    part: "A",
    order: 2,
    topic: "Logic gates & algorithms",
    marks: 10,
    en: {},
    si: {},
    subparts: [
      { label: "a", commandWord: "Draw", marks: 3, en: "Draw the truth table for the expression Q = A.B + A'.B.", si: "Q = A.B + A'.B ප්‍රකාශනය සඳහා සත්‍යතා වගුව අඳින්න." },
      {
        label: "b",
        commandWord: "Simplify",
        marks: 3,
        en: "Simplify the expression in (a) using Boolean algebra, showing each law used.",
        si: "(a) හි ප්‍රකාශනය බූලීය වීජ ගණිතය භාවිතයෙන් සරල කර, භාවිත කරන එක් එක් නියමය පෙන්වන්න.",
      },
      {
        label: "c",
        commandWord: "Write",
        marks: 4,
        en: "Write pseudocode for an algorithm that reads 5 numbers and outputs the largest one.",
        si: "සංඛ්‍යා 5ක් කියවා විශාලතම සංඛ්‍යාව ප්‍රතිදානය කරන ඇල්ගොරිතමයක් සඳහා ව්‍යාජ කේතයක් (pseudocode) ලියන්න.",
      },
    ],
    markScheme:
      "(a) Correct 4-row table. (b) Q simplifies to B via the distributive and complement laws — 1 mark per correctly-named law step. (c) Initialise max, loop 5 times comparing and updating max, print max — part marks for a correct loop structure even if variable naming is imperfect.",
    confidenceBand: "medium",
    rationale: "Based on pattern from: Boolean-simplification and code-tracing items appearing in nearly every supplied year.",
  },
  {
    id: "A3",
    part: "A",
    order: 3,
    topic: "Networking & ICT law",
    marks: 10,
    en: {},
    si: {},
    subparts: [
      {
        label: "a",
        commandWord: "State",
        marks: 2,
        en: "State the layer of the OSI reference model responsible for logical addressing and routing.",
        si: "තාර්කික ලිපින කිරීම සහ මාර්ග නිර්ණය සඳහා වගකිව යුතු OSI ආදර්ශයේ ස්ථරය සඳහන් කරන්න.",
      },
      {
        label: "b",
        commandWord: "State",
        marks: 3,
        en: "A network is assigned the block 192.168.10.0/26. State the maximum number of usable host addresses in this subnet.",
        si: "ජාලයකට 192.168.10.0/26 කුට්ටිය පවරා ඇත. මෙම උපජාලයේ භාවිත කළ හැකි උපරිම ධාරක ලිපින ගණන සඳහන් කරන්න.",
      },
      {
        label: "c",
        commandWord: "Explain",
        marks: 3,
        en:
          "A school has started publishing students' names and marks on a public results page. Explain, with reference to the Personal Data Protection Act, one obligation this creates for the school.",
        si:
          "පාසලක් සිසුන්ගේ නම් සහ ලකුණු ප්‍රසිද්ධ ප්‍රතිඵල පිටුවක ප්‍රකාශයට පත් කිරීම ආරම්භ කර ඇත. පුද්ගලික දත්ත ආරක්ෂණ පනතට අනුව මෙය පාසලට ඇති කරන එක් වගකීමක් පැහැදිලි කරන්න.",
      },
      { label: "d", commandWord: "State", marks: 2, en: "State one function of a firewall.", si: "ගිනි පවුරක එක් කාර්යයක් සඳහන් කරන්න." },
    ],
    markScheme:
      "(a) Network layer. (b) /26 gives 2^6 = 64 addresses, minus network and broadcast = 62. (c) Accept consent/justification for collecting or publishing personal data, or a data-minimisation/security obligation — this sub-question has no direct past-paper precedent, so mark generously for any defensible PDPA-linked reasoning. (d) Any of: filtering traffic by rule, blocking unauthorised access, monitoring traffic.",
    confidenceBand: "medium",
    rationale: "Based on pattern from: OSI-layer and subnetting items across supplied years, plus the Personal Data Protection Act current-events hook.",
  },
  {
    id: "A4",
    part: "A",
    order: 4,
    topic: "Databases & web development",
    marks: 10,
    en: {},
    si: {},
    subparts: [
      {
        label: "a",
        commandWord: "State",
        marks: 2,
        en:
          "A Book table has columns BookID, Title, AuthorID, and an Author table has AuthorID, AuthorName. State the cardinality of the relationship between Author and Book if one author can write many books but each book has exactly one author.",
        si:
          "Author සහ Book අතර සම්බන්ධතාවයේ cardinality සඳහන් කරන්න — එක් කර්තෘවරයෙකුට පොත් රාශියක් ලිවිය හැකි නමුත් එක් පොතකට හරියටම එක් කර්තෘවරයෙකු පමණක් සිටින විට.",
      },
      {
        label: "b",
        commandWord: "Write",
        marks: 3,
        en: 'Write an SQL statement to insert a new author with AuthorID 7 and AuthorName "Kumari Silva" into the Author table.',
        si: 'Author වගුවට AuthorID 7 සහ AuthorName "Kumari Silva" ලෙස නව කර්තෘවරයෙකු ඇතුළත් කිරීමට SQL ප්‍රකාශයක් ලියන්න.',
      },
      {
        label: "c",
        commandWord: "Name & explain",
        marks: 3,
        en:
          "The Book table currently stores the author's name directly instead of using AuthorID, causing the same name to be re-typed for every book by that author. Name the normal form violated and explain why.",
        si:
          "Book වගුව දැනට AuthorID වෙනුවට කර්තෘවරයාගේ නම කෙලින්ම ගබඩා කරන අතර, එම කර්තෘවරයාගේ සෑම පොතක් සඳහාම එම නම නැවත ටයිප් කිරීමට සිදු වේ. උල්ලංඝනය වන සාමාන්‍ය ස්වරූපය (normal form) නම් කර එය මන්දැයි පැහැදිලි කරන්න.",
      },
      {
        label: "d",
        commandWord: "Write",
        marks: 2,
        en: 'Write the HTML tag pair needed to make the text "Available Now" appear bold.',
        si: '"Available Now" යන පෙළ තදකුරු (bold) ලෙස පෙනෙන පරිදි අවශ්‍ය HTML ටැග යුගල ලියන්න.',
      },
    ],
    markScheme:
      "(a) One-to-many. (b) INSERT INTO Author (AuthorID, AuthorName) VALUES (7, 'Kumari Silva'); — part marks for correct structure even with minor syntax slips. (c) Accept \"not in a proper normal form due to repeating/redundant data\" reasoning even without exact 2NF/3NF naming, since this is a compound scenario. (d) <b>Available Now</b> or <strong>Available Now</strong>.",
    confidenceBand: "high",
    rationale: "Based on pattern from: SQL, ER-diagram and HTML items across supplied years.",
  },
  {
    id: "B1",
    part: "B",
    order: 1,
    topic: "Systems analysis & design (SDLC)",
    marks: 15,
    en: { scenario: "A small tuition institute currently tracks student attendance on paper and wants to replace this with a computerised system." },
    si: { scenario: "කුඩා පන්තියක් දැනට සිසුන්ගේ පැමිණීම කඩදාසි මත සටහන් කරන අතර, එය පරිගණකගත පද්ධතියකින් ප්‍රතිස්ථාපනය කිරීමට කැමතිය." },
    subparts: [
      { label: "a", commandWord: "List", marks: 6, en: "List three stakeholders in this project and briefly state one responsibility of each." },
      {
        label: "b",
        commandWord: "Describe",
        marks: 6,
        en: "Describe two types of feasibility study the institute should carry out before proceeding, and explain what each would check for.",
      },
      { label: "c", commandWord: "Recommend", marks: 3, en: "Recommend one SDLC model (Waterfall, Spiral or Agile) for this project, with a justification." },
    ],
    markScheme:
      "Command words used: List, Describe, Recommend — matching the observed Paper II pattern of recall at low marks rising to justification at the top. No supplied past-paper Part B precedent exists for this exact scenario; mark on the quality of reasoning shown.",
    confidenceBand: "medium",
    rationale:
      'Based on pattern from: SDLC/feasibility items across supplied years; Systems analysis & design is the competency most statistically "due" for a full essay question.',
  },
  {
    id: "B2",
    part: "B",
    order: 2,
    topic: "Operating systems",
    marks: 15,
    en: {},
    si: {},
    subparts: [
      {
        label: "a",
        commandWord: "Describe",
        marks: 6,
        en: 'Describe, using the seven-state process transition model, what happens to a process when it is moved from the "Running" state to the "Waiting" state.',
      },
      {
        label: "b",
        commandWord: "Explain",
        marks: 5,
        en: "Explain the need for virtual memory in a computer that runs several large applications simultaneously with limited physical RAM.",
      },
      { label: "c", commandWord: "Distinguish", marks: 4, en: "Distinguish between multiprogramming and time-sharing." },
    ],
    markScheme:
      "No supplied Paper II evidence touches this competency at Part-B depth — the thinnest evidence base of any unit in the Step 2 table. Included to keep Operating systems represented per the \"cover full breadth\" rule; read its confidence as closer to low-medium than a typical Medium item.",
    confidenceBand: "medium",
    rationale:
      'Based on pattern from: Operating systems\' low historical volume and "due" ranking in Step 4; no direct Part B precedent exists in the supplied evidence, so this question is more speculative than others.',
  },
  {
    id: "B3",
    part: "B",
    order: 3,
    topic: "ICT in business / e-commerce & new trends",
    marks: 15,
    en: {
      scenario:
        "A small garment exporter is considering using an AI-based tool to forecast seasonal demand and is exploring selling directly to overseas customers through an online marketplace instead of only through wholesalers.",
    },
    si: {
      scenario:
        "කුඩා ඇඟලුම් අපනයනකරුවෙකු, කන්නානුකූල ඉල්ලුම පුරෝකථනය කිරීමට AI-පාදක මෙවලමක් භාවිතා කිරීම සලකා බලමින් සිටින අතර, තොග වෙළෙන්දන් හරහා පමණක් නොව මාර්ගගත වෙළඳපොලක් හරහා විදේශ පාරිභෝගිකයන්ට කෙලින්ම විකිණීමද සොයා බලමින් සිටී.",
    },
    subparts: [
      {
        label: "a",
        commandWord: "Identify",
        marks: 4,
        en: "Identify the type of e-business model this represents if the exporter sells directly to overseas households, and explain your reasoning.",
      },
      { label: "b", commandWord: "Discuss", marks: 7, en: "Discuss two advantages and two risks of adopting an AI-based demand-forecasting tool for this business." },
      {
        label: "c",
        commandWord: "State",
        marks: 4,
        en: "State one data-privacy obligation the exporter would need to consider when storing overseas customers' personal details.",
      },
    ],
    markScheme:
      "No supplied Part-B precedent for either competency; this question exists mainly to cover the AI Week 2026 / digital-economy current-events relevance flagged in Step 3, not an observed essay pattern. Mark on defensible reasoning — e.g. a B2C export model for (a), PDPA-linked reasoning for (c).",
    confidenceBand: "medium",
    rationale: "Real-world hook: Sri Lanka AI Week 2026 and the national digital-economy push; strong current-events alignment but thin direct past-paper precedent.",
  },
  {
    id: "B4",
    part: "B",
    order: 4,
    topic: "Algorithms & Python programming",
    marks: 15,
    en: {
      scenario:
        "A school wants a program that reads the marks (out of 100) of 30 students and outputs how many passed (marks ≥ 40), how many failed, and the class average.",
    },
    si: {
      scenario:
        "පාසලකට සිසුන් 30 දෙනෙකුගේ ලකුණු (100න්) කියවා, සමත් වූ සංඛ්‍යාව (ලකුණු ≥ 40), අසමත් වූ සංඛ්‍යාව සහ පන්ති සාමාන්‍යය ප්‍රතිදානය කරන වැඩසටහනක් අවශ්‍යය.",
    },
    subparts: [
      { label: "a", commandWord: "Draw", marks: 8, en: "Draw a flowchart for this algorithm." },
      { label: "b", commandWord: "Write", marks: 7, en: "Write Python code implementing the same algorithm." },
    ],
    markScheme:
      "Mark on a correct read-loop over 30 students, correct pass/fail counters against the 40-mark boundary, and a correctly-computed average — part marks for a logically sound flowchart or code even with minor syntax slips.",
    confidenceBand: "high",
    rationale: "Based on pattern from: algorithm design being the single most consistently tested competency across all supplied years.",
  },
  {
    id: "B5",
    part: "B",
    order: 5,
    topic: "Data communication & networking / IoT",
    marks: 15,
    en: {
      scenario: "A homeowner wants to set up a home network connecting a laptop, a smart TV, and an IoT-based smart door lock, all sharing one Internet connection.",
    },
    si: {
      scenario:
        "නිවසක හිමිකරුවෙකු ලැප්ටොප් පරිගණකයක්, ස්මාර්ට් රූපවාහිනියක් සහ IoT-පාදක ස්මාර්ට් දොර අගුලක් එකම අන්තර්ජාල සම්බන්ධතාවක් බෙදාගනිමින් නිවාස ජාලයක් පිහිටුවීමට කැමතිය.",
    },
    subparts: [
      { label: "a", commandWord: "Draw", marks: 5, en: "Draw a simple diagram showing how these devices would connect via a router to the ISP." },
      { label: "b", commandWord: "Explain", marks: 6, en: "Explain one security risk specific to the IoT smart lock, and one measure to reduce that risk." },
      { label: "c", commandWord: "State", marks: 4, en: "State the role of the ISP in this setup." },
    ],
    markScheme:
      "Mark on a correctly-drawn router-centred diagram; a plausible IoT-specific risk (e.g. weak default credentials, unpatched firmware) paired with a real mitigation (e.g. changing the default password, keeping firmware updated); a correct description of the ISP as the gateway to the wider Internet.",
    confidenceBand: "medium",
    rationale:
      "Based on pattern from: networking's strong historical presence combined with IoT's syllabus presence despite thin evidence — paired together so IoT is tested without over-weighting it alone.",
  },
  {
    id: "B6",
    part: "B",
    order: 6,
    topic: "Web development (HTML/CSS/PHP)",
    marks: 15,
    en: { scenario: "The tuition institute from question B1 also wants a simple website where prospective students can view course details and submit an inquiry form." },
    si: { scenario: "B1 ප්‍රශ්නයේ සඳහන් පන්තියටද අපේක්ෂිත සිසුන්ට පාඨමාලා විස්තර බලා විමසුම් පෝරමයක් ඉදිරිපත් කළ හැකි සරල වෙබ් අඩවියක් අවශ්‍යය." },
    subparts: [
      { label: "a", commandWord: "List", marks: 5, en: "List the HTML elements needed to build the inquiry form (name, email, course selection, submit button)." },
      { label: "b", commandWord: "Explain", marks: 4, en: "Explain how CSS could be used to make this form visually consistent across all pages of the site." },
      { label: "c", commandWord: "Describe", marks: 6, en: "Describe, in general terms, how PHP and MySQL would be used to store a submitted inquiry in a database." },
    ],
    markScheme:
      "Mark on naming the right form elements (text input, email input, a select or radio group, submit button); a correct description of a shared or external stylesheet for visual consistency; a correct general description of a PHP script reading $_POST data and inserting it via an SQL INSERT into MySQL.",
    confidenceBand: "high",
    rationale: "Based on pattern from: web-development items being consistently present, with the essay format allowing coverage of the under-tested CSS/PHP sub-units flagged in Step 4.",
  },
];

export const AL_ICT_2027_PREDICTED_PAPER2: PredictedStructuredItem[] = RAW.map((item) => ({
  ...item,
  sourceYearsCited: yearsIn(item.rationale),
}));

export type { ConfidenceBand };
