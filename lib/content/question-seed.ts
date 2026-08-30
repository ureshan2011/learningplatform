import type { Medium, Question, QuestionSource } from "@/lib/types";

/** Shape the seed route fills in (id, tenantId, createdAt) before writing. */
export type QuestionSeed = Omit<Question, "id" | "tenantId" | "createdAt">;

const sinhala: Medium = "sinhala";

function q(
  subjectId: string,
  topic: string,
  text: string,
  options: string[],
  correctIndex: number,
  explanation: string,
  misconceptions: Record<number, string>,
  extra: { source?: QuestionSource; commandWord?: string; year?: number } = {},
): QuestionSeed {
  return {
    subjectId,
    topic,
    medium: sinhala,
    source: extra.source ?? "original",
    // Firestore rejects `undefined` field values outright, so these are only
    // ever included when actually present — same convention as
    // lib/payments/entitlements.ts's optional `lastPaymentId`.
    ...(extra.commandWord ? { commandWord: extra.commandWord } : {}),
    ...(extra.year ? { year: extra.year } : {}),
    text,
    options,
    correctIndex,
    explanation,
    misconceptions,
    active: true,
  };
}

/**
 * Starter question bank — real A/L ICT content with genuine
 * misconception notes, so Practice, spaced repetition and weak-topic
 * detection all have something real to work with the moment a teacher clicks
 * "seed". Meant as a first batch to build on, not a finished bank.
 */
export const QUESTION_SEED: QuestionSeed[] = [
  // ---- A/L ICT — Fundamentals of computer systems -----------------------
  q(
    "al-ict",
    "Fundamentals of computer systems",
    "Why is RAM described as volatile memory?",
    [
      "It is very fast compared to secondary storage",
      "It loses its contents when power is switched off",
      "It can only be read from, not written to",
      "It is used to permanently store the operating system",
    ],
    1,
    "\"Volatile\" specifically means the memory loses its contents without power — that is the property being tested, not speed or read/write ability.",
    {
      0: "Speed is true of RAM but is not what \"volatile\" refers to.",
      2: "That describes ROM, not RAM — RAM can be both read and written to.",
      3: "The operating system is typically stored on secondary storage (e.g. a hard disk), not permanently in RAM.",
    },
  ),
  q(
    "al-ict",
    "Fundamentals of computer systems",
    "Which of these is an output device?",
    ["Scanner", "Microphone", "Projector", "Keyboard"],
    2,
    "A projector displays information produced by the computer, making it an output device. The other three all bring data or instructions into the computer.",
    {
      0: "A scanner captures an image into the computer — that is input.",
      1: "A microphone captures sound into the computer — that is input.",
      3: "A keyboard sends keystrokes into the computer — that is input.",
    },
  ),
  q(
    "al-ict",
    "Fundamentals of computer systems",
    "\"Distinguish between RAM and ROM.\" Which answer would actually earn the marks?",
    [
      "RAM stores data temporarily.",
      "ROM stores data permanently.",
      "RAM is volatile and can be written to during normal use, while ROM is non-volatile and generally fixed at manufacture.",
      "Both store the operating system.",
    ],
    2,
    "\"Distinguish\" needs the contrast stated directly — both sides, in one answer — not each device described on its own.",
    {
      0: "Correct on its own, but describes only RAM — a \"distinguish\" question is not answered by describing one side.",
      1: "Same issue as A — one side of the comparison is not a distinction.",
      3: "This is inaccurate (ROM typically stores firmware, not the full OS) and does not distinguish anything.",
    },
    { source: "command_word_drill", commandWord: "Distinguish" },
  ),

  // ---- A/L ICT — Data representation ------------------------------------
  q(
    "al-ict",
    "Data representation",
    "What is the denary (base 10) value of the binary number 1101?",
    ["11", "13", "14", "15"],
    1,
    "1101 = (1×8) + (1×4) + (0×2) + (1×1) = 8 + 4 + 0 + 1 = 13.",
    {
      0: "Check the place values again — this misses the value of the leftmost bit.",
      2: "This comes from misreading the last bit as 0 contributing nothing but miscounting elsewhere — recompute each column value separately: 8, 4, 2, 1.",
      3: "15 is 1111 in binary, not 1101 — one of the bits was read as 1 when it is 0.",
    },
  ),
  q(
    "al-ict",
    "Data representation",
    "What is the 8-bit binary representation of the denary number 13?",
    ["00001101", "00001110", "00001011", "00010011"],
    0,
    "13 = 8 + 4 + 1, so the bits set are the 8s, 4s and 1s columns: 00001101.",
    {
      1: "00001110 is 14, not 13 — the units column should be 1, not the 2s column.",
      2: "00001011 is 11 — the 4s column bit and 2s column bit are swapped.",
      3: "00010011 is 19 — an extra bit was set in the 16s column.",
    },
  ),

  // ---- A/L ICT — Operating systems ---------------------------------------
  q(
    "al-ict",
    "Operating systems",
    "Which of the following is a core function of an operating system?",
    [
      "Checking spelling in a document",
      "Managing memory allocation between running programs",
      "Calculating totals in a spreadsheet",
      "Compressing a video file for upload",
    ],
    1,
    "Managing hardware resources — memory, processor time, storage — for running programs is a defining job of the OS; the other options are jobs of specific application software.",
    {
      0: "Spell-checking is a feature of word processing software, not the operating system.",
      2: "Spreadsheet calculation is done by spreadsheet software, not the OS.",
      3: "Video compression is typically done by dedicated application software or codecs, not the OS itself.",
    },
  ),

  // ---- A/L ICT — Database management ---------------------------------------
  q(
    "al-ict",
    "Database management",
    "What is a primary key in a database table?",
    [
      "Any field that contains numbers",
      "A field, or combination of fields, that uniquely identifies each record",
      "The first field created in the table",
      "A field that is always left blank",
    ],
    1,
    "A primary key's defining property is uniqueness: no two records may share the same primary key value, which is what lets one record be told apart from another.",
    {
      0: "Plenty of numeric fields (like age or quantity) are not unique — being numeric is not what makes a key primary.",
      2: "Field order in a table has no bearing on which field is the primary key.",
      3: "A primary key must never be blank — it must exist and be unique for every record (this is the \"entity integrity\" rule).",
    },
  ),
  q(
    "al-ict",
    "Database management",
    "\"Distinguish between a primary key and a foreign key.\" Which answer earns the marks?",
    [
      "A primary key is a number and a foreign key is text.",
      "A primary key uniquely identifies records in its own table; a foreign key is a field in one table that refers to the primary key of another table.",
      "Both are used to sort a table alphabetically.",
      "A foreign key is always faster to search than a primary key.",
    ],
    1,
    "The actual distinction examiners want is about the role each key plays — uniqueness within a table versus linking between tables — not their data type or speed.",
    {
      0: "Data type is not the defining difference — both keys can be of many data types.",
      2: "Sorting is not the purpose of either kind of key.",
      3: "Search speed is not a defined distinction between the two key types in the syllabus.",
    },
    { source: "command_word_drill", commandWord: "Distinguish" },
  ),

  // ---- A/L ICT — Programming ------------------------------------------------
  q(
    "al-ict",
    "Programming",
    "Which of these correctly describes a loop in programming?",
    [
      "A section of code that runs exactly once",
      "A structure that repeats a block of instructions while or until a condition is met",
      "A named location that stores a single value that can change",
      "A message shown to the user when an error occurs",
    ],
    1,
    "A loop's defining feature is repetition controlled by a condition — that is what separates it from a single instruction or a variable.",
    {
      0: "Running exactly once is the opposite of what a loop does.",
      2: "That describes a variable, not a loop.",
      3: "That describes an error message, unrelated to loop structures.",
    },
  ),
  q(
    "al-ict",
    "Programming",
    "What is the key difference between a variable and a constant in a program?",
    [
      "A variable can only store text; a constant can only store numbers",
      "A variable's value can change while the program runs; a constant's value stays fixed",
      "A constant must be declared inside a loop",
      "There is no real difference — the terms are interchangeable",
    ],
    1,
    "The distinction is entirely about mutability during execution: variables are meant to change, constants are fixed once set.",
    {
      0: "Data type is unrelated to the variable/constant distinction — both can hold numbers or text.",
      2: "Constants are not required to be declared inside a loop.",
      3: "They are not interchangeable — this is exactly the distinction the question is testing.",
    },
  ),

  // ---- A/L ICT — Web development --------------------------------------------
  q(
    "al-ict",
    "Web development",
    "In HTML, what is the purpose of the <a> tag?",
    [
      "To insert an image",
      "To create a hyperlink to another page or resource",
      "To bold a piece of text",
      "To start a new paragraph",
    ],
    1,
    "<a> stands for \"anchor\" and, with an href attribute, creates a clickable link — this is the tag's whole purpose.",
    {
      0: "Images use the <img> tag, not <a>.",
      2: "Bold text uses <b> or <strong>, not <a>.",
      3: "New paragraphs use the <p> tag, not <a>.",
    },
  ),

  // ---- A/L ICT — command word drill (general) --------------------------------
  q(
    "al-ict",
    "Operating systems",
    "\"Explain why a computer needs an operating system.\" Which answer would earn full marks?",
    [
      "A computer needs an operating system.",
      "Operating systems are software.",
      "An operating system manages hardware resources and provides a platform for application software to run, so without one the applications would have no way to access memory, storage or input/output devices.",
      "Operating systems have icons and a desktop.",
    ],
    2,
    "\"Explain\" requires a fact plus the reasoning behind it — here, both what an OS does AND why that makes it necessary. A bare fact without the \"because\" loses marks even if it is true.",
    {
      0: "This just restates the question — no reasoning at all, so it earns nothing.",
      1: "True but far too vague — it gives no reason, which is exactly what \"explain\" is asking for.",
      3: "Describes the appearance of a GUI, not the reasoning behind needing an OS.",
    },
    { source: "command_word_drill", commandWord: "Explain" },
  ),

  // ---- A/L ICT — Logic gates and Boolean algebra ------------------------------
  q(
    "al-ict",
    "Logic gates and Boolean algebra",
    "An AND gate has inputs A=1 and B=0. What is the output?",
    ["0", "1", "Undefined", "Depends on a clock signal"],
    0,
    "An AND gate outputs 1 only when every input is 1. Since B=0 here, the output is 0.",
    {
      1: "AND requires ALL inputs to be 1 — with B=0, the output cannot be 1.",
      2: "Logic gate outputs are always defined for any combination of binary inputs — there is no \"undefined\" case here.",
      3: "Basic AND/OR/NOT gates are combinational logic — they don't depend on a clock.",
    },
  ),
  q(
    "al-ict",
    "Logic gates and Boolean algebra",
    "An OR gate has inputs A=0 and B=0. What is the output?",
    ["0", "1", "Undefined", "2"],
    0,
    "An OR gate outputs 1 if at least one input is 1. With both inputs at 0, none are 1, so the output is 0.",
    {
      1: "OR needs at least ONE input to be 1 — with both at 0, the output must be 0.",
      2: "Every input combination gives a defined output for a basic OR gate.",
      3: "Logic gate outputs are binary (0 or 1) — 2 is not a valid output value.",
    },
  ),

  // ---- A/L ICT — Data communication and networking -----------------------
  q(
    "al-ict",
    "Data communication and networking",
    "\"Distinguish between a LAN and a WAN.\" Which answer earns the marks?",
    [
      "A LAN uses cables and a WAN uses WiFi.",
      "A LAN covers a small, localised area such as one building, while a WAN spans a much larger geographic area, often connecting multiple LANs across cities or countries.",
      "A WAN is always faster than a LAN.",
      "Both connect exactly the same number of devices.",
    ],
    1,
    "The syllabus distinction is geographic scope: local versus wide area. Cabling type, speed and device count are not the defining difference examiners are looking for.",
    {
      0: "Both LANs and WANs can use a mix of wired and wireless links — cabling type isn't the defining difference.",
      2: "In practice a LAN is usually faster than a WAN over the same link, the reverse of this claim.",
      3: "Device count is not a fixed property of either network type.",
    },
    { source: "command_word_drill", commandWord: "Distinguish" },
  ),

  // ---- A/L ICT — Database management ---------------------------------------
  q(
    "al-ict",
    "Database management",
    "What is the main purpose of normalising a database?",
    [
      "To make queries run in alphabetical order",
      "To reduce data redundancy and prevent update anomalies by organising data into related tables",
      "To increase the number of tables regardless of content",
      "To make every field a primary key",
    ],
    1,
    "Normalisation exists to eliminate repeated data and the inconsistencies that come from updating the same fact in multiple places — that reduction in redundancy is the entire point.",
    {
      0: "Query ordering is unrelated to normalisation.",
      2: "More tables is a side effect in some cases, not the goal itself — badly split tables with no reduction in redundancy is not \"normalised\".",
      3: "Only one field (or a defined combination) is the primary key per table; making every field one is not what normalisation does.",
    },
  ),
  q(
    "al-ict",
    "Database management",
    "What is the purpose of a foreign key in a relational database?",
    [
      "To encrypt sensitive data in a table",
      "To create a link between two tables by referencing the primary key of another table",
      "To automatically sort a table by date",
      "To store a backup copy of the primary key in the same table",
    ],
    1,
    "A foreign key's job is relational: it sits in one table and points at the primary key of another, which is how related data across tables stays connected.",
    {
      0: "Encryption is not a function of foreign keys.",
      2: "Sorting is unrelated to a foreign key's purpose.",
      3: "A foreign key references another table's primary key — it is not a duplicate stored in the same table.",
    },
  ),
  q(
    "al-ict",
    "Database management",
    "\"Justify the use of a database, rather than a spreadsheet, for a school's student records.\" Which answer earns the marks?",
    [
      "Databases look more professional than spreadsheets.",
      "A database enforces data integrity and relationships across related tables (students, classes, marks) and supports safe multi-user access, which a flat spreadsheet cannot do as records grow.",
      "Spreadsheets cannot store numbers.",
      "Databases are always free while spreadsheet software always costs money.",
    ],
    1,
    "\"Justify\" wants reasons tied specifically to this scenario — why a database suits growing, related, multi-user student records better than a single flat sheet, not a generic opinion.",
    {
      0: "\"Looks more professional\" is an opinion, not a reason grounded in the scenario.",
      2: "This is factually wrong — spreadsheets store numbers easily; that isn't the actual limitation being tested.",
      3: "Cost is not a fixed, generally true distinction between the two — both free and paid options exist for each.",
    },
    { source: "command_word_drill", commandWord: "Justify" },
  ),

  // ---- A/L ICT — System analysis and design --------------------------------
  q(
    "al-ict",
    "System analysis and design",
    "What is the main purpose of a feasibility study at the start of a systems development project?",
    [
      "To write the final user manual",
      "To assess whether the proposed system is practical — technically, economically and operationally — before committing resources to build it",
      "To test the finished system with real users",
      "To train staff on the new system",
    ],
    1,
    "A feasibility study happens before development starts, precisely to check whether the project is worth doing at all across technical, economic and operational dimensions.",
    {
      0: "Writing the user manual happens much later, closer to implementation.",
      2: "User testing happens after a system (or prototype) already exists, not before it is committed to.",
      3: "Staff training is part of implementation, which comes after the system is built — far later than a feasibility study.",
    },
  ),
];
