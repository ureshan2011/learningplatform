import type { Lesson, Unit } from "@/lib/types";

/** Shape the seed route fills in (tenantId, createdAt) before writing each unit. */
export type UnitSeed = Omit<Unit, "tenantId" | "createdAt">;

function lesson(
  id: string,
  order: number,
  title: string,
  periods: number,
  examObjectives: string[],
  importantAreas: string[],
  content?: string,
  /** The same notes in Sinhala. Omitted where they have not been written yet. */
  contentSi?: string,
): Lesson {
  return {
    id,
    order,
    title,
    periods,
    examObjectives,
    importantAreas,
    ...(content ? { content } : {}),
    ...(contentSi ? { contentSi } : {}),
  };
}

function unit(
  order: number,
  competencyNumber: number,
  gradeYear: 12 | 13,
  title: string,
  competencyStatement: string,
  lessons: Lesson[],
): UnitSeed {
  return {
    id: `al-ict-u${competencyNumber}`,
    subjectId: "al-ict",
    order,
    competencyNumber,
    gradeYear,
    title,
    competencyStatement,
    periods: lessons.reduce((sum, l) => sum + l.periods, 0),
    lessons,
  };
}

/**
 * Full A/L ICT (grades 12 and 13, effective from 2017) unit and lesson
 * breakdown, sourced from the NIE syllabus (nie.lk/pdffiles/tg/eALSyl ICT.pdf)
 * and cross-checked against the Grade 12/13 Teachers' Guides and the Grade 13
 * resource book. Every unit, competency level and period count here matches
 * the syllabus's own numbering and its "proposed number of periods" table —
 * nothing renumbered or re-chunked.
 *
 * `examObjectives` are the syllabus's learning outcomes condensed into
 * exam-actionable skills. `importantAreas` are exam-focus notes derived from
 * the syllabus's own period-weighting (more periods generally tracks more
 * marks) and the well-known Paper I (MCQ) / Paper II (structured + essay)
 * structure — treat them as a starting steer, not a substitute for checking
 * each year's actual past paper.
 *
 * No lesson has `content` populated yet — that is deliberate. This seed only
 * identifies the syllabus structure and the exam angle on each competency
 * level; full teaching content is authored separately, unit by unit.
 */
export const AL_ICT_UNITS: UnitSeed[] = [
  unit(1, 1, 12, "Concept of ICT", "Explores the basic concepts of ICT together with its role and applicability in today's knowledge based society", [
    lesson("1.1", 1, "Data, information and their life cycle", 6,
      [
        "Define data and information and distinguish clearly between them, with an example",
        "List the stages of the data life cycle: creation, management, removal of obsolete data",
        "State the characteristics of valuable information (timely, accurate, in context, understandable, low uncertainty)",
      ],
      [
        "\"Distinguish data from information\" is a near-annual short-answer opener",
        "Listing the characteristics of quality/valuable information is a common structured question",
      ],
      "Data is raw, unprocessed facts with no meaning attached yet — a number, a word, a single reading. Information is data that has been processed and given context, so it becomes useful for making a decision.\n\n25, 30, 28, 32 are just data on their own — four numbers with no story. Plot them against the days of the week and average them, and you get \"this week's temperature has been rising\" — that is information.\n\n- Data is the raw material: one exam score\n- Information is the finished product: a class average, a rank, a trend\n\n## The data life cycle\n\nEvery piece of data moves through three stages before it disappears again:\n\n- Creation — data is generated: a sensor reading, a form submission, a bank transaction\n- Management — data is stored, organised, backed up, and processed into information\n- Removal of obsolete data — data no longer accurate, needed, or legally required to keep is deleted or archived\n\nSkipping that third stage is not free. A system that never deletes old records slows every search down, and can breach data-protection law the moment it keeps something it no longer has a reason to hold.\n\n## What makes information valuable\n\nInformation is only worth acting on if it is:\n\n- Timely — it arrives while it can still be used\n- Accurate — free from errors introduced while collecting or processing it\n- In context — meaningful for the situation it is used in\n- Understandable — presented so the reader can actually interpret it\n- Low in uncertainty — trustworthy enough to base a decision on\n\nExam angle: a scenario question usually tests exactly one of these five properties at a time. Read for which one is missing, and answer that — don't list all five unless the question actually asks for them."),
    lesson("1.2", 2, "Why technology is needed to create, disseminate and manage information", 6,
      [
        "Explain the drawbacks of manual data processing (errors, duplication, delay, poor sharing)",
        "Describe how networks, the Internet, mobile computing and cloud computing overcame those drawbacks",
        "Give examples of information used in decision making, policy making, prediction, planning and monitoring",
      ],
      [
        "\"Why did ICT replace manual methods\" recurs as an essay-length Part A prompt",
        "The network → Internet → mobile → cloud timeline is a common short-essay question",
      ]),
    lesson("1.3", 3, "Abstract model of information creation", 2,
      [
        "Draw and label the input-process-output (IPO) abstract model",
        "Relate the IPO model to a computer system and to the general definition of a system",
      ],
      ["Low period weight — expect a quick diagram or definition question, rarely essay-length"]),
    lesson("1.4", 4, "Hardware, software and human components of a computer system", 2,
      [
        "Classify the hardware and software components of a computer system",
        "Distinguish proprietary from open-source software, with an advantage and disadvantage of each",
      ],
      ["Proprietary vs open-source comparison is a frequent short-structured question"]),
    lesson("1.5", 5, "Data processing activities", 4,
      [
        "List and describe the five data-processing steps: gathering, validation, processing, output, storage",
        "Identify data-gathering tools (OMR, OCR, MICR, card/tape readers, barcode readers, sensors) and validation methods (type/presence/range checks)",
        "Distinguish batch vs real-time processing, online vs offline input, and local vs cloud storage",
      ],
      [
        "Matching a named tool (OMR/OCR/MICR/barcode) to its purpose is a common MCQ pattern",
        "Batch vs real-time and online vs offline are a recurring paired short-answer question",
      ]),
    lesson("1.6", 6, "Application of ICT across domains", 4,
      [
        "Identify the ICT tools and skills used in education, healthcare, agriculture, business, engineering, tourism, media and law enforcement",
        "Discuss, in depth, the benefit ICT brings to at least two named domains",
      ],
      ["\"Discuss the use of ICT in domain X\" is a recurring Paper II Part A prompt — prepare 2-3 domains in real depth"]),
    lesson("1.7", 7, "Impact of ICT on society", 4,
      [
        "Explain the social and economic benefits of ICT",
        "Explain the social, economic, environmental, ethical, legal and privacy issues caused by ICT — piracy, phishing, copyright, plagiarism, licensing, digital divide, e-waste",
        "Relate ICT's role to the Sustainable Development Goals and to closing the digital divide",
      ],
      [
        "Ethical/legal/social issues (piracy, copyright, licensing) is a near-guaranteed structured question",
        "e-waste disposal and digital divide are common short-answer add-ons to the main question",
      ]),
  ]),

  unit(2, 2, 12, "Introduction to Computer", "Explores the evolution of computing devices, so as to be able to describe and compare the performance of modern computers", [
    lesson("2.1", 1, "Evolution and classification of computers", 4,
      [
        "Describe generations 1G-4G of computers with their defining technology and features, in tabular form",
        "Classify computers by technology (analog/digital), purpose (general/special) and size (super/mainframe/mini/micro, incl. mobile devices)",
      ],
      [
        "\"Complete the generations-of-computers table\" is a classic structured question",
        "Classify-by-example MCQs (e.g. what class a smartphone falls into) are common",
      ]),
    lesson("2.2", 2, "Hardware components and their interfaces", 6,
      [
        "Identify input devices, distinguishing direct-entry from keyboard-entry, and their interfaces",
        "Identify output devices and their features (CRT/TFT/LED monitors, dot-matrix/inkjet/laser/3D printers, plotters)",
        "Categorise storage devices and state the advantages of direct-entry input over keyboard-entry input",
      ],
      [
        "Matching a device to input/output/storage is heavily tested in MCQs",
        "\"Advantages of direct-entry input over keyboard entry\" is a recurring short-answer question",
      ]),
    lesson("2.3", 3, "Von-Neumann architecture and the fetch-execute cycle", 6,
      [
        "Draw and label the Von-Neumann architecture (CU, ALU, memory, I/O, data and control buses)",
        "Describe the stored-program concept and the fetch-execute cycle",
        "Explain why multi-core processors are needed",
      ],
      [
        "Drawing the Von-Neumann diagram from memory is one of the most frequently repeated essay/structured tasks in the whole syllabus",
        "Listing the fetch-execute cycle steps in order is a common short-answer question",
      ],
      `## The stored-program concept
Von Neumann's idea is that instructions and data live in the same memory, in the same form. Before it, changing a machine's program meant rewiring it. After it, a program is just data you load — which is why one computer can run a spreadsheet and a game.

## The five parts of the architecture
- Control unit (CU) — fetches and decodes instructions, and raises the control signals that make everything else act
- Arithmetic and logic unit (ALU) — does the arithmetic and the comparisons
- Main memory — holds instructions and data together, each in a numbered address
- Input and output — how data gets in and out
- Buses — the address bus (one direction, CPU to memory), the data bus (both directions) and the control bus (both directions)

The CU and the ALU together with the registers make up the CPU. A full-mark diagram has all five parts and all three buses, with arrowheads showing that the address bus is one-directional and the other two are not.

## The registers
- PC, the program counter — the address of the next instruction
- MAR, the memory address register — the address currently on the address bus
- MDR, the memory data register — whatever is in transit to or from memory. Some textbooks write MBR; it is the same register
- CIR, the current instruction register — the instruction being carried out right now
- ACC, the accumulator — where the ALU keeps the working value

## The cycle itself
Fetch is the same four steps for every instruction, without exception:

- MAR ← PC
- MDR ← contents of the address held in MAR
- PC ← PC + 1
- CIR ← MDR

Decode is next: the control unit splits the instruction now in CIR into an opcode and an address part, and works out which control signals to raise.

Execute is last, and is the only phase that depends on which instruction it is.

## Two places marks are lost
The PC is incremented during the fetch, not after the instruction has run. That is exactly why a jump instruction has to overwrite the PC rather than add to it: by the time the jump executes, the PC has already moved on.

MDR carries data in both directions. On a LOAD it brings a value in from memory; on a STORE it carries the accumulator's value out to memory. Describing it as an input-only register is wrong.

## Why multi-core processors are needed
Everything above runs one instruction at a time, and every instruction and every piece of data has to travel the same path between CPU and memory. That single path is the von Neumann bottleneck: past a point, making the CPU faster stops helping because it is waiting on memory. Several complete cores, each with its own fetch-execute machinery and sharing the memory, is one answer to it.`,
      `## ගබඩා කළ වැඩසටහන් සංකල්පය
Von Neumann ගේ අදහස තමයි විධාන සහ දත්ත එකම මතකයේ, එකම ආකාරයෙන් තියෙන එක. ඊට කලින් යන්ත්‍රයක වැඩසටහන වෙනස් කරන්න නම් රැහැන් ආයෙත් සම්බන්ධ කරන්න වුණා. ඊට පස්සේ වැඩසටහනත් load කරන දත්ත විතරයි — ඒකයි එකම පරිගණකයකින් spreadsheet එකකුත් game එකකුත් run කරන්න පුළුවන් වෙන්නේ.

## ගෘහ නිර්මාණයේ ප්‍රධාන කොටස් පහ
- පාලක ඒකකය (CU) — විධාන ලබාගෙන විකේතනය කරලා, අනිත් හැම දෙයක්ම වැඩ කරවන control signal නිකුත් කරනවා
- අංක ගණිත හා තාර්කික ඒකකය (ALU) — අංක ගණිතයයි සංසන්දනයයි කරනවා
- ප්‍රධාන මතකය — විධානයි දත්තයි එකට තියාගන්නවා, හැම එකක්ම අංකිත ලිපිනයක
- ආදාන සහ ප්‍රතිදාන — දත්ත ඇතුළට සහ පිටතට යන ක්‍රමය
- බස් — ලිපින බසය (එක දිශාවට, CPU එකේ සිට මතකයට), දත්ත බසය (දෙපැත්තට) සහ පාලක බසය (දෙපැත්තට)

CU එකයි ALU එකයි register එක්ක එකතු වෙලා CPU එක හැදෙනවා. පූර්ණ ලකුණු ගන්න රූප සටහනක කොටස් පහම, බස් තුනම තියෙන්න ඕන, ලිපින බසය එක දිශාවට කියලා පෙන්නන ඊතල හිස් එක්ක.

## Register
- PC, program counter — ඊළඟ විධානයේ ලිපිනය
- MAR, memory address register — දැන් ලිපින බසයේ තියෙන ලිපිනය
- MDR, memory data register — මතකයට යන හෝ මතකයෙන් එන දේ. සමහර පොත්වල මේකට MBR කියනවා
- CIR, current instruction register — දැන් ක්‍රියාත්මක වෙන විධානය
- ACC, accumulator — ALU එක වැඩ කරන අගය තියාගන්න තැන

## චක්‍රය
Fetch කියන්නේ හැම විධානයකටම එකම පියවර හතරයි, කිසි විටෙක වෙනසක් නෑ:

- MAR ← PC
- MDR ← MAR එකේ තියෙන ලිපිනයේ අන්තර්ගතය
- PC ← PC + 1
- CIR ← MDR

ඊට පස්සේ decode: පාලක ඒකකය CIR එකේ තියෙන විධානය opcode එකයි ලිපින කොටසයි කියලා වෙන් කරලා, මොන control signal ද ඕන කියලා තීරණය කරනවා.

අන්තිමට execute: තුන් අදියරෙන් විධානය අනුව වෙනස් වෙන එකම අදියර මේකයි.

## ලකුණු නැති වෙන තැන් දෙකක්
PC එක වැඩි වෙන්නේ fetch එක අතරතුරදී, විධානය run වෙලා ඉවර වුණාට පස්සේ නෙවෙයි. jump විධානයකට PC එකට එකතු කරනවා වෙනුවට overwrite කරන්නම වෙන්නේ හරියටම ඒ නිසයි — jump එක run වෙනකොට PC එක දැනටමත් ඉස්සරහට ගිහින්.

MDR එකෙන් දත්ත දෙපැත්තටම යනවා. LOAD එකකදී මතකයෙන් අගයක් ඇතුළට ගේනවා; STORE එකකදී accumulator එකේ අගය පිටතට මතකයට ගෙනියනවා. ඒක ආදාන register එකක් විතරයි කියන එක වැරදියි.

## Multi-core processor ඕන වෙන්නේ ඇයි
උඩ කියපු හැම දෙයක්ම එක වෙලාවකට එක විධානයක් run කරනවා, හැම විධානයක්ම හැම දත්තයක්ම CPU එකයි මතකයයි අතර එකම මාර්ගයෙන් යන්න ඕන. ඒ එකම මාර්ගය තමයි von Neumann bottleneck එක: එක තැනකට පස්සේ CPU එක වේගවත් කරලා වැඩක් නෑ, මොකද ඒක මතකය එනකම් බලාගෙන ඉන්නවා. හැම එකකටම තමන්ගේම fetch-execute යාන්ත්‍රණය තියෙන, මතකය බෙදාගන්න core කීපයක් තියෙන එක ඒකට තියෙන එක උත්තරයක්.`),
    lesson("2.4", 4, "Memory hierarchy and PC memory system", 6,
      [
        "Explain the need for a memory hierarchy and its comparison criteria (access time, capacity, cost)",
        "Compare volatile memory (registers, cache, RAM incl. SRAM/DRAM/SDRAM) and non-volatile memory (ROM/PROM/EPROM/EEPROM, secondary storage)",
        "Compare memory types by access time, cost per MB, capacity and physical arrangement of data",
      ],
      [
        "Comparison tables of RAM vs ROM vs cache are a recurring structured question",
        "\"Why is a memory hierarchy needed\" is a regular short-essay question",
      ]),
  ]),

  unit(3, 3, 12, "Data Representation", "Investigates how instructions and data are represented in computers and exploit them in arithmetic and logic operations", [
    lesson("3.1", 1, "Number systems and representation of numbers", 10,
      [
        "Convert between decimal, binary, octal and hexadecimal in both directions",
        "Represent signed integers using signed-magnitude, one's complement and two's complement",
        "Explain the role of the MSB as a sign bit and why two's complement is preferred for arithmetic",
      ],
      [
        "Number-system conversion and complement questions are near-guaranteed every year — in MCQ as quick conversions and in Paper II Part A as multi-step problems",
        "Two's complement is the single most consistently examined numeric skill in this unit — drill it until automatic",
      ]),
    lesson("3.2", 2, "Character representation", 4,
      [
        "List character-encoding schemes: BCD, EBCDIC, ASCII, Unicode",
        "Convert a given symbol or string into a stated encoding scheme",
        "State an advantage/disadvantage of each scheme (e.g. ASCII's limited range vs Unicode's multilingual support)",
      ],
      ["\"Why is Unicode needed for Sinhala/Tamil text\" is a common local-context question"]),
    lesson("3.3", 3, "Binary arithmetic and bitwise logic operations", 4,
      [
        "Add and subtract multi-digit binary integers, with carry/borrow shown",
        "Perform bitwise NOT, AND, OR and XOR operations on binary numbers",
      ],
      [
        "Binary addition/subtraction with full working shown is a reliable Paper II Part A question",
        "Bitwise-operation MCQs (evaluate the result) are common",
      ]),
  ]),

  unit(4, 4, 12, "Fundamentals of Digital Circuits", "Uses logic gates to design basic digital circuits and devices", [
    lesson("4.1", 1, "Basic and universal logic gates", 6,
      [
        "Name and draw the symbols of NOT, AND, OR, XOR, NAND, NOR and XNOR gates",
        "Construct truth tables for basic and combinational gates, up to three inputs",
        "Explain why NAND/NOR are universal gates and build a given gate using only NAND/NOR",
      ],
      [
        "Drawing gate symbols and truth tables from a given expression is asked almost every year",
        "\"Build gate X using only NAND/NOR\" is a recurring, higher-mark question",
      ]),
    lesson("4.2", 2, "Boolean algebra and Karnaugh map simplification", 8,
      [
        "State and apply Boolean postulates/laws: commutative, associative, distributive, identity, redundancy, De Morgan's",
        "Convert a truth table to SOP/POS form and transform between SOP and POS",
        "Simplify Boolean expressions using theorems and using a Karnaugh map",
      ],
      [
        "Karnaugh map simplification (up to 3-4 variables) is one of the highest-value recurring essay questions in this unit — practise until it is routine",
        "De Morgan's law application is a frequent MCQ/short-answer trap question",
      ],
      `## Why simplify at all
Two circuits with the same truth table behave identically, so the smaller one always wins. Every gate removed is a gate that costs money, draws power, takes board space and adds propagation delay. Simplification is not tidying up; it is the design work.

## The laws worth knowing by heart
- Identity: A + 0 = A and A · 1 = A
- Null: A + 1 = 1 and A · 0 = 0
- Idempotent: A + A = A and A · A = A
- Complement: A + A' = 1 and A · A' = 0
- Double negation: (A')' = A
- Absorption: A + AB = A and A(A + B) = A
- Distributive: A(B + C) = AB + AC, and also A + BC = (A + B)(A + C)
- De Morgan: (A · B)' = A' + B' and (A + B)' = A' · B'

Two of those catch people out. The second distributive law has no equivalent in ordinary algebra, so it does not feel right and gets skipped. And De Morgan is the one that appears most often, because it is how any expression is converted to NAND-only or NOR-only form — which is asked because real circuits are built from universal gates.

## Sum of products and product of sums
From a truth table, SOP is built from the rows where the output is 1: one product term per row, each variable negated where it is 0, all added together. POS is built from the rows where the output is 0: one sum term per row, each variable negated where it is 1, all multiplied together. Both describe the same function.

## Reading a Karnaugh map
Write the rows and columns in Gray code — 00, 01, 11, 10 — never in counting order. The whole method depends on it, because neighbouring cells must differ in exactly one variable: 01 to 11 changes one bit, but 01 to 10 changes two.

Then group the 1s by these rules:

- Groups must be rectangular and of size 1, 2, 4, 8 or 16. Never 3, never 6
- Bigger is better: each doubling of a group removes one more variable from its term
- Groups may overlap, and usually should
- The edges wrap around. The left column is adjacent to the right, the top row to the bottom, and the four corners form one group of four
- Every 1 must be inside at least one group
- Use as few groups as you can

For each group, write down the variables that stay the same right across it, negated where they are 0, and drop the variables that change. Add the terms together.

## Don't-care conditions
An X marks a combination that cannot occur or whose output does not matter — an invalid BCD code, for instance. Treat each X as a 1 wherever that makes a group bigger, and as a 0 wherever it does not. You are never obliged to cover an X.

## The trap in the exam
Stopping at the first set of groups that happens to cover every 1. The question asks for the simplest expression, not for a correct one, and a correct-but-larger answer loses marks.

Find the forced groups first. If a cell can be reached by only one possible group, that group has to be in the answer. Put those down, and the choices left over shrink sharply.`,
      `## සරල කරන්නේ ඇයි
එකම සත්‍යතා වගුව තියෙන පරිපථ දෙකක් එකම විදිහට වැඩ කරනවා, ඒ නිසා පොඩි එක හැම වෙලාවෙම දිනනවා. අයින් කරන හැම ද්වාරයක්ම මුදල්, විදුලිය, board එකේ ඉඩ සහ ප්‍රමාදය ඉතිරි කරනවා. සරල කිරීම කියන්නේ පිළිවෙළට තියන එක නෙවෙයි, ඒක තමයි නිර්මාණ කාර්යය.

## හොඳට මතක තියාගන්න ඕන නීති
- Identity: A + 0 = A සහ A · 1 = A
- Null: A + 1 = 1 සහ A · 0 = 0
- Idempotent: A + A = A සහ A · A = A
- Complement: A + A' = 1 සහ A · A' = 0
- ද්විත්ව නිශේධනය: (A')' = A
- Absorption: A + AB = A සහ A(A + B) = A
- Distributive: A(B + C) = AB + AC, ඒ වගේම A + BC = (A + B)(A + C)
- De Morgan: (A · B)' = A' + B' සහ (A + B)' = A' · B'

ඒ අතරින් දෙකක් ගොඩක් අය මඟ හරිනවා. දෙවෙනි distributive නීතියට සාමාන්‍ය වීජ ගණිතයේ සමානයක් නෑ, ඒ නිසා ඒක හරි වගේ දැනෙන්නේ නෑ. De Morgan තමයි වැඩිපුරම එන්නේ, මොකද ඕනම ප්‍රකාශනයක් NAND විතරක් හෝ NOR විතරක් වෙත හරවන්නේ ඒකෙන් — ඇත්ත පරිපථ හැදෙන්නේ universal ද්වාරවලින් නිසා ඒක අහනවා.

## Sum of products සහ product of sums
සත්‍යතා වගුවකින්, ප්‍රතිදානය 1 වෙන පේළිවලින් SOP හැදෙනවා: පේළියකට එක ගුණිත පදයක්, 0 තියෙන තැන් නිශේධනය කරලා, ඔක්කොම එකතු කරලා. ප්‍රතිදානය 0 වෙන පේළිවලින් POS හැදෙනවා: පේළියකට එක ඓක්‍ය පදයක්, 1 තියෙන තැන් නිශේධනය කරලා, ඔක්කොම ගුණ කරලා. දෙකෙන්ම විස්තර වෙන්නේ එකම ශ්‍රිතයයි.

## Karnaugh සිතියමක් කියවන හැටි
පේළියි තීරුයි Gray code එකෙන් ලියන්න — 00, 01, 11, 10 — ගණන් කරන පිළිවෙළට කවදාවත් නෙවෙයි. මුළු ක්‍රමයම රඳා පවතින්නේ ඒක උඩයි, මොකද යාබද කොටු දෙකක් වෙනස් වෙන්න ඕන හරියටම එක විචල්‍යයකින්: 01 සිට 11 දක්වා වෙනස් වෙන්නේ එක bit එකක්, හැබැයි 01 සිට 10 දක්වා bit දෙකක්.

ඊට පස්සේ 1 සමූහගත කරන්න:

- සමූහ සෘජුකෝණාස්‍රාකාර විය යුතුයි, ප්‍රමාණය 1, 2, 4, 8 හෝ 16. කවදාවත් 3 නෙවෙයි, 6 නෙවෙයි
- ලොකු නම් හොඳයි: සමූහයක් දෙගුණ වුණාම පදයෙන් තව විචල්‍යයක් අයින් වෙනවා
- සමූහ එකිනෙක උඩ තියෙන්න පුළුවන්, බොහෝ විට තියෙන්නත් ඕන
- දාර එකතු වෙනවා. වම් තීරුව දකුණු තීරුවට යාබදයි, උඩ පේළිය යට පේළියට යාබදයි, කොන් හතර එකම හතරේ සමූහයක්
- හැම 1 එකක්ම අඩුම තරමේ එක සමූහයක හරි තියෙන්න ඕන
- පුළුවන් තරම් සමූහ ගණන අඩු කරන්න

හැම සමූහයකටම, ඒ සමූහය පුරාම වෙනස් නොවී තියෙන විචල්‍ය ලියන්න, 0 තියෙන තැන් නිශේධනය කරලා, වෙනස් වෙන විචල්‍ය අතහරින්න. පද ඔක්කොම එකතු කරන්න.

## Don't care තත්ත්ව
X එකකින් කියවෙන්නේ ඒ සංයෝගය සිද්ධ වෙන්නේ නෑ, නැත්නම් ඒකේ ප්‍රතිදානය වැදගත් නෑ කියලා — උදාහරණයක් විදිහට වලංගු නොවන BCD කේතයක්. සමූහයක් ලොකු වෙනවා නම් X එක 1 විදිහට ගන්න, නැත්නම් 0 විදිහට. X එකක් ආවරණය කරන්නම ඕන කියලා නීතියක් නෑ.

## විභාගයේ උගුල
හැම 1 එකක්ම ආවරණය වෙන පළමු සමූහ කට්ටලය ලැබුණු ගමන් නවතින එක. ප්‍රශ්නයෙන් අහන්නේ සරලම ප්‍රකාශනය මිසක් හරි එකක් නෙවෙයි, ඒ නිසා හරි වුණාට ලොකු උත්තරයකට ලකුණු නැති වෙනවා.

මුලින්ම අනිවාර්ය සමූහ හොයන්න. එක සමූහයකට විතරක් ළඟා වෙන්න පුළුවන් කොටුවක් තියෙනවා නම්, ඒ සමූහය උත්තරයේ තියෙන්නම ඕන. ඒවා මුලින්ම දාගත්තම ඉතුරු තෝරගැනීම් ගොඩක් අඩු වෙනවා.`),
    lesson("4.3", 3, "Designing simple digital circuits", 6,
      [
        "Derive a logic expression and truth table from a stated real-world requirement, up to three inputs",
        "Draw the resulting digital circuit using logic gates",
      ],
      ["\"Design a circuit for scenario X\" (e.g. an alarm or voting system) is a classic essay-length question that combines 4.1-4.3"]),
    lesson("4.4", 4, "Combinational and sequential circuits in the CPU", 6,
      [
        "Derive the truth table and logic expression for a half adder and a full adder",
        "Explain how a flip-flop uses a feedback loop to store one bit",
      ],
      [
        "Half adder / full adder truth table and circuit diagram is a very frequently repeated essay component",
        "A flip-flop's role in memory is a common question linking back to Unit 2's registers",
      ]),
  ]),

  unit(5, 5, 12, "Computer Operating System", "Uses operating systems to manage the functionality of computers", [
    lesson("5.1", 1, "What an operating system is, and its main functions", 4,
      [
        "Define an operating system and briefly describe its evolution",
        "List the main functions of an OS: providing interfaces, process management, resource management, security",
        "Classify OS types: single/multi user, single/multi task, multi-threading, real-time, time-sharing",
      ],
      [
        "Classify-by-scenario MCQs (\"a system controlling a nuclear plant is classified as...\") are common",
        "Listing the four main OS functions is a reliable short-answer question",
      ]),
    lesson("5.2", 2, "File and directory management", 6,
      [
        "Explain file types/extensions, file hierarchy and file systems (e.g. FAT)",
        "Describe file security (passwords, access privileges) and storage allocation methods: contiguous, linked, indexed",
        "Explain defragmentation and the need for disk formatting",
      ],
      [
        "Comparing contiguous/linked/indexed allocation is a recurring structured question",
        "Explaining defragmentation with a diagram is common",
      ]),
    lesson("5.3", 3, "Process management", 6,
      [
        "Distinguish a process from a program and list the process states",
        "Draw and explain the seven-state process transition diagram",
        "Compare long/short/medium-term schedulers and describe the process control block",
      ],
      [
        "The seven-state process transition diagram is one of the most consistently examined diagrams in this unit",
        "Turnaround, response, throughput and waiting time definitions form a frequent short-answer set",
      ],
      `## A process is not a program
A program is a file sitting on disk. A process is that program in execution — the code, its data, and a record of how far it has got. Open the same program twice and you have one program and two processes.

The operating system tracks each one in a process control block (PCB), which holds the process id, its current state, the saved contents of the PC and the other registers, its memory limits, its open files and its accounting information. A context switch is the OS saving one PCB and loading another. It is not free, and that cost is the whole argument against a very small time quantum.

## The seven states
- New — being created, PCB being set up
- Ready — in main memory, has everything it needs except the CPU
- Running — actually executing. On a single core, exactly one process
- Blocked, also called waiting — waiting for an event such as an I/O completion
- Ready/suspend — runnable, but swapped out to disk to free memory
- Blocked/suspend — swapped out to disk and still waiting for its event
- Exit — finished, resources released

The five-state model leaves out the two suspended states. This syllabus asks for seven, so include them.

## The transitions, which is what gets asked
- Ready to running is dispatch, done by the short-term scheduler
- Running to ready is a time-out when the quantum expires, or pre-emption by a higher-priority process
- Running to blocked is the process requesting I/O
- Blocked to ready is the awaited event completing
- Ready to ready/suspend, and blocked to blocked/suspend, is the medium-term scheduler swapping a process out to disk
- Blocked/suspend to ready/suspend is the event completing while the process is still swapped out
- Running to exit is the process finishing

Blocked never goes straight to running. When its event completes it joins the ready queue and waits its turn like everything else.

## The three schedulers
- Long-term — decides which jobs are admitted into the system at all, controlling the degree of multiprogramming
- Medium-term — swaps processes out to disk and back, which is what creates the two suspended states
- Short-term — decides which ready process runs next. Runs most often, so it must be fast

## Scheduling algorithms
- First come, first served — runs in arrival order, each to completion. Simple and nobody starves, but one long process at the front delays everything behind it. That is the convoy effect
- Shortest job first — picks the shortest of the processes that have arrived. Gives the lowest possible average waiting time, but the burst time has to be known in advance, and a steady supply of short jobs can starve a long one indefinitely
- Round robin — each process gets at most one quantum, then goes to the back of the queue. Fair and responsive, which is what makes time sharing work. Too small a quantum and the CPU spends its time context switching; too large and it degenerates into first come, first served
- Priority — highest priority runs first. Starves low-priority processes unless their priority rises the longer they wait, which is called ageing

## Doing the calculation
- Turnaround time = completion time − arrival time
- Waiting time = turnaround time − burst time
- Response time = first time on the CPU − arrival time
- Average = the total divided by the number of processes

Draw the Gantt chart first and label every boundary time, because every number in the table is read off it. An error in the chart is an error in the entire answer.

For round robin there is one rule that decides whether your chart matches the marking scheme: when a quantum expires, any process that arrived during that quantum joins the ready queue before the process that was just pre-empted rejoins it.`,
      `## ක්‍රියාවලියක් කියන්නේ වැඩසටහනක් නෙවෙයි
වැඩසටහනක් කියන්නේ disk එකේ තියෙන ගොනුවක්. ක්‍රියාවලියක් කියන්නේ ඒ වැඩසටහන ක්‍රියාත්මක වෙන එක — කේතය, ඒකේ දත්ත, සහ කොහෙද ඉන්නේ කියන සටහන. එකම වැඩසටහන දෙපාරක් open කළොත් වැඩසටහන එකයි, ක්‍රියාවලි දෙකයි.

මෙහෙයුම් පද්ධතිය හැම එකක්ම process control block (PCB) එකකින් හොයාගන්නවා. ඒකේ ක්‍රියාවලියේ අංකය, දැන් තියෙන තත්ත්වය, PC එකේ සහ අනිත් register වල save කරපු අගයන්, මතක සීමා, විවෘත ගොනු සහ ගිණුම් තොරතුරු තියෙනවා. Context switch එකක් කියන්නේ OS එක එක PCB එකක් save කරලා තව එකක් load කරන එක. ඒක නොමිලේ නෙවෙයි, ඒ වියදම තමයි ගොඩක් කුඩා time quantum එකකට විරුද්ධ තර්කය.

## තත්ත්ව හත
- New — හැදෙමින්, PCB එක සකස් වෙමින්
- Ready — ප්‍රධාන මතකයේ, CPU එක හැර අනිත් හැම දෙයක්ම තියෙනවා
- Running — ඇත්තටම ක්‍රියාත්මක වෙනවා. Single core එකක එකම එකක් විතරයි
- Blocked, නැත්නම් waiting — I/O එකක් වගේ සිදුවීමක් එනකම් බලාගෙන
- Ready/suspend — run කරන්න පුළුවන්, හැබැයි මතකය නිදහස් කරන්න disk එකට swap කරලා
- Blocked/suspend — disk එකට swap කරලා, තාමත් සිදුවීමක් එනකම් බලාගෙන
- Exit — ඉවරයි, සම්පත් නිදහස් කරලා

තත්ත්ව පහේ ආකෘතියේ suspend තත්ත්ව දෙක නෑ. මේ විෂය නිර්දේශයෙන් අහන්නේ හත, ඒ නිසා ඒ දෙකත් ලියන්න.

## සංක්‍රමණ — අහන්නේ මේවායි
- Ready සිට running දක්වා යන්නේ dispatch එකෙන්, short-term scheduler එකෙන්
- Running සිට ready දක්වා යන්නේ quantum එක ඉවර වුණාම (time-out), නැත්නම් වැඩි ප්‍රමුඛතාවක් තියෙන එකකින් pre-empt වුණාම
- Running සිට blocked දක්වා යන්නේ ක්‍රියාවලිය I/O එකක් ඉල්ලුවම
- Blocked සිට ready දක්වා යන්නේ බලාගෙන හිටපු සිදුවීම ඉවර වුණාම
- Ready සිට ready/suspend දක්වා, සහ blocked සිට blocked/suspend දක්වා යන්නේ medium-term scheduler එක disk එකට swap කරාම
- Blocked/suspend සිට ready/suspend දක්වා යන්නේ පිටත ඉද්දීම සිදුවීම ඉවර වුණාම
- Running සිට exit දක්වා යන්නේ ක්‍රියාවලිය ඉවර වුණාම

Blocked එකේ ඉඳන් කෙලින්ම running එකට කවදාවත් යන්නේ නෑ. සිදුවීම ඉවර වුණාම ready පෝලිමට ඇවිත් අනිත් අය වගේම වාරය එනකම් ඉන්නවා.

## Scheduler තුන
- Long-term — කොයි වැඩ පද්ධතියට ඇතුළු කරනවද කියලා තීරණය කරනවා, multiprogramming මට්ටම පාලනය කරනවා
- Medium-term — ක්‍රියාවලි disk එකට swap කරලා ආපහු ගේනවා. Suspend තත්ත්ව දෙක හැදෙන්නේ ඒකෙන්
- Short-term — ඊළඟට run වෙන්නේ මොන ready ක්‍රියාවලියද කියලා තීරණය කරනවා. වැඩිපුරම run වෙන නිසා වේගවත් වෙන්න ඕන

## Scheduling ඇල්ගොරිතම
- First come, first served — පැමිණි පිළිවෙළට, එකක් ඉවර වෙනකම් ඊළඟ එක නෑ. සරලයි, starvation නෑ, හැබැයි ඉස්සරහින් තියෙන දිග එකක් නිසා පිටිපස්සේ ඔක්කොම බලාගෙන ඉන්නවා — convoy effect
- Shortest job first — ඇවිත් තියෙන ඒවායින් කෙටිම එක. සාමාන්‍ය රැඳී සිටීමේ කාලය අඩුම වෙනවා, හැබැයි burst කාලය කලින් දැනගෙන ඉන්න ඕන, දිග එකකට කවදාවත් වාරය නොලැබී යන්නත් පුළුවන්
- Round robin — හැම එකකටම එක quantum එකක්, ඊට පස්සේ පෝලිමේ අගට. සාධාරණයි, ඉක්මනින් ප්‍රතිචාර දෙනවා, time sharing එකේ පදනම ඒකයි. Quantum එක ගොඩක් කුඩා නම් CPU එක context switch කරගෙන ඉන්නවා; ගොඩක් ලොකු නම් ඒක FCFS එකක් වෙනවා
- Priority — වැඩිම ප්‍රමුඛතාවය මුලින්. බලාගෙන ඉන්න තරමට ප්‍රමුඛතාවය වැඩි නොකළොත් (ageing) අඩු ප්‍රමුඛතා ක්‍රියාවලි starve වෙනවා

## ගණනය කරන හැටි
- හැරවුම් කාලය = සම්පූර්ණ වන කාලය − පැමිණීමේ කාලය
- රැඳී සිටීමේ කාලය = හැරවුම් කාලය − burst කාලය
- ප්‍රතිචාර කාලය = පළමු වතාවට CPU එකට ආ වෙලාව − පැමිණීමේ කාලය
- සාමාන්‍යය = එකතුව ÷ ක්‍රියාවලි ගණන

මුලින්ම Gantt ප්‍රස්තාරය අඳින්න, හැම මායිම් වෙලාවක්ම ලියන්න. වගුවේ හැම අංකයක්ම කියවන්නේ ඒකෙන්, ඒ නිසා ප්‍රස්තාරයේ වැරැද්දක් කියන්නේ මුළු උත්තරයේම වැරැද්දක්.

Round robin එකට ඔබේ ප්‍රස්තාරය marking scheme එකට ගැළපෙනවද කියලා තීරණය කරන නීතිය එකයි: quantum එකක් ඉවර වුණාම, ඒ quantum එක ඇතුළේ ආපු ඕනම ක්‍රියාවලියක් ready පෝලිමට එකතු වෙන්නේ, pre-empt වුණු ක්‍රියාවලිය ආපහු පෝලිමට එකතු වෙන්න කලින්.`),
    lesson("5.4", 4, "Memory and I/O device management", 6,
      [
        "Explain the role of the Memory Management Unit and virtual memory (paging)",
        "Describe how the OS manages I/O devices through device drivers and spooling",
      ],
      [
        "Explaining virtual memory/paging is a recurring structured question",
        "Spooling and device drivers form a common short-answer pair",
      ]),
  ]),

  unit(6, 6, 12, "Data Communication and Networking", "Explores the data communication and computer networking technologies to share information effectively", [
    lesson("6.1", 1, "Signals and their properties", 4,
      [
        "Represent digital and analog signals graphically",
        "Solve numeric problems relating amplitude, frequency, wavelength and phase",
      ],
      ["Signal-property calculation questions are common in Paper II Part A"]),
    lesson("6.2", 2, "Signal transmission media", 4,
      [
        "Classify guided media (twisted pair, coaxial cable, fibre optics) vs unguided media",
        "Explain how latency, bandwidth, noise, attenuation and distortion affect transmission",
      ],
      ["Comparing guided media types on cost, speed and interference is a frequent structured question"]),
    lesson("6.3", 3, "Digital data encoding", 4,
      [
        "Represent digital data using two-voltage-level encoding and Manchester encoding",
        "Explain the need for synchronization and how a parity bit detects a bit error",
      ],
      ["Drawing a Manchester-encoded waveform for a given bit string is a recurring essay task"]),
    lesson("6.4", 4, "PSTN and modems", 4,
      [
        "Describe a PSTN as an analog voice-carrying line",
        "Explain modulation and demodulation and draw a schematic of two computers connected via modems over a PSTN line",
      ],
      ["A modem-connection schematic diagram is a common short structured question"]),
    lesson("6.5", 5, "Network topologies", 4,
      [
        "Explain why all-to-all connections are impractical, and describe bus topology and its media-access problem",
        "Draw and compare star, ring, mesh and bus topologies, and explain the role of hubs and switches",
      ],
      ["Topology diagrams with advantages/disadvantages are a very frequent structured or essay question"]),
    lesson("6.6", 6, "Media Access Control (MAC) protocol", 4,
      [
        "Explain the need for MAC addresses and frames as the unit of transmission",
        "Describe the evolution of media-access protocols from ALOHA to Ethernet",
      ],
      ["\"Why is a MAC protocol needed on a shared bus\" is a recurring short-essay prompt"]),
    lesson("6.7", 7, "Interconnecting networks to form the Internet", 6,
      [
        "Explain the role of a gateway and the need for globally unique addressing independent of MAC/LAN technology",
        "Calculate subnet masks and IP address ranges for a given block of addresses and network size",
        "Describe DHCP, private IP addresses, routing/packet switching and best-effort delivery",
      ],
      [
        "Subnetting and CIDR calculation is one of the highest-value, most consistently examined numeric skills across the whole exam — work through several full examples",
        "IPv4 address scarcity and the case for IPv6 is a common short-answer add-on",
      ]),
    lesson("6.8", 8, "Transport protocols", 4,
      [
        "Explain why process-to-process (not just host-to-host) delivery is needed, and the role of port numbers/multiplexing",
        "Compare TCP and UDP properties and list applications that use each",
      ],
      ["A TCP vs UDP comparison table is a near-guaranteed structured question"]),
    lesson("6.9", 9, "Applications on the Internet: DNS and HTTP", 4,
      [
        "Explain why DNS translates human-friendly names to IP addresses, and describe its hierarchical structure",
        "Describe a simple HTTP GET request/response and the client-server model",
      ],
      ["A DNS hierarchy diagram plus \"role of DNS\" explanation recurs often"]),
    lesson("6.10", 10, "TCP/IP and OSI reference models", 4,
      [
        "List and describe the layers of the TCP/IP and OSI models and the function of each",
        "State the data unit (packet/frame/bit) associated with each relevant layer",
      ],
      ["\"List the OSI/TCP-IP layers in order with one function each\" is one of the most reliably repeated questions in the entire syllabus — treat it as certain to appear"]),
    lesson("6.11", 11, "Security of communication and connected devices", 4,
      [
        "Explain public-key/private-key encryption and digital signatures at a basic level",
        "Describe threats (viruses, trojans, malware, phishing) and protections (firewalls, antivirus, awareness)",
      ],
      ["Threat-to-protection matching questions are common; public/private key roles are a frequent short-answer"]),
    lesson("6.12", 12, "ISPs and connecting home networks", 4,
      [
        "Describe the role of an ISP and how modems/DSL/ADSL connect a home to it",
        "Explain the role of NAT/proxies in a home LAN that uses private IPs",
      ],
      ["NAT's purpose in a private-IP home LAN is a recurring short-structured question"]),
  ]),

  unit(7, 7, 13, "System Analysis and Design", "Explores the systems concept and uses systems analysis and design methodology in developing information systems", [
    lesson("7.1", 1, "Characteristics of systems", 4,
      [
        "Define a system and list its characteristics",
        "Classify systems as open/closed, natural/manmade, living/physical — with examples",
      ],
      ["Classify-with-example short questions are a common warm-up mark"]),
    lesson("7.2", 2, "Types of manmade information systems", 4,
      [
        "Compare OAS, TPS, MIS, DSS, ESS, GIS, KMS, CMS and ERPS by objective and functionality",
      ],
      ["Matching a system type to a described business scenario is a frequent MCQ/short-answer format"]),
    lesson("7.3", 3, "System development lifecycle models and methodologies", 8,
      [
        "List and describe the waterfall, spiral, agile, prototyping and RAD models",
        "Compare structured vs object-oriented development methodologies",
      ],
      ["Comparing waterfall vs spiral vs agile, each with its own diagram, is a frequent essay component"]),
    lesson("7.4", 4, "Structured System Analysis and Design Methodology (SSADM)", 2,
      [
        "Define SSADM and list the SDLC stages it covers",
      ],
      ["Only 2 periods allocated — expect a short definitional question, not an essay"]),
    lesson("7.5", 5, "Preliminary investigation and feasibility study", 4,
      [
        "Describe the tasks of preliminary investigation and how information problems/priorities are identified",
        "Explain technical, economic, operational and organizational feasibility",
      ],
      ["\"Describe the four types of feasibility\" is a reliable short-structured question"]),
    lesson("7.6", 6, "Requirement analysis: DFDs, BAM and logical data modelling", 18,
      [
        "Distinguish functional from non-functional requirements and write requirements in IEEE-style form",
        "Draw a Business Activity Model, context diagram, document flow diagram and levelled Data Flow Diagrams (DFDs) for a given scenario",
        "Write Elementary Process Descriptions (EPDs) and draw a Logical Data Structure (LDS)",
        "Propose and justify a Business System Option (BSO)",
      ],
      [
        "DFD drawing (context diagram plus level-1, with correct process/data-store/external-entity/data-flow notation) is the single most heavily weighted diagram-drawing skill in the whole A/L ICT syllabus — the essay question to prioritise",
        "EPD writing in structured pseudocode and BSO justification are near-certain companion sub-questions",
      ]),
    lesson("7.7", 7, "Logical and physical design of the proposed system", 14,
      [
        "Produce logical DFDs and elementary process descriptions for the proposed (to-be) system",
        "Design a user interface and a logical data structure for the proposed system",
        "Specify table/record specifications and a data dictionary for the physical database design",
      ],
      ["\"Reconstruct the logical design from elementary processes to context diagram\" (and vice versa) is a recurring, high-mark essay question — practise both directions"]),
    lesson("7.8", 8, "Development and testing", 6,
      [
        "List the testing methods: white-box, black-box, unit, integration, system, acceptance testing",
        "Describe what each testing method checks and when it is used",
      ],
      ["Matching a testing method to its purpose is a common short-structured question"]),
    lesson("7.9", 9, "Deployment of the developed system", 4,
      [
        "Compare parallel, direct, pilot and phased deployment/changeover methods",
        "Describe post-implementation activities: installation, data migration, training, review and maintenance",
      ],
      ["\"Compare deployment methods on risk vs cost\" is a frequent short-essay prompt"]),
    lesson("7.10", 10, "Implementation with off-the-shelf packaged systems", 4,
      [
        "Weigh the costs/benefits of off-the-shelf packages against custom development",
        "Describe business process gap analysis, mapping and reengineering",
      ],
      ["Usually a shorter structured question comparing bespoke vs packaged solutions"]),
  ]),

  unit(8, 8, 13, "Database Management", "Designs and develops database systems to manage data efficiently and effectively", [
    lesson("8.1", 1, "Database basics and database models", 2,
      [
        "Distinguish data from information, and structured from unstructured data",
        "Define a database and compare flat-file, hierarchical, network, relational and object-relational models",
      ],
      ["Comparing database models is a quick, reliable short-structured question"]),
    lesson("8.2", 2, "Components of the relational database model", 4,
      [
        "Define relations/tables, attributes/columns, tuples/rows and relationships",
        "Explain NOT NULL, unique, primary key, foreign key and check constraints",
      ],
      ["Constraint definitions form a common MCQ set"]),
    lesson("8.3", 3, "SQL: data definition and data manipulation", 14,
      [
        "Write DDL to create, alter and drop tables and databases, including adding/removing keys",
        "Write DML — INSERT, UPDATE, DELETE and SELECT — including single- and multi-table SELECTs using an inner join",
      ],
      [
        "SQL query writing, especially SELECT with joins and WHERE conditions, is one of the highest-value, most reliably examined practical skills in the whole syllabus",
        "CREATE TABLE with correct data types, PRIMARY KEY and FOREIGN KEY syntax is asked almost every year",
      ]),
    lesson("8.4", 4, "ER diagrams (conceptual schema)", 12,
      [
        "Identify entities, attributes, entity identifiers and relationships from a worded scenario",
        "Draw an ER diagram with correct cardinality notation",
        "Explain the Extended ER (EER) concept at a basic level",
      ],
      ["Drawing a full ER diagram with correct cardinality from a scenario is one of the most heavily weighted essay questions across the whole exam — practise many different scenarios"]),
    lesson("8.5", 5, "Logical schema design", 6,
      [
        "Define logical schema and relation instances",
        "Distinguish candidate key, primary key, alternate key, foreign key and domain",
      ],
      ["Key-type definitions (candidate vs primary vs alternate) are a recurring short-answer trio"]),
    lesson("8.6", 6, "Transforming ER diagrams to a logical schema", 6,
      [
        "Transform entities, attributes and relationships from an ER diagram into a relational logical schema",
      ],
      ["Commonly paired with the 8.4 ER-diagram question into one longer essay"]),
    lesson("8.7", 7, "Normalization", 6,
      [
        "Identify insert, update and delete anomalies caused by redundancy",
        "Define full, partial and transitive functional dependency",
        "Normalize a given unnormalized table through 1NF, 2NF and 3NF, showing the working at each step",
      ],
      ["Normalizing a given table to 3NF with all intermediate steps shown is one of the most consistently examined essay questions in the Database unit"],
      `## What normalisation is for
Storing the same fact in more than one place is what causes the three anomalies:

- Insert anomaly — a fact cannot be recorded because an unrelated one is missing. A new subject nobody has sat yet has no row to live in
- Update anomaly — a fact stored in twenty rows has to be corrected in twenty rows, and one row missed leaves the database contradicting itself
- Delete anomaly — removing one fact silently removes another. Deleting the last student in a class deletes the class

Normalisation splits tables until every fact is stored exactly once, which removes all three.

## Functional dependency
Write X → Y to mean "X determines Y": knowing X fixes exactly one value of Y. StudentID → StudentName, because one student id gives one name.

- Full dependency — Y depends on the whole of a composite key X
- Partial dependency — Y depends on only part of a composite key
- Transitive dependency — the key determines X, and X in turn determines Y, so Y depends on the key only indirectly

Those three names are the answer to "state the dependency you removed", so use them.

## First normal form
Every cell holds a single value, and there are no repeating groups.

Flatten the repeating group out into extra rows. The key normally has to grow into a composite key at this point, because the original key no longer identifies one row on its own.

## Second normal form
In 1NF, and every non-key column depends on the whole primary key rather than part of it.

This can only bite when the key is composite. Look for a column fixed by half the key — a student's name fixed by the student id alone, when the key is student id plus subject code. Move that column, together with the part of the key it depends on, into a table of its own.

A 1NF table whose primary key is a single column is already in 2NF. Say so if the question gives you one; it is a mark.

## Third normal form
In 2NF, and no non-key column depends on another non-key column.

Look for a chain. The key determines ClassID, and ClassID determines ClassName, so ClassName depends on the key only through ClassID. Move that pair into their own table and leave ClassID behind as a foreign key.

## Writing the answer
The marks are spread across the intermediate stages, not concentrated on the final set of tables. A student who writes only the finished 3NF tables scores a fraction of the question. At each step write:

- the tables at that normal form, with primary keys underlined and foreign keys marked
- the dependency you removed, as an arrow — StudentID → StudentName
- the anomaly that dependency was causing

For A/L ICT the question stops at 3NF. BCNF and the higher normal forms are not examined.`,
      `## සාමාන්‍යකරණය කරන්නේ මොකටද
එකම කාරණය තැන් කීපයක ගබඩා කිරීම තමයි විෂමතා තුනට හේතුව:

- ඇතුළත් කිරීමේ විෂමතාව — සම්බන්ධයක් නැති තව කාරණයක් නැති නිසා එක කාරණයක් සටහන් කරන්න බැරි වෙනවා. තාම කවුරුවත් නොකරන අලුත් විෂයයකට පේළියක් නෑ
- යාවත්කාලීන කිරීමේ විෂමතාව — පේළි විස්සක තියෙන කාරණයක් හදන්න නම් පේළි විස්සම හදන්න ඕන, එකක් මඟ හැරුණොත් දත්ත ගබඩාව තමන් එක්කම ගැටෙනවා
- මකා දැමීමේ විෂමතාව — එක කාරණයක් අයින් කරනකොට තව එකක් නිහඬව මැකෙනවා. පන්තියේ ඉතුරු අන්තිම ශිෂ්‍යයා මැකුවම පන්තියත් මැකෙනවා

සාමාන්‍යකරණයෙන් වගු බෙදලා හැම කාරණයක්ම එකම තැනක විතරක් තියෙන තත්ත්වයට ගේනවා, එතකොට විෂමතා තුනම නැති වෙනවා.

## ශ්‍රිතමය පරායත්තතාව
X → Y කියලා ලියන්නේ "X එකෙන් Y තීරණය වෙනවා" කියන එක: X දැනගත්තම Y ගේ එකම අගයක් හරියටම හසු වෙනවා. StudentID → StudentName, මොකද එක student id එකකින් එක නමක් ලැබෙනවා.

- පූර්ණ පරායත්තතාව — Y රඳා පවතින්නේ සංයුක්ත යතුර X සම්පූර්ණයෙන්ම උඩ
- අර්ධ පරායත්තතාව — Y රඳා පවතින්නේ සංයුක්ත යතුරෙන් කොටසක් උඩ විතරයි
- සංක්‍රාන්ති පරායත්තතාව — යතුරෙන් X තීරණය වෙනවා, X එකෙන් Y තීරණය වෙනවා, ඒ නිසා Y යතුර උඩ රඳා පවතින්නේ වක්‍රාකාරවයි

"ඔබ අයින් කරපු පරායත්තතාව නම් කරන්න" කියලා ආවම ලියන්නේ මේ නම් තුනෙන් එකක්, ඒ නිසා ඒවා පාවිච්චි කරන්න.

## පළමු සාමාන්‍ය ස්වරූපය (1NF)
හැම කොටුවකම එක අගයයි, පුනරාවර්තී සමූහ නෑ.

පුනරාවර්තී සමූහය අමතර පේළිවලට වෙන් කරන්න. යතුර සාමාන්‍යයෙන් සංයුක්ත යතුරක් දක්වා ලොකු වෙන්න ඕන, මොකද පරණ යතුරෙන් තනියම එක පේළියක් හඳුනගන්න දැන් බෑ.

## දෙවන සාමාන්‍ය ස්වරූපය (2NF)
1NF එකේ තියෙනවා, යතුර නොවන හැම තීරුවක්ම සම්පූර්ණ ප්‍රාථමික යතුර උඩ රඳා පවතිනවා — කොටසක් උඩ විතරක් නෙවෙයි.

මේක ප්‍රශ්නයක් වෙන්නේ යතුර සංයුක්ත වෙලා තියෙනකොට විතරයි. යතුරෙන් බාගයක් උඩ තීරණය වෙන තීරුවක් හොයන්න — යතුර student id + subject code වෙලා තියෙද්දී, ශිෂ්‍යයාගේ නම තීරණය වෙන්නේ student id එකෙන් විතරයි. ඒ තීරුව, ඒක රඳා පවතින යතුරේ කොටසත් එක්ක, වෙනම වගුවකට ගෙනියන්න.

1NF එකේ තියෙන, ප්‍රාථමික යතුර තනි තීරුවක් වෙන වගුවක් දැනටමත් 2NF එකේ. ප්‍රශ්නයෙන් එහෙම එකක් දුන්නොත් ඒක ලියන්න — ඒක ලකුණක්.

## තෙවන සාමාන්‍ය ස්වරූපය (3NF)
2NF එකේ තියෙනවා, යතුර නොවන තීරුවක් තව යතුර නොවන තීරුවක් උඩ රඳා පවතින්නේ නෑ.

දාමයක් හොයන්න. යතුරෙන් ClassID තීරණය වෙනවා, ClassID එකෙන් ClassName තීරණය වෙනවා, ඒ නිසා ClassName යතුර උඩ රඳා පවතින්නේ ClassID හරහා විතරයි. ඒ දෙක වෙනම වගුවකට ගෙනිහින්, ClassID විදේශීය යතුරක් විදිහට තියලා යන්න.

## උත්තරය ලියන හැටි
ලකුණු බෙදිලා තියෙන්නේ අතරමැදි අදියරවලට, අන්තිම වගු කට්ටලයට විතරක් නෙවෙයි. අන්තිම 3NF වගු විතරක් ලියන ශිෂ්‍යයෙකුට ලැබෙන්නේ ප්‍රශ්නයේ කොටසක් විතරයි. හැම පියවරකටම ලියන්න:

- ඒ සාමාන්‍ය ස්වරූපයේ වගු, ප්‍රාථමික යතුරු යටින් ඉරි ඇඳලා, විදේශීය යතුරු සලකුණු කරලා
- ඔබ අයින් කරපු පරායත්තතාව, ඊතලයකින් — StudentID → StudentName
- ඒ පරායත්තතාවෙන් හැදුණු විෂමතාව

A/L ICT එකට ප්‍රශ්නය නවතින්නේ 3NF එකෙන්. BCNF සහ ඊට ඉහළ ස්වරූප විභාගයට නෑ.`),
  ]),

  unit(9, 9, 13, "Programming", "Develops algorithms to solve problems and uses python programming language to encode algorithms", [
    lesson("9.1", 1, "The problem-solving process", 2,
      ["Describe the steps of the problem-solving process: understand, define, plan, implement"],
      ["Low period weight — usually a short conceptual question"]),
    lesson("9.2", 2, "Top-down design and stepwise refinement", 4,
      [
        "Apply stepwise refinement/modularization to break a problem into sub-problems",
        "Draw a structure chart for a given solution",
      ],
      ["Structure chart drawing recurs as a short-to-medium structured question"]),
    lesson("9.3", 3, "Algorithms: flowcharts, pseudocode and hand tracing", 6,
      [
        "Draw a flowchart using standard symbols for a given problem",
        "Write pseudocode for a given problem",
        "Hand-trace an algorithm to verify its output for given input",
      ],
      ["Flowchart/pseudocode writing plus a hand-trace table is a near-guaranteed Paper II component, often paired with 9.7-9.8"]),
    lesson("9.4", 4, "Programming paradigms", 2,
      ["Compare imperative, declarative and object-oriented paradigms"],
      ["Short definitional/MCQ material"]),
    lesson("9.5", 5, "Program translators", 2,
      ["Compare interpreters, compilers and the hybrid approach, and describe the role of a linker"],
      ["Compiler vs interpreter comparison is a reliable short-answer question"]),
    lesson("9.6", 6, "Integrated development environments (IDE)", 4,
      ["Identify IDE features (open/save, compile/execute, debug) and use them practically"],
      ["Mostly practical/MCQ material; low essay weight"]),
    lesson("9.7", 7, "Program structure, data types, operators and I/O", 10,
      [
        "Identify a Python program's structure, comments, constants/variables and primitive data types",
        "Use arithmetic, relational, logical and bitwise operators with correct precedence",
        "Write code that reads keyboard input and prints output to standard devices",
      ],
      ["\"Evaluate this expression\" operator-precedence questions are a recurring MCQ/short-answer trap"]),
    lesson("9.8", 8, "Control structures", 12,
      [
        "Use sequence, selection (if/elif/else) and repetition (for/while) structures correctly",
        "Apply nested control structures to solve a multi-step problem",
        "Predict the output of a given Python code segment containing control structures",
      ],
      [
        "\"Trace this code and give the output\" for nested loops/conditionals is one of the most reliably repeated Programming-unit question types",
        "Writing a complete program using control structures for a stated scenario is a standard essay component",
      ]),
    lesson("9.9", 9, "Sub-programs and functions", 10,
      [
        "Distinguish built-in from user-defined functions and describe function structure",
        "Use parameters, arguments, return values and default values correctly",
        "Compare local vs global variable scope and lifetime",
      ],
      [
        "Writing a user-defined function with parameters and a return value for a stated task is a standard essay question",
        "Local vs global scope trace questions are a recurring MCQ trap",
      ]),
    lesson("9.10", 10, "Data structures: strings, lists, tuples, dictionaries", 8,
      [
        "Use strings, lists, tuples and dictionaries appropriately in a Python program",
        "Choose the correct data structure for a described data-storage need",
      ],
      ["List/dictionary manipulation (indexing, slicing, key-value access) is regularly tested in code-writing/tracing questions"]),
    lesson("9.11", 11, "File handling", 6,
      ["Open, read, write, append and close files using basic file operations in Python"],
      ["A short program combining file I/O with another concept (loops, functions) is a common combined question"]),
    lesson("9.12", 12, "Managing data in databases from a program", 4,
      ["Embed SQL statements in a Python program to connect to, retrieve from, and modify a database"],
      ["Directly links Units 8 and 9 — expect a combined database-plus-programming question"]),
    lesson("9.13", 13, "Searching and sorting", 4,
      [
        "Implement sequential search and trace it on a given list",
        "Implement bubble sort and trace it step-by-step on a given list",
      ],
      ["\"Trace bubble sort pass-by-pass on this list\" is a very frequently repeated Paper II question"]),
  ]),

  unit(10, 10, 13, "Web Development", "Develops websites incorporating multi-media technologies (using HTML 5)", [
    lesson("10.1", 1, "The need for the web and types of websites", 8,
      ["Describe the WWW and classify website types: informational, personal, educational, commercial, portal"],
      ["Mostly conceptual/MCQ material"]),
    lesson("10.2", 2, "Analysing user requirements for a website", 4,
      ["Plan a website's objectives, page content and navigation structure before building it"],
      ["Sometimes combined with the HTML essay question as a planning sub-part"]),
    lesson("10.3", 3, "HTML basics: a single web page", 4,
      [
        "Use html/head/title/body structure tags correctly",
        "Apply text-formatting tags: headings, paragraph, line break, bold/italic/underline, font size/colour",
      ],
      ["Writing a minimal valid HTML page skeleton from memory is a reliable warm-up mark"]),
    lesson("10.4", 4, "HTML: linked pages, lists, tables and multimedia", 16,
      [
        "Create hyperlinks — bookmark, local link, external link — between pages and sections",
        "Build ordered/unordered/definition lists and tables, including merged cells, with correct tags",
        "Embed images, audio and video in a page",
      ],
      ["Writing a complete multi-page HTML site with working links, a table and an image is the single largest essay-length question in the Web unit — highest priority for hands-on practice"]),
    lesson("10.5", 5, "CSS: styling web pages", 8,
      [
        "Write CSS using element, id, class and group selectors with correct syntax",
        "Apply internal, external and inline CSS to format backgrounds, text, links, lists and tables",
      ],
      ["Writing CSS rules to restyle a given HTML page is a recurring essay component paired with 10.4"]),
    lesson("10.6", 6, "Using a web authoring tool", 10,
      ["Use a web authoring tool practically to build web pages"],
      ["Mostly practical/school-based assessment; light theory-exam weight"]),
    lesson("10.7", 7, "Dynamic web pages with PHP and MySQL", 6,
      [
        "Embed PHP — variables, arrays, control structures, functions — into a web page",
        "Connect PHP to MySQL to save and retrieve form data",
        "Build an HTML form (text/password inputs, radio, checkbox, select, submit) that posts to a PHP script",
      ],
      ["A combined form + PHP + MySQL question appears in schools that go deep here, though this competency carries fewer periods than core HTML/CSS"]),
    lesson("10.8", 8, "Publishing and maintaining websites", 4,
      [
        "Publish a website locally and to a free web-hosting service",
        "Identify factors affecting website performance",
      ],
      ["Usually a short conceptual question on publishing steps and performance factors"]),
  ]),

  unit(11, 11, 13, "Internet of Things", "Explores IoT and identify the building blocks of digital systems to develop simple applications", [
    lesson("11.1", 1, "Microprocessor development systems", 8,
      [
        "Identify Arduino/Raspberry-Pi-style boards and their features: analog/digital I/O, microprocessor, RX/TX pins, USB port, power supply, reset switch",
        "Describe simple applications: switching an LED, light/temperature sensing, magnetic door-switch detection",
      ],
      ["New, lower-weight unit — expect a short structured question naming components/features rather than a full essay"]),
    lesson("11.2", 2, "Internet of Things concepts and a simple application", 7,
      [
        "Define IoT, its needs and its enabling technologies",
        "Design a simple remote-switch IoT application, e.g. turning a device on/off over the Internet",
      ],
      ["\"Define IoT and give two applications\" is the typical exam depth for this competency given its low period count"]),
  ]),

  unit(12, 12, 13, "ICT in Business", "Explores applicability of ICT to business organizations and the competitive marketplace", [
    lesson("12.1", 1, "ICT's role in business", 4,
      [
        "Define digital economy and new digital business methods: reverse auctions, group purchasing, e-marketplace",
        "Distinguish pure-brick, brick-and-click and pure-click organizations",
        "Describe how ICT supports accounting, HR, production, marketing, supply chain and communication functions",
      ],
      ["Matching a business-model term (brick/click) to a scenario is a common short-answer question"]),
    lesson("12.2", 2, "E-commerce and e-business", 4,
      [
        "Distinguish e-commerce from e-business",
        "List and exemplify B2B, B2C, C2C, C2B, B2E and G2C transaction types",
        "State advantages and disadvantages of e-business",
      ],
      ["Naming and exemplifying each transaction type (B2B/B2C/etc.) is a reliable short-structured question"]),
    lesson("12.3", 3, "E-marketing", 4,
      [
        "Define e-marketing and describe ICT's role in it (web advertising, mobile marketing)",
        "Explain how databases support predicting customer behaviour and gaining competitive advantage",
      ],
      ["Usually a compact definitional/short-answer question"]),
  ]),

  unit(13, 13, 13, "New Trends and Future Directions of ICT", "Explores new trends and future directions of ICT", [
    lesson("13.1", 1, "Intelligent and emotional computing", 4,
      [
        "Describe intelligent and emotional computing, and explain artificial intelligence at a basic level",
        "Discuss man-machine and machine-to-machine coexistence",
      ],
      ["Conceptual/short-answer material — a good source of \"define the term\" MCQs"]),
    lesson("13.2", 2, "Agent technology", 4,
      [
        "Describe software agents and multi-agent systems and their characteristics",
        "Identify real-world applications of agent systems",
      ],
      ["Short conceptual question; low essay weight"]),
    lesson("13.3", 3, "Beyond the von-Neumann model", 4,
      [
        "Describe nature-inspired and biology-inspired computing directions",
        "Explain the fundamentals of quantum computing at an introductory level",
      ],
      ["Emerging-technology definitions are a good source of a final MCQ or short-answer question"]),
  ]),

  unit(14, 14, 13, "Project", "Designs and implements a simple Information system as the project", [
    lesson("14.1", 1, "Designing the information system", 30,
      [
        "Apply the full SAD methodology from Unit 7 — investigation, analysis, design — to a real, self-chosen information system",
        "Maintain an activity logbook recording each session's work for teacher verification",
      ],
      ["Marked by School-Based Assessment, not a written paper — but weak Unit 7/8 skills show up directly here, so treat the project as applied revision for the SAD and Database essay questions"]),
    lesson("14.2", 2, "Implementing and demonstrating the system", 0,
      [
        "Build and demonstrate a working information system implementing the designed solution",
        "Present and defend the design decisions to the teacher/assessor",
      ],
      ["No separate period allocation in the syllabus — implementation runs within the same 30 project periods as 14.1; keep it aligned with what was actually designed there"]),
  ]),
];
