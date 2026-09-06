/**
 * A/L ICT 2027 — Predicted Paper I (50-question MCQ), gated to signed-in students.
 *
 * Static, not Firestore — same posture as `al-ict-2026-paper1.ts`, and for the
 * same reason: this is fixed reference content, reviewed once in the PR that
 * ships it rather than through a per-question Firestore workflow. Unlike the
 * 2026 file, this is NOT a real past paper. It is the output of the
 * exam-pattern-analyst prompt in `lib/ai/prompts/model-paper-engine.ts`, run
 * once against 25 real past-paper/syllabus files (see
 * `AL_ICT_2027_Predicted_Paper_Analysis.md` in the handoff for the full
 * write-up, evidence table and web-research citations behind every question
 * below) — a probability-ranked focus list built from historical pattern and
 * syllabus weighting, not a leaked paper and not a guarantee. `confidenceBand`
 * and `rationale` on every question exist so a student or teacher can see
 * *why* a question is here, not just what it asks — dropping that context
 * would turn a disclosed prediction into something that reads like a leak.
 *
 * Visibility is gated by `settings/predictedPaper2027.published` (see
 * `lib/types.ts`'s `PredictedPaperSettings`), toggled from
 * `/teacher/predicted-paper` — never shown to a student until the teacher has
 * read it over once. That matters especially for the Sinhala wording here:
 * it was drafted by the same analysis pass and has not yet had a
 * native-speaking subject teacher's check, exactly the caveat
 * `al-ict-2026-paper1.ts` never has to carry because its Sinhala came from a
 * real exam paper, not a first-draft AI translation.
 */

import type { ConfidenceBand } from "@/lib/types";

export interface PredictedMcqQuestion {
  id: number;
  /** NIE competency number, 1-13 — matches the Step 2 scoring table in the analysis. */
  competencyNumber: number;
  topic: string;
  en: { stem: string; options: [string, string, string, string, string] };
  si: { stem: string; options: [string, string, string, string, string] };
  /** A handful of questions are built around a short code/pseudocode listing — rendered as its own block between the stem and the options. */
  code?: string;
  /** 0-based index into `options`. */
  correctIndex: number;
  confidenceBand: ConfidenceBand;
  rationale: string;
  sourceYearsCited: number[];
}

export const PREDICTED_PAPER1_TITLE_EN = "A/L ICT 2027 — Predicted Paper I (MCQ)";
export const PREDICTED_PAPER1_TITLE_SI = "උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය 2027 — පුරෝකථනය කළ I ප්‍රශ්න පත්‍රය";
export const PREDICTED_PAPER1_DURATION_MINUTES = 120;
export const PREDICTED_PAPER1_QUESTION_COUNT = 50;
export const PREDICTED_PAPER_EXAM_YEAR_TARGET = 2027;

/** Every 4-digit year mentioned in a rationale — kept computed rather than hand-duplicated, so the number shown next to a question can never drift from the text that justifies it. */
function yearsIn(text: string): number[] {
  const matches = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  return Array.from(new Set(matches.map(Number))).sort((a, b) => a - b);
}

const COMPETENCY_TOPIC: Record<number, string> = {
  1: "Basic ICT concepts & societal impact",
  2: "Computer evolution, hardware & memory",
  3: "Data/number representation",
  4: "Logic gates & digital circuits",
  5: "Operating systems",
  6: "Data communication & networking",
  7: "Systems analysis & design (SDLC)",
  8: "Databases & SQL",
  9: "Algorithms & Python programming",
  10: "Web development (HTML/CSS/PHP)",
  11: "IoT & embedded systems",
  12: "ICT in business / e-commerce",
  13: "New trends & future directions (AI etc.)",
};

type RawQuestion = Omit<PredictedMcqQuestion, "topic" | "sourceYearsCited">;

const RAW: RawQuestion[] = [
  {
    id: 1,
    competencyNumber: 1,
    en: {
      stem: "Which of the following best distinguishes data from information?",
      options: [
        "Data is always numeric, information is always text",
        "Information is raw and unprocessed, data is processed",
        "Data is raw facts; information is data that has been processed to be meaningful",
        "Data and information are interchangeable terms with no real difference",
        "Information is stored in databases while data is not",
      ],
    },
    si: {
      stem: "පහත සඳහන් ඒවායින් දත්ත (data) සහ තොරතුරු (information) අතර වෙනස වඩාත් හොඳින් පැහැදිලි කරන්නේ කුමක්ද?",
      options: [
        "දත්ත සැමවිටම සංඛ්‍යාත්මක වන අතර තොරතුරු සැමවිටම පෙළකි",
        "තොරතුරු අමු වන අතර දත්ත සකසන ලද්දකි",
        "දත්ත යනු අමු කරුණු වන අතර තොරතුරු යනු අර්ථවත් වන සේ සකසන ලද දත්ත වේ",
        "දත්ත සහ තොරතුරු අතර සැබෑ වෙනසක් නොමැත",
        "තොරතුරු දත්ත සමුදායක ගබඩා වන අතර දත්ත එසේ නොවේ",
      ],
    },
    correctIndex: 2,
    confidenceBand: "medium",
    rationale: 'Pattern seen in: 2011, 2012, 2013 "data vs information" statement items.',
  },
  {
    id: 2,
    competencyNumber: 1,
    en: {
      stem:
        "A hospital wants to predict patient readmission risk from years of treatment records. This is best described as an application of ICT to which domain?",
      options: ["Tourism", "Engineering", "Media", "Healthcare", "Law enforcement"],
    },
    si: {
      stem:
        "රෝහලක් වසර ගණනාවක ප්‍රතිකාර වාර්තා ඇසුරින් රෝගීන් නැවත ඇතුළත් වීමේ අවදානම පුරෝකථනය කිරීමට කැමතිය. මෙය ICT යෙදෙන කුමන ක්ෂේත්‍රයක ලෙස වඩාත් හොඳින් විස්තර කළ හැකිද?",
      options: ["සංචාරක", "ඉංජිනේරු", "මාධ්‍ය", "සෞඛ්‍ය", "නීතිය"],
    },
    correctIndex: 3,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2012, 2017 ICT-application-domain items.",
  },
  {
    id: 3,
    competencyNumber: 1,
    en: {
      stem:
        "A school stores students' exam marks online and a data-protection regulator now requires it to justify why it collects each field. Which recently-enforced Sri Lankan law makes this obligation explicit?",
      options: [
        "Right to Information Act",
        "Computer Crimes Act",
        "Personal Data Protection Act",
        "Electronic Transactions Act",
        "Intellectual Property Act",
      ],
    },
    si: {
      stem:
        "පාසලක් සිසුන්ගේ විභාග ලකුණු අන්තර්ජාලයේ ගබඩා කරන අතර, එක් එක් දත්ත ක්ෂේත්‍රය රැස් කරන්නේ මන්දැයි යුක්තිගත කිරීමට දැන් නියාමකයෙකු අවශ්‍ය කරයි. මෙම වගකීම පැහැදිලිව සඳහන් කරන මෑතකදී බලාත්මක වූ ශ්‍රී ලාංකික නීතිය කුමක්ද?",
      options: [
        "තොරතුරු දැනගැනීමේ අයිතිය පිළිබඳ පනත",
        "පරිගණක අපරාධ පනත",
        "පුද්ගලික දත්ත ආරක්ෂණ පනත",
        "ඉලෙක්ට්‍රොනික ගනුදෙනු පනත",
        "බුද්ධිමය දේපළ පනත",
      ],
    },
    correctIndex: 2,
    confidenceBand: "medium",
    rationale:
      "Real-world hook: the Personal Data Protection Act reached full enforcement in March 2025; no direct past-paper precedent was found in the supplied years.",
  },
  {
    id: 4,
    competencyNumber: 3,
    en: {
      stem: "Which of the following is a valid two's complement representation of -6 using 5 bits?",
      options: ["00110", "11010", "10110", "11001", "01010"],
    },
    si: {
      stem: "බිටු 5 ක් භාවිතයෙන් −6 සඳහා වලංගු දෙකේ අනුපූරකය (two's complement) වන්නේ පහත සඳහන් කුමක්ද?",
      options: ["00110", "11010", "10110", "11001", "01010"],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2011-2025 — two's-complement conversion is asked almost every year.",
  },
  {
    id: 5,
    competencyNumber: 3,
    en: {
      stem: "Convert the hexadecimal number 2F₁₆ to its binary equivalent.",
      options: ["00101111", "00111101", "01011110", "00110111", "01001111"],
    },
    si: {
      stem: "දහසයේ (hexadecimal) ඉලක්කම 2F₁₆ ද්විමය (binary) අගයට පරිවර්තනය කරන්න.",
      options: ["00101111", "00111101", "01011110", "00110111", "01001111"],
    },
    correctIndex: 0,
    confidenceBand: "medium",
    rationale: "Pattern seen in: every supplied year — hex/binary/octal conversion is the single most reliable question type in this competency.",
  },
  {
    id: 6,
    competencyNumber: 3,
    en: {
      stem:
        "A sensor outputs its readings using 7-bit ASCII. Which of the following correctly explains why Unicode may be required instead for a multilingual application?",
      options: [
        "Unicode is faster to transmit than ASCII",
        "ASCII cannot represent characters outside the basic English alphabet and symbols",
        "ASCII uses more storage per character than Unicode",
        "Unicode is only used for numbers, not text",
        "ASCII cannot represent numbers",
      ],
    },
    si: {
      stem:
        "සංවේදකයක් තම කියවීම් 7-බිට් ASCII භාවිතයෙන් ප්‍රතිදානය කරයි. බහුභාෂා යෙදුමක් සඳහා ASCII වෙනුවට Unicode අවශ්‍ය විය හැක්කේ මන්දැයි නිවැරදිව පැහැදිලි කරන්නේ කුමක්ද?",
      options: [
        "Unicode ASCII ට වඩා වේගයෙන් සම්ප්‍රේෂණය වේ",
        "ASCII මූලික ඉංග්‍රීසි අකුරු හා සංකේත හැර වෙනත් අක්ෂර නිරූපණය කළ නොහැක",
        "ASCII එක් අක්ෂරයකට Unicode ට වඩා ගබඩාව භාවිත කරයි",
        "Unicode භාවිත වන්නේ අංක සඳහා පමණි",
        "ASCII මගින් අංක නිරූපණය කළ නොහැක",
      ],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2011, 2018 character-representation items.",
  },
  {
    id: 7,
    competencyNumber: 4,
    en: {
      stem: "Simplify the Boolean expression: A.B + A.B'",
      options: ["A", "B", "A + B", "A.B", "1"],
    },
    si: {
      stem: "A.B + A.B' යන බූලීය ප්‍රකාශනය සරල කරන්න.",
      options: ["A", "B", "A + B", "A.B", "1"],
    },
    correctIndex: 0,
    confidenceBand: "medium",
    rationale: "Pattern seen in: every supplied year — Boolean simplification is a fixture.",
  },
  {
    id: 8,
    competencyNumber: 4,
    en: {
      stem: "How many rows appear in the truth table of a logic circuit with 3 inputs?",
      options: ["3", "6", "8", "9", "16"],
    },
    si: {
      stem: "ආදාන 3ක් සහිත තාර්කික පරිපථයක සත්‍යතා වගුවක (truth table) පේළි කීයක් තිබේද?",
      options: ["3", "6", "8", "9", "16"],
    },
    correctIndex: 2,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2013, 2024 logic-circuit items.",
  },
  {
    id: 9,
    competencyNumber: 4,
    en: {
      stem: "Which single universal gate can be used, on its own, to construct any other basic logic gate?",
      options: ["AND only", "OR only", "NOT only", "NAND", "XOR"],
    },
    si: {
      stem: "වෙනත් ඕනෑම මූලික තාර්කික ද්වාරයක් තනිවම තැනීමට භාවිත කළ හැකි විශ්වීය ද්වාරය (universal gate) කුමක්ද?",
      options: ["AND only", "OR only", "NOT only", "NAND", "XOR"],
    },
    correctIndex: 3,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2013, 2018, 2024 universal-gate items.",
  },
  {
    id: 10,
    competencyNumber: 2,
    en: {
      stem: "A microprocessor's clock speed is typically measured in which unit?",
      options: ["Bytes", "Hertz", "Bits per second", "Watts", "Bauds"],
    },
    si: {
      stem: "ක්ෂුද්‍ර සකසනයක (microprocessor) ඔරලෝසු වේගය (clock speed) සාමාන්‍යයෙන් මනිනු ලබන්නේ කුමන ඒකකයෙන්ද?",
      options: ["Bytes", "Hertz", "Bits per second", "Watts", "Bauds"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2013, 2017 clock-speed items.",
  },
  {
    id: 11,
    competencyNumber: 2,
    en: {
      stem: "Which memory type retains its contents even when power is switched off?",
      options: ["RAM", "Cache memory", "Registers", "ROM", "DRAM"],
    },
    si: {
      stem: "විදුලිය විසන්ධි කළ විටත් අන්තර්ගතය රඳවා ගන්නා මතක වර්ගය කුමක්ද?",
      options: ["RAM", "Cache memory", "Registers", "ROM", "DRAM"],
    },
    correctIndex: 3,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2011, 2019, 2020, 2025 volatile-vs-non-volatile items.",
  },
  {
    id: 12,
    competencyNumber: 2,
    en: {
      stem: "In the Von Neumann architecture, which component is responsible for decoding an instruction and generating control signals?",
      options: ["ALU", "Control Unit", "Registers", "Main memory", "Data bus"],
    },
    si: {
      stem:
        "වොන් නියුමාන් ගෘහනිර්මාණයේ (Von Neumann architecture), උපදෙසක් විකේතනය කර පාලන සංඥා උත්පාදනය කිරීමට වගකිව යුත්තේ කුමන අංගයද?",
      options: ["ALU", "Control Unit", "Registers", "Main memory", "Data bus"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2012, 2019, 2025 CPU-component items.",
  },
  {
    id: 13,
    competencyNumber: 2,
    en: {
      stem: "Which technology most directly enabled the dramatic size reduction of third-generation computers?",
      options: ["Vacuum tubes", "Transistors", "Integrated Circuits", "VLSI", "Optical fibre"],
    },
    si: {
      stem: "තෙවන පරම්පරාවේ පරිගණකවල ප්‍රමාණය සැලකිය යුතු ලෙස අඩුවීමට වඩාත් සෘජුව හේතු වූ තාක්ෂණය කුමක්ද?",
      options: ["Vacuum tubes", "Transistors", "Integrated Circuits", "VLSI", "Optical fibre"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2011, 2016 generation-of-computers items.",
  },
  {
    id: 14,
    competencyNumber: 2,
    en: {
      stem: "Which of the following statements about cache memory is correct?",
      options: [
        "Cache memory is slower than main memory",
        "Cache memory is a type of secondary storage",
        "Cache memory sits between the CPU and main memory to speed up access to frequently used data",
        "Cache memory is non-volatile",
        "Cache memory has a larger capacity than main memory",
      ],
    },
    si: {
      stem: "ක්ෂණික මතකය (cache memory) පිළිබඳ පහත සඳහන් ප්‍රකාශවලින් නිවැරදි වන්නේ කුමක්ද?",
      options: [
        "ක්ෂණික මතකය ප්‍රධාන මතකයට වඩා මන්දගාමීය",
        "ක්ෂණික මතකය ද්විතීයික ගබඩාවකි",
        "ක්ෂණික මතකය CPU සහ ප්‍රධාන මතකය අතර පිහිටා නිතර භාවිත දත්තවලට ප්‍රවේශය වේගවත් කරයි",
        "ක්ෂණික මතකය අස්ථිර නොවේ",
        "ක්ෂණික මතකයේ ධාරිතාව ප්‍රධාන මතකයට වඩා වැඩිය",
      ],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2019, 2020, 2025 memory-hierarchy items.",
  },
  {
    id: 15,
    competencyNumber: 5,
    en: {
      stem:
        "Which of the following operating system classifications best describes a system that allows several users to run several programs concurrently by rapidly switching CPU time between them?",
      options: ["Single user – single task", "Single user – multi task", "Multi user – multi task", "Real time", "Batch processing"],
    },
    si: {
      stem:
        "CPU කාලය පරිශීලකයන් කිහිප දෙනෙකු අතර වේගයෙන් මාරු කරමින් වැඩසටහන් කිහිපයක් ඒකවර ධාවනය කිරීමට ඉඩ දෙන පද්ධතියක් වඩාත් හොඳින් විස්තර කරන මෙහෙයුම් පද්ධති වර්ගීකරණය කුමක්ද?",
      options: ["Single user – single task", "Single user – multi task", "Multi user – multi task", "Real time", "Batch processing"],
    },
    correctIndex: 2,
    confidenceBand: "medium",
    rationale: 'Pattern seen in: 2018 OS-classification items; Operating systems is statistically "due" per the Step 2 scoring.',
  },
  {
    id: 16,
    competencyNumber: 5,
    en: {
      stem: 'Which of the following best describes the purpose of "spooling" in operating systems?',
      options: [
        "Compressing files before storage",
        "Temporarily holding output (e.g. for a printer) so a faster device isn't blocked by a slower one",
        "Detecting viruses in real time",
        "Allocating IP addresses dynamically",
        "Managing user passwords",
      ],
    },
    si: {
      stem: 'මෙහෙයුම් පද්ධතිවල "spooling" හි අරමුණ වඩාත් හොඳින් විස්තර කරන්නේ කුමක්ද?',
      options: [
        "ගබඩා කිරීමට පෙර ගොනු සම්පීඩනය කිරීම",
        "වේගවත් උපාංගයක් මන්දගාමී උපාංගයක් නිසා අවහිර නොවන ලෙස ප්‍රතිදානය තාවකාලිකව රඳවා තැබීම",
        "තථ්‍ය කාලීනව වෛරස් හඳුනාගැනීම",
        "ගතික ලෙස IP ලිපින වෙන් කිරීම",
        "පරිශීලක මුරපද කළමනාකරණය",
      ],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale:
      'This exact sub-topic (spooling) has not appeared in any supplied year; included because it is an explicit named syllabus term under 5.4 and Operating systems is "due".',
  },
  {
    id: 17,
    competencyNumber: 6,
    en: {
      stem: "Which topology requires a device to be connected to every other device directly?",
      options: ["Bus", "Star", "Mesh", "Ring", "Hybrid"],
    },
    si: {
      stem: "එක් උපාංගයක් අනෙකුත් සෑම උපාංගයකටම සෘජුව සම්බන්ධ විය යුතු ස්ථානල (topology) කුමක්ද?",
      options: ["Bus", "Star", "Mesh", "Ring", "Hybrid"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2011, 2017 topology items.",
  },
  {
    id: 18,
    competencyNumber: 6,
    en: {
      stem: "A network administrator needs to allow 30 hosts on a subnet. What is the minimum subnet mask (in CIDR notation) that satisfies this?",
      options: ["/24", "/26", "/27", "/28", "/30"],
    },
    si: {
      stem: "ජාල පරිපාලකයෙකුට උපජාලයක ධාරක (hosts) 30ක් ඉඩ දිය යුතුය. මෙය සපුරාලන අවම උපජාල ආවරණය (subnet mask, CIDR අංකනයෙන්) කුමක්ද?",
      options: ["/24", "/26", "/27", "/28", "/30"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2017, 2019 subnetting/CIDR items.",
  },
  {
    id: 19,
    competencyNumber: 6,
    en: {
      stem: "Which protocol is primarily responsible for translating human-friendly domain names into IP addresses?",
      options: ["HTTP", "FTP", "DNS", "DHCP", "SMTP"],
    },
    si: {
      stem: "මානව-හිතකාමී වසම් නාම (domain names) IP ලිපිනවලට පරිවර්තනය කිරීමට මූලික වශයෙන් වගකිව යුතු කෙටුම්පත (protocol) කුමක්ද?",
      options: ["HTTP", "FTP", "DNS", "DHCP", "SMTP"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2017, 2021 DNS items.",
  },
  {
    id: 20,
    competencyNumber: 6,
    en: {
      stem: "In the OSI reference model, which layer is primarily responsible for end-to-end reliable delivery of data between two hosts?",
      options: ["Network layer", "Data link layer", "Transport layer", "Session layer", "Physical layer"],
    },
    si: {
      stem: "OSI ආදර්ශයේ, ධාරක දෙකක් අතර දත්තවල අවසාන සිට අවසන දක්වා විශ්වාසනීය බෙදාහැරීම සඳහා මූලික වශයෙන් වගකිව යුතු ස්ථරය කුමක්ද?",
      options: ["Network layer", "Data link layer", "Transport layer", "Session layer", "Physical layer"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2011, 2012 OSI-layer items.",
  },
  {
    id: 21,
    competencyNumber: 6,
    en: {
      stem: "Which of the following is a valid reason to use UDP instead of TCP for an application?",
      options: [
        "UDP guarantees delivery of every packet",
        "UDP is connection-oriented",
        "UDP has lower overhead and is suitable for real-time applications like video calls where speed matters more than guaranteed delivery",
        "UDP performs error correction automatically",
        "UDP cannot be used over the Internet",
      ],
    },
    si: {
      stem: "යෙදුමක් සඳහා TCP වෙනුවට UDP භාවිත කිරීමට වලංගු හේතුවක් වන්නේ කුමක්ද?",
      options: [
        "UDP සෑම පැකට්ටුවකම බෙදාහැරීම සහතික කරයි",
        "UDP සම්බන්ධතා-නැඹුරුය",
        "UDP හි පහළ පිරිවැයක් ඇති අතර වේගය වැදගත් වන තථ්‍ය-කාලීන යෙදුම් සඳහා සුදුසුය",
        "UDP ස්වයංක්‍රීයව දෝෂ නිවැරදි කරයි",
        "UDP අන්තර්ජාලය හරහා භාවිත කළ නොහැක",
      ],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2014 transport-protocol items.",
  },
  {
    id: 22,
    competencyNumber: 6,
    en: {
      stem: "Which device operates at the network layer and is primarily used to forward packets between different networks based on IP addresses?",
      options: ["Switch", "Hub", "Router", "Repeater", "Bridge"],
    },
    si: {
      stem: "IP ලිපින මත පදනම්ව විවිධ ජාල අතර පැකට් ඉදිරියට යැවීම සඳහා ප්‍රධාන වශයෙන් භාවිත වන, ජාල ස්ථරයේ ක්‍රියාත්මක වන උපාංගය කුමක්ද?",
      options: ["Switch", "Hub", "Router", "Repeater", "Bridge"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2014, 2024 routing items.",
  },
  {
    id: 23,
    competencyNumber: 6,
    en: {
      stem: "Which of the following statements about firewalls is correct?",
      options: [
        "A firewall guarantees protection against all viruses",
        "A firewall monitors and controls incoming and outgoing network traffic based on defined security rules",
        "A firewall is a type of antivirus software",
        "A firewall encrypts all data on a computer",
        "A firewall can only be implemented as hardware",
      ],
    },
    si: {
      stem: "ගිනි පවුරු (firewalls) පිළිබඳ පහත සඳහන් ප්‍රකාශවලින් නිවැරදි වන්නේ කුමක්ද?",
      options: [
        "ගිනි පවුරක් සියලුම වෛරස්වලින් ආරක්ෂාව සහතික කරයි",
        "ගිනි පවුරක් නිර්වචිත ආරක්ෂක නීති මත පදනම්ව ජාල තදබදය නිරීක්ෂණය හා පාලනය කරයි",
        "ගිනි පවුරක් ප්‍රතිවෛරස් මෘදුකාංගයකි",
        "ගිනි පවුරක් පරිගණකයේ සියලුම දත්ත සංකේතනය කරයි",
        "ගිනි පවුරක් දෘඩාංග ලෙස පමණක් ක්‍රියාත්මක කළ හැක",
      ],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2013 security items; the PDPA-enforcement hook makes network security newly topical.",
  },
  {
    id: 24,
    competencyNumber: 1,
    en: {
      stem: "Which of the following is the correct order of steps in the data processing lifecycle?",
      options: [
        "Processing → Collection → Output → Storage",
        "Collection → Processing → Output → Storage",
        "Storage → Collection → Processing → Output",
        "Output → Processing → Collection → Storage",
        "Collection → Storage → Output → Processing",
      ],
    },
    si: {
      stem: "දත්ත සැකසුම් ජීවන චක්‍රයේ (data processing lifecycle) පියවරවල නිවැරදි අනුපිළිවෙල කුමක්ද?",
      options: [
        "Processing → Collection → Output → Storage",
        "Collection → Processing → Output → Storage",
        "Storage → Collection → Processing → Output",
        "Output → Processing → Collection → Storage",
        "Collection → Storage → Output → Processing",
      ],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2025 data-lifecycle-ordering item.",
  },
  {
    id: 25,
    competencyNumber: 8,
    en: {
      stem:
        "Which entity relationship diagram (ERD) concept describes the maximum and minimum number of instances of one entity that can relate to a single instance of another?",
      options: ["Attribute", "Cardinality", "Identifier", "Relationship type", "Normalisation"],
    },
    si: {
      stem:
        "එක් ආයතනයක (entity) එක් නිදසුනකට තවත් ආයතනයක සම්බන්ධ විය හැකි උපරිම හා අවම නිදසුන් ගණන විස්තර කරන ER-රූප සටහන් සංකල්පය කුමක්ද?",
      options: ["Attribute", "Cardinality", "Identifier", "Relationship type", "Normalisation"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2011, 2013, 2023 ER-diagram items.",
  },
  {
    id: 26,
    competencyNumber: 8,
    en: {
      stem: "Which of the following SQL statements correctly retrieves the names of all students whose marks exceed 75, from a table called Student?",
      options: [
        "UPDATE Student WHERE marks > 75;",
        "SELECT name FROM Student WHERE marks > 75;",
        "DELETE name FROM Student WHERE marks > 75;",
        "SELECT name FROM Student HAVING marks > 75;",
        "INSERT name INTO Student WHERE marks > 75;",
      ],
    },
    si: {
      stem: "Student නම් වගුවකින් ලකුණු 75ට වැඩි සියලුම සිසුන්ගේ නම් නිවැරදිව ලබාගන්නා SQL ප්‍රකාශය කුමක්ද?",
      options: [
        "UPDATE Student WHERE marks > 75;",
        "SELECT name FROM Student WHERE marks > 75;",
        "DELETE name FROM Student WHERE marks > 75;",
        "SELECT name FROM Student HAVING marks > 75;",
        "INSERT name INTO Student WHERE marks > 75;",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2012, 2014, 2019, 2024 SQL SELECT items.",
  },
  {
    id: 27,
    competencyNumber: 8,
    en: {
      stem:
        "A student table stores both StudentName and TeacherName in the same row, where a teacher can teach many students. Storing the teacher's phone number in this same table would most likely cause which normalisation problem on update?",
      options: [
        "Insertion anomaly only",
        "The same phone number must be updated in multiple rows, risking inconsistency",
        "No problem arises",
        "The table cannot store phone numbers at all",
        "The primary key becomes invalid",
      ],
    },
    si: {
      stem:
        "එක් ගුරුවරයෙකුට සිසුන් රාශියක් ඉගැන්විය හැකි අවස්ථාවක, එම ගුරුවරයාගේ දුරකථන අංකය එම වගුවේම ගබඩා කිරීම යාවත්කාලීන කිරීමේදී ඇති කරන ගැටලුව කුමක්ද?",
      options: [
        "ඇතුළත් කිරීමේ අසාමාන්‍යතාවය පමණි",
        "දුරකථන අංකය පේළි කිහිපයකම යාවත්කාලීන කළ යුතු අතර එය නොගැලපීමේ අවදානමක් ඇති කරයි",
        "කිසිදු ගැටලුවක් නොමැත",
        "වගුවට දුරකථන අංක ගබඩා කළ නොහැක",
        "ප්‍රාථමික යතුර අවලංගු වේ",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2019 normalisation-anomaly items.",
  },
  {
    id: 28,
    competencyNumber: 8,
    en: {
      stem: "Which of the following is a valid reason to use a foreign key in a relational database?",
      options: [
        "To speed up all queries automatically",
        "To enforce a link between rows in two tables and maintain referential integrity",
        "To make a column store only unique values",
        "To delete a table permanently",
        "To compress the database file",
      ],
    },
    si: {
      stem: "සම්බන්ධක දත්ත සමුදායක (relational database) විදේශීය යතුරක් (foreign key) භාවිත කිරීමට වලංගු හේතුවක් වන්නේ කුමක්ද?",
      options: [
        "සියලුම විමසුම් ස්වයංක්‍රීයව වේගවත් කිරීමට",
        "වගු දෙකක පේළි අතර සම්බන්ධතාවක් බලාත්මක කර යොමු අඛණ්ඩතාව පවත්වා ගැනීමට",
        "තීරුවක අද්විතීය අගයන් පමණක් ගබඩා කිරීමට",
        "වගුවක් ස්ථිරවම මකා දැමීමට",
        "දත්ත සමුදාය ගොනුව සම්පීඩනය කිරීමට",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2011, 2021 foreign-key items.",
  },
  {
    id: 29,
    competencyNumber: 8,
    en: {
      stem: "Which of the following is NOT typically a component of a Database Management System's data definition language (DDL)?",
      options: ["CREATE TABLE", "ALTER TABLE", "DROP TABLE", "SELECT", "CREATE DATABASE"],
    },
    si: {
      stem: "දත්ත සමුදාය කළමනාකරණ පද්ධතියක දත්ත නිර්වචන භාෂාවේ (DDL) සාමාන්‍යයෙන් අංගයක් නොවන්නේ කුමක්ද?",
      options: ["CREATE TABLE", "ALTER TABLE", "DROP TABLE", "SELECT", "CREATE DATABASE"],
    },
    correctIndex: 3,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2018, 2024 DDL-vs-DML items.",
  },
  {
    id: 30,
    competencyNumber: 8,
    en: {
      stem:
        "A supermarket wants a single table listing each purchase with product name, quantity and unit price, but finds product prices are duplicated across many rows. Which database design principle addresses this?",
      options: ["Encryption", "Normalisation", "Indexing", "Replication", "Backup"],
    },
    si: {
      stem:
        "සුපිරි වෙළඳසැලක් නිෂ්පාදන නාමය, ප්‍රමාණය සහ ඒකක මිල ඇතුළත් එක් වගුවක් අවශ්‍ය කරන අතර, නිෂ්පාදන මිල පේළි රාශියක් හරහා පුනරාවර්තනය වන බව සොයාගනී. මෙය විසඳන දත්ත සමුදාය සැලසුම් මූලධර්මය කුමක්ද?",
      options: ["Encryption", "Normalisation", "Indexing", "Replication", "Backup"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2018, 2025 normalisation-scenario items.",
  },
  {
    id: 31,
    competencyNumber: 9,
    en: {
      stem: "What is printed by the following Python code?",
      options: ["3", "6", "4", "10", "0"],
    },
    si: {
      stem: "පහත Python කේතය මගින් මුද්‍රණය කරන්නේ කුමක්ද?",
      options: ["3", "6", "4", "10", "0"],
    },
    code: 'total = 0\nfor i in range(1, 4):\n    total = total + i\nprint(total)',
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: every supplied year — loop-tracing is the single most common MCQ type in this competency.",
  },
  {
    id: 32,
    competencyNumber: 9,
    en: {
      stem: "Which of the following is a correctly formed Python function definition?",
      options: [
        "def square(x) return x*x",
        "def square(x): return x*x",
        "function square(x): return x*x",
        "def square(x); return x*x",
        "square(x): return x*x",
      ],
    },
    si: {
      stem: "පහත සඳහන් ඒවායින් නිවැරදිව සකසන ලද Python ශ්‍රිත (function) අර්ථ දැක්වීම කුමක්ද?",
      options: [
        "def square(x) return x*x",
        "def square(x): return x*x",
        "function square(x): return x*x",
        "def square(x); return x*x",
        "square(x): return x*x",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2013 syntax-correctness items.",
  },
  {
    id: 33,
    competencyNumber: 9,
    en: {
      stem: "In Python, what is the scope of a variable declared inside a function and not returned?",
      options: [
        "Global — accessible everywhere",
        "Local — accessible only within that function",
        "It becomes a constant",
        "It is stored permanently on disk",
        "It is accessible only outside the function",
      ],
    },
    si: {
      stem: "Python හි, ශ්‍රිතයක් ඇතුළත ප්‍රකාශිත සහ ආපසු නොදුන් විචල්‍යයක විෂය පථය (scope) කුමක්ද?",
      options: [
        "ගෝලීය — සෑම තැනකම ප්‍රවේශ විය හැක",
        "ස්ථානීය — එම ශ්‍රිතය තුළ පමණක් ප්‍රවේශ විය හැක",
        "එය නියතයක් බවට පත් වේ",
        "එය තැටියේ ස්ථිරව ගබඩා වේ",
        "එය ශ්‍රිතයෙන් පිටතදී පමණක් ප්‍රවේශ විය හැක",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: local vs. global variable items appearing across multiple years.",
  },
  {
    id: 34,
    competencyNumber: 9,
    en: {
      stem: "What does the following pseudocode segment output?",
      options: ["X", "Y", "5", "2", "Nothing is printed"],
    },
    si: {
      stem: "පහත ව්‍යාජ කේත (pseudocode) කොටස ප්‍රතිදානය කරන්නේ කුමක්ද?",
      options: ["X", "Y", "5", "2", "Nothing is printed"],
    },
    code: 'a = 5\nb = 2\nif a > b:\n    print("X")\nelse:\n    print("Y")',
    correctIndex: 0,
    confidenceBand: "high",
    rationale: "Pattern seen in: selection-structure tracing, every supplied year.",
  },
  {
    id: 35,
    competencyNumber: 9,
    en: {
      stem: "Which of the following correctly describes the difference between a list and a tuple in Python?",
      options: [
        "A list is immutable, a tuple is mutable",
        "A list is mutable (can be changed), a tuple is immutable (cannot be changed once created)",
        "Both are exactly the same",
        "A tuple can only store numbers",
        "A list can only store one value",
      ],
    },
    si: {
      stem: "Python හි list සහ tuple අතර වෙනස නිවැරදිව විස්තර කරන්නේ කුමක්ද?",
      options: [
        "list වෙනස් කළ නොහැක, tuple වෙනස් කළ හැක",
        "list වෙනස් කළ හැක, tuple සෑදූ පසු වෙනස් කළ නොහැක",
        "දෙකම සම්පූර්ණයෙන් සමානය",
        "tuple හට අංක පමණක් ගබඩා කළ හැක",
        "list හට එක් අගයක් පමණක් ගබඩා කළ හැක",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: data-structure items in recent years.",
  },
  {
    id: 36,
    competencyNumber: 9,
    en: {
      stem: "Which searching technique checks each element of a list one by one, in order, until the target is found or the list ends?",
      options: ["Binary search", "Bubble sort", "Sequential search", "Quick sort", "Hash search"],
    },
    si: {
      stem: "ඉලක්කය හමු වන තෙක් හෝ ලැයිස්තුව අවසන් වන තෙක්, ලැයිස්තුවක එක් එක් අංගය අනුපිළිවෙලින් පරීක්ෂා කරන සෙවුම් ක්‍රමය කුමක්ද?",
      options: ["Binary search", "Bubble sort", "Sequential search", "Quick sort", "Hash search"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: sequential-search items.",
  },
  {
    id: 37,
    competencyNumber: 9,
    en: {
      stem: "During one pass of a bubble sort on the list [5, 2, 4], which pair is compared and swapped first?",
      options: ["2 and 4", "5 and 4", "5 and 2", "No swap occurs", "4 and 2"],
    },
    si: {
      stem: "[5, 2, 4] ලැයිස්තුවක බුබුළු අනුපිළිවෙළ (bubble sort) එක් ගමනක දී, පළමුව සංසන්දනය කර හුවමාරු කරන යුගලය කුමක්ද?",
      options: ["2 and 4", "5 and 4", "5 and 2", "No swap occurs", "4 and 2"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: bubble-sort trace items.",
  },
  {
    id: 38,
    competencyNumber: 9,
    en: {
      stem: "Which of the following correctly describes the difference between a compiler and an interpreter?",
      options: [
        "A compiler translates and executes one line at a time; an interpreter translates the whole program first",
        "An interpreter translates and executes one line/statement at a time; a compiler translates the entire source program before execution",
        "Both produce identical machine code with no difference in process",
        "A compiler only works with Python",
        "An interpreter produces a standalone executable file",
      ],
    },
    si: {
      stem: "සම්පාදකයක් (compiler) සහ අර්ථකථකයක් (interpreter) අතර වෙනස නිවැරදිව විස්තර කරන්නේ කුමක්ද?",
      options: [
        "සම්පාදකයක් වරකට එක් පේළියක් පරිවර්තනය කර ක්‍රියාත්මක කරයි; අර්ථකථකයක් මුලින්ම මුළු වැඩසටහනම පරිවර්තනය කරයි",
        "අර්ථකථකයක් වරකට එක් ප්‍රකාශනයක් පරිවර්තනය කර ක්‍රියාත්මක කරයි; සම්පාදකයක් ක්‍රියාත්මක කිරීමට පෙර සම්පූර්ණ මූලාශ්‍ර වැඩසටහනම පරිවර්තනය කරයි",
        "දෙකම ක්‍රියාවලියේ වෙනසක් නොමැතිව සමාන යන්ත්‍ර කේත නිපදවයි",
        "සම්පාදකයක් ක්‍රියාත්මක වන්නේ Python සමඟ පමණි",
        "අර්ථකථකයක් ස්වාධීන ක්‍රියාත්මක කළ හැකි ගොනුවක් නිපදවයි",
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2016 compiler-vs-interpreter items.",
  },
  {
    id: 39,
    competencyNumber: 9,
    en: {
      stem: "Which facility of an IDE is specifically used to help a programmer locate and fix logical errors while a program runs step by step?",
      options: ["Compiler", "Debugger", "Linker", "Version control", "Code formatter"],
    },
    si: {
      stem: "වැඩසටහනක් පියවරෙන් පියවර ධාවනය වන අතරතුර තාර්කික දෝෂ සොයාගැනීමට හා නිවැරදි කිරීමට උපකාරී වන IDE එකක පහසුකම කුමක්ද?",
      options: ["Compiler", "Debugger", "Linker", "Version control", "Code formatter"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: IDE-features items.",
  },
  {
    id: 40,
    competencyNumber: 9,
    en: {
      stem: "A program repeatedly asks the user for a positive number until one is entered. Which control structure is most appropriate for this?",
      options: ["Sequence only", "Selection only", "Repetition (loop)", "A function with no parameters", "A data structure"],
    },
    si: {
      stem: "ධන සංඛ්‍යාවක් ඇතුළත් කරන තෙක් වැඩසටහනක් නැවත නැවත පරිශීලකයාගෙන් සංඛ්‍යාවක් ඉල්ලයි. මෙයට වඩාත් සුදුසු පාලන ව්‍යුහය කුමක්ද?",
      options: ["Sequence only", "Selection only", "පුනරාවර්තනය (Repetition / loop)", "A function with no parameters", "A data structure"],
    },
    correctIndex: 2,
    confidenceBand: "high",
    rationale: "Pattern seen in: control-structure application items.",
  },
  {
    id: 41,
    competencyNumber: 10,
    en: {
      stem: "Which HTML tag is used to create a numbered (ordered) list?",
      options: ["<ul>", "<ol>", "<li>", "<dl>", "<table>"],
    },
    si: {
      stem: "අංකිත (ordered) ලැයිස්තුවක් සෑදීමට භාවිත කරන HTML ටැගය කුමක්ද?",
      options: ["<ul>", "<ol>", "<li>", "<dl>", "<table>"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: "Pattern seen in: 2013, 2019 HTML-list items.",
  },
  {
    id: 42,
    competencyNumber: 10,
    en: {
      stem: "Which CSS property is used to change the space between the border of an element and its content?",
      options: ["margin", "padding", "border-style", "float", "position"],
    },
    si: {
      stem: "අංගයක මායිම (border) සහ එහි අන්තර්ගතය අතර පරතරය වෙනස් කිරීමට භාවිත කරන CSS ගුණාංගය කුමක්ද?",
      options: ["margin", "padding", "border-style", "float", "position"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale:
      'No supplied year shows this — the CSS box-model has essentially zero past-paper presence despite a full sub-unit devoted to it, which is exactly why Web development is flagged "due".',
  },
  {
    id: 43,
    competencyNumber: 10,
    en: {
      stem: "Which of the following correctly links an external CSS stylesheet named style.css inside the <head> of an HTML document?",
      options: [
        '<style src="style.css">',
        '<link rel="stylesheet" href="style.css">',
        "<css>style.css</css>",
        '<script src="style.css">',
        '<import file="style.css">',
      ],
    },
    si: {
      stem: "HTML ලේඛනයක <head> තුළ style.css නම් බාහිර CSS මාතෘකා පත්‍රය (stylesheet) නිවැරදිව සම්බන්ධ කරන්නේ කුමක්ද?",
      options: [
        '<style src="style.css">',
        '<link rel="stylesheet" href="style.css">',
        "<css>style.css</css>",
        '<script src="style.css">',
        '<import file="style.css">',
      ],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: 'Under-tested CSS-integration sub-topic, consistent with Web development\'s "due" ranking.',
  },
  {
    id: 44,
    competencyNumber: 10,
    en: {
      stem: "A web form collects a user's name and stores it in a MySQL database via PHP. Which PHP superglobal array is used to access data submitted via the POST method?",
      options: ["$_GET", "$_POST", "$_FILE", "$_SESSION", "$_SERVER"],
    },
    si: {
      stem:
        "වෙබ් පෝරමයක් පරිශීලකයෙකුගේ නම එකතු කර PHP හරහා MySQL දත්ත සමුදායක ගබඩා කරයි. POST ක්‍රමය හරහා ඉදිරිපත් කළ දත්තවලට ප්‍රවේශ වීමට භාවිත කරන PHP සුපිරි-ගෝලීය (superglobal) අරාව කුමක්ද?",
      options: ["$_GET", "$_POST", "$_FILE", "$_SESSION", "$_SERVER"],
    },
    correctIndex: 1,
    confidenceBand: "high",
    rationale: 'PHP form-handling has almost no past-paper presence despite being a full sub-unit (10.7); included precisely because it is "due".',
  },
  {
    id: 45,
    competencyNumber: 10,
    en: {
      stem: "Which of the following is a valid reason to publish a website through a web hosting service rather than only on a local computer?",
      options: [
        "It makes the site accessible to users over the Internet at any time",
        "It removes the need for a domain name",
        "It makes the website faster on the developer's own computer",
        "It is required before any HTML can be written",
        "It prevents the website from being edited further",
      ],
    },
    si: {
      stem:
        "ස්ථානීය පරිගණකයක පමණක් නොව වෙබ් සත්කාරක සේවාවක් හරහා (web hosting) වෙබ් අඩවියක් ප්‍රකාශයට පත් කිරීමට වලංගු හේතුවක් වන්නේ කුමක්ද?",
      options: [
        "එය අන්තර්ජාලය හරහා ඕනෑම වේලාවක පරිශීලකයන්ට ප්‍රවේශ විය හැකි කරයි",
        "වසම් නාමයක අවශ්‍යතාව ඉවත් කරයි",
        "එය සංවර්ධකයාගේම පරිගණකයේ වෙබ් අඩවිය වේගවත් කරයි",
        "HTML ලිවීමට පෙර එය අවශ්‍යය",
        "වෙබ් අඩවිය තවදුරටත් සංස්කරණය කිරීම වළක්වයි",
      ],
    },
    correctIndex: 0,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2017 web-publishing items.",
  },
  {
    id: 46,
    competencyNumber: 7,
    en: {
      stem:
        "A company's existing manual leave-approval process is being replaced by a new online system. Which SDLC phase focuses on determining whether this new system is worth building, in technical, economic and operational terms?",
      options: ["Preliminary investigation", "Feasibility study", "System testing", "Deployment", "Requirement analysis"],
    },
    si: {
      stem:
        "සමාගමක දැනට පවතින හස්තීය නිවාඩු අනුමැති ක්‍රියාවලිය නව මාර්ගගත පද්ධතියක් මගින් ප්‍රතිස්ථාපනය කරමින් පවතී. නව පද්ධතිය තාක්ෂණික, ආර්ථික සහ මෙහෙයුම් වශයෙන් ගොඩනැගීමට වටිනවාදැයි තීරණය කිරීම කෙරෙහි අවධානය යොමු කරන SDLC අදියර කුමක්ද?",
      options: ["Preliminary investigation", "Feasibility study", "System testing", "Deployment", "Requirement analysis"],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: 'Pattern seen in: feasibility-study items; Systems analysis & design is "due" per the Step 2 scoring.',
  },
  {
    id: 47,
    competencyNumber: 7,
    en: {
      stem: 'Which of the following is the best description of "black box testing"?',
      options: [
        "Testing the internal code structure line by line",
        "Testing a system's functionality based only on its inputs and expected outputs, without knowledge of internal code",
        "Testing performed only after the system has failed",
        "A method used only for testing hardware",
        "Testing that requires the tester to be the original programmer",
      ],
    },
    si: {
      stem: '"කළු කොටු පරීක්ෂණයේ" (black box testing) වඩාත් හොඳ විස්තරය කුමක්ද?',
      options: [
        "අභ්‍යන්තර කේත ව්‍යුහය පේළියෙන් පේළිය පරීක්ෂා කිරීම",
        "අභ්‍යන්තර කේතය පිළිබඳ දැනුමකින් තොරව, ආදාන සහ අපේක්ෂිත ප්‍රතිදාන පදනම් කරගෙන පමණක් පද්ධතියක ක්‍රියාකාරීත්වය පරීක්ෂා කිරීම",
        "පද්ධතිය අසාර්ථක වූ පසුව පමණක් සිදු කරන පරීක්ෂණයකි",
        "දෘඩාංග පරීක්ෂා කිරීමට පමණක් භාවිත වන ක්‍රමයකි",
        "පරීක්ෂකයා මුල් වැඩසටහන් රචකයා විය යුතු පරීක්ෂණයකි",
      ],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2013 testing-type items.",
  },
  {
    id: 48,
    competencyNumber: 12,
    en: {
      stem: "A small clothing retailer decides to sell exclusively through an online marketplace with no physical shop at all. Which term best describes this type of business?",
      options: ["Brick-and-mortar", "Brick-and-click", "Pure click", "Pure brick", "Hybrid retail"],
    },
    si: {
      stem:
        "කුඩා ඇඳුම් වෙළඳසැලක් භෞතික සාප්පුවක් නොමැතිව සම්පූර්ණයෙන්ම මාර්ගගත වෙළඳපොලක් හරහා විකිණීමට තීරණය කරයි. මෙම ව්‍යාපාර වර්ගය වඩාත් හොඳින් විස්තර කරන යෙදුම කුමක්ද?",
      options: ["ගඩොල් හා දැව (Brick-and-mortar)", "ගඩොල් හා ක්ලික් (Brick-and-click)", "පිරිසිදු ක්ලික් (Pure click)", "පිරිසිදු ගඩොල් (Pure brick)", "මිශ්‍ර සිල්ලර (Hybrid retail)"],
    },
    correctIndex: 2,
    confidenceBand: "medium",
    rationale: "Pattern seen in: 2018 brick-and-click items; also aligned with the AI Week 2026 / digital-economy current-events hook.",
  },
  {
    id: 49,
    competencyNumber: 13,
    en: {
      stem: 'Which of the following is the best example of "machine-to-machine" coexistence as described under emerging computing trends?',
      options: [
        "A person typing a document on a word processor",
        "A smart thermostat automatically communicating with a smart irrigation controller to optimise energy use without human input",
        "A student searching the Internet for a definition",
        "A teacher grading a paper by hand",
        "A person calling another person on a landline",
      ],
    },
    si: {
      stem: 'නැගී එන පරිගණක ප්‍රවණතා යටතේ විස්තර කරන "යන්ත්‍රයෙන් යන්ත්‍රයට" (machine-to-machine) සහසම්බන්ධතාවයට වඩාත් හොඳ උදාහරණය කුමක්ද?',
      options: [
        "පුද්ගලයෙකු වචන සකසනයක ලේඛනයක් ටයිප් කිරීම",
        "ස්මාර්ට් උෂ්ණත්ව ස්ථාපකයක් මානව මැදිහත් වීමකින් තොරව බලශක්තිය ප්‍රශස්ත කිරීමට ස්මාර්ට් වාරි පාලකයක් සමඟ ස්වයංක්‍රීයව සන්නිවේදනය කිරීම",
        "සිසුවෙකු අර්ථදැක්වීමක් සඳහා අන්තර්ජාලය සොයා බැලීම",
        "ගුරුවරයෙකු අතින් ලිපියක් ලකුණු කිරීම",
        "පුද්ගලයෙකු තවත් අයෙකුට භූමිතාප දුරකථනයෙන් අමතන්නක්",
      ],
    },
    correctIndex: 1,
    confidenceBand: "medium",
    rationale: "Real-world hook: Sri Lanka AI Week 2026 and the national AI push, though no direct past-paper precedent was found.",
  },
  {
    id: 50,
    competencyNumber: 11,
    en: {
      stem: "Which of the following is a genuine example of an IoT (Internet of Things) application?",
      options: [
        "A calculator performing arithmetic offline",
        "A smart irrigation system that uses a soil-moisture sensor to automatically turn a water valve on or off",
        "A printed textbook",
        "A standalone desktop application with no network connection",
        "A handwritten letter",
      ],
    },
    si: {
      stem: "IoT (Internet of Things) යෙදුමකට සැබෑ උදාහරණයක් වන්නේ පහත සඳහන් කුමක්ද?",
      options: [
        "නොබැඳි ගණක යන්ත්‍රයක් අංක ගණිත සිදු කිරීම",
        "පස තෙතමනය සංවේදකයක් භාවිතයෙන් ජල කපාටයක් ස්වයංක්‍රීයව විවෘත/වසා දමන ස්මාර්ට් වාරි පද්ධතියක්",
        "මුද්‍රිත පෙළපොතක්",
        "ජාල සම්බන්ධතාවක් නොමැති ස්වාධීන ඩෙස්ක්ටොප් යෙදුමක්",
        "අතින් ලියන ලද ලිපියක්",
      ],
    },
    correctIndex: 1,
    confidenceBand: "low",
    rationale: "Pattern seen in: 2011 IoT/embedded introductory item; thin evidence base, as noted in Step 4.",
  },
];

export const AL_ICT_2027_PREDICTED_PAPER1: PredictedMcqQuestion[] = RAW.map((q) => ({
  ...q,
  topic: COMPETENCY_TOPIC[q.competencyNumber],
  sourceYearsCited: yearsIn(q.rationale),
}));
