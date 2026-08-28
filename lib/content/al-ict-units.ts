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
): Lesson {
  return { id, order, title, periods, examObjectives, importantAreas };
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
      ]),
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
      ]),
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
      ]),
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
      ]),
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
      ["Normalizing a given table to 3NF with all intermediate steps shown is one of the most consistently examined essay questions in the Database unit"]),
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
