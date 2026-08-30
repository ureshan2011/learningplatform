/**
 * A/L ICT exam command words.
 *
 * Static, not Firestore: this list is fixed reference content, not something
 * a teacher edits per class, so it ships in the repo and costs zero reads.
 * It is also the acquisition funnel's second page — students search "ICT
 * command words meaning" long before they search for a tuition class.
 *
 * Sinhala translations are the actually valuable part here for a Sinhala-medium
 * class: the terms themselves are what students blank on in the exam hall,
 * not the English definition. Treat these as a first draft to refine, not as
 * the Department of Examinations' own wording.
 */
export interface CommandWord {
  word: string;
  sinhala: string;
  typicalMarks: string;
  meaning: string;
  tip: string;
  example: string;
}

export const COMMAND_WORDS: CommandWord[] = [
  {
    word: "State / Name",
    sinhala: "සඳහන් කරන්න / නම් කරන්න",
    typicalMarks: "1 mark",
    meaning: "A short, direct fact — no explanation, no reasoning.",
    tip: "One line is enough. Writing a paragraph here wastes exam time for zero extra marks.",
    example: "\"State one input device.\" → \"Keyboard.\" Nothing more is needed or rewarded.",
  },
  {
    word: "List",
    sinhala: "ලැයිස්තු ගත කරන්න",
    typicalMarks: "1 mark per item",
    meaning: "Several short facts, one per line — not sentences.",
    tip: "Number each point. A marker awards one mark per correct item up to the stated count.",
    example: "\"List two output devices.\" → \"1. Monitor  2. Printer\"",
  },
  {
    word: "Define",
    sinhala: "අර්ථ දක්වන්න",
    typicalMarks: "1–2 marks",
    meaning: "The precise technical meaning of a term.",
    tip: "Use the exact syllabus definition where one exists — a vague paraphrase often loses the mark.",
    example: "\"Define an operating system.\" → \"System software that manages hardware and provides a platform for application software to run.\"",
  },
  {
    word: "Explain",
    sinhala: "පැහැදිලි කරන්න",
    typicalMarks: "2–3 marks",
    meaning: "State a fact AND give the reason or mechanism behind it.",
    tip: "The single most common mark loss in A/L ICT: students state the fact but never say *why*. Every \"explain\" answer needs a \"because\".",
    example: "\"Explain why RAM is volatile.\" → \"RAM loses its data when power is switched off, because it stores data using electrical charge that needs continuous power to be maintained.\"",
  },
  {
    word: "Describe",
    sinhala: "විස්තර කරන්න",
    typicalMarks: "2–4 marks",
    meaning: "Give a detailed account of what something is or how it works, step by step.",
    tip: "More detail than \"state\", but you're narrating a process or structure — not yet comparing or justifying anything.",
    example: "\"Describe how a barcode is read at a supermarket till.\" → walk through scan, decode, database lookup, price display, in order.",
  },
  {
    word: "Distinguish / Differentiate",
    sinhala: "වෙනස හඳුනාගන්න",
    typicalMarks: "2–4 marks",
    meaning: "State at least one clear point of DIFFERENCE between two things.",
    tip: "Describing each thing separately — even correctly — earns almost nothing here. The mark is for the contrast itself, not the description.",
    example: "\"Distinguish between RAM and ROM.\" → \"RAM is volatile and can be written to, while ROM is non-volatile and is generally read-only.\"",
  },
  {
    word: "Compare",
    sinhala: "සසඳන්න",
    typicalMarks: "2–4 marks",
    meaning: "Cover both similarities AND differences.",
    tip: "Unlike \"distinguish\" (differences only), \"compare\" wants both sides — what's alike as well as what's not.",
    example: "\"Compare LAN and WAN.\" → note the shared purpose (connecting devices) as well as the difference in geographic scope.",
  },
  {
    word: "Outline",
    sinhala: "සාරාංශයක් ලෙස දක්වන්න",
    typicalMarks: "2–3 marks",
    meaning: "The main points only, in brief — a summary, not full detail.",
    tip: "Depth is not rewarded here; breadth is. Cover more points more briefly rather than one point in paragraph form.",
    example: "\"Outline the stages of the system development life cycle.\" → name each stage in one short phrase, in order.",
  },
  {
    word: "Discuss / Evaluate",
    sinhala: "සාකච්ඡා කරන්න / ඇගයීමට ලක් කරන්න",
    typicalMarks: "4–6 marks",
    meaning: "Weigh up more than one side — advantages and disadvantages, or competing viewpoints — and typically reach a conclusion.",
    tip: "A one-sided answer caps out well below full marks even if every point in it is correct. The structure being asked for IS the mark scheme.",
    example: "\"Discuss the impact of e-commerce on traditional retail businesses.\" → cover benefits, drawbacks, and a brief judgement.",
  },
  {
    word: "Justify",
    sinhala: "සාධාරණීකරණය කරන්න",
    typicalMarks: "3–5 marks",
    meaning: "Give reasons that support a specific decision, choice, or opinion already stated in the question.",
    tip: "Answer the question that was actually asked — a justify question already picked a side; your job is to defend it with reasons, not to re-debate which side is right.",
    example: "\"Justify the use of a database rather than a spreadsheet for a school's student records.\" → reasons specific to that scenario: data integrity, relationships between tables, multi-user access.",
  },
];
