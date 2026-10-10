/**
 * A/L ICT 2026 Paper I — the worked walkthrough behind every answer.
 *
 * The free page at `/papers/al-ict-2026-paper-1-mcq` gives the answer key. This
 * is what the Exam Pack adds: *why* each answer is right, and the trap in the
 * options that catch students, written the way a teacher would talk it through
 * after a paper class. It is shown only after a pack holder submits their
 * sitting, and on the printed answer copy.
 *
 * Keyed by question id in `al-ict-2026-paper1.ts`, so it can never drift onto
 * a different question when that file is reordered. Every computational answer
 * (number bases, Boolean algebra, the Python traces, the SQL constraint counts)
 * was re-derived independently before being written here.
 *
 * Drafted with AI and reviewed by Dr. Yasas before the pack goes on sale — the
 * console's switch is that review. English only for now: the Sinhala-medium
 * reader sees this English text under the Sinhala question, which is how the
 * technical terms are said aloud anyway.
 */

export const AL_ICT_2026_PAPER1_WALKTHROUGH: Record<number, string> = {
  1: "Real-time processing means the result is needed immediately, while the event is still happening. A person standing at the door is waiting for the fingerprint check, so it must be processed instantly. Bank statements, water bills, name badges and leave summaries are all collected and processed later in batches — batch processing.",
  2: "Read the three rules and name the check for each. (ii) \"only numeric characters\" is about the pattern of the data — a format check. (iii) \"strictly between 1 and 13\" is a range check. Only option 4 has Format second and Range third, so (i) is the Logic check here. Strictly, \"must not be blank\" is a presence check; when the options do not offer it, eliminate on the rules you are sure of.",
  3: "ROM means read-only memory: a CD-ROM is pressed at the factory and cannot be written to or erased by the user. CD-RW is rewritable, and floppy disks, hard disks and flash drives can all be written and deleted.",
  4: "The three buses have three jobs. The control bus carries control signals such as READ and WRITE (A). The data word itself travels on the data bus (B), and the memory address goes on the address bus (C). So only A involves the control bus.",
  5: "The Program Counter (PC) holds the memory address of the next instruction to fetch, and is incremented during the fetch. The Instruction Register holds the instruction currently being decoded, the Accumulator holds data being worked on, and the ALU does arithmetic and logic. The data bus is a pathway, not a store.",
  6: "Two's complement of a negative number: write the positive value, invert every bit, add 1. +1 = 00000001 → invert 11111110 → add 1 = 11111111. Quick check: in 8-bit two's complement, all 1s is always −1.",
  7: "Each pair of hexadecimal digits is one character. If 41 is 'A', the alphabet counts on from there: 42 = B ... 45 = E, 4D = M, 4E = N. So 4E 41 4D 45 = N A M E.",
  8: "Convert each hex or octal digit to its own bit group. A: 9 = 1001, A = 1010, so 9A₁₆ = 10011010₂ — correct. B: 93 = 64 + 16 + 8 + 4 + 1 = 1011101₂ — correct. C: octal digits are 3 bits each, 6 = 110, 4 = 100, 5 = 101, so 645₈ = 110100101₂, not 110100111₂ — wrong. A and B only.",
  9: "Convert the whole part and the fraction separately. 14 = 8 + 4 + 2 = 1110. For 0.3125, multiply by 2 and take the whole part each time: 0.625 → 0, 1.25 → 1, 0.5 → 0, 1.0 → 1, giving .0101. So 14.3125₁₀ = 1110.0101₂.",
  10: "XOR outputs 1 when the inputs differ. With A = 1: if B = 0 the inputs differ and F = 1; if B = 1 they match and F = 0. F is always the opposite of B, so F = B̅. Useful rule: XOR with 1 inverts, XOR with 0 passes the input through.",
  11: "Factor the first two terms: AB + AB' = A(B + B') = A·1 = A. That leaves A + A'C. By the absorption rule A + A'C = A + C (if A is 1 the result is 1; if A is 0 the result is C). So the expression simplifies to A + C.",
  12: "Unshielded twisted pair has no metal shielding, so nearby motors, power cables and radios induce noise in it most easily. STP and co-axial cable are shielded, and fibre carries light, so it is immune to electromagnetic interference.",
  13: "Splitting a network into 2ⁿ equal subnets takes n extra network bits. Four subnets = 2² needs 2 bits. Starting from the whole IPv4 space (/0), the mask becomes /2 — each subnet is a quarter of all addresses.",
  14: "A switch works at the data link layer (layer 2) and forwards frames using MAC addresses. Routers forward packets (layer 3), the transport layer deals in segments, and the physical layer moves bits.",
  15: "TCP is connection-oriented: it acknowledges and retransmits lost data (reliable delivery) and numbers segments so they are reassembled in order. That is why FTP, which must deliver whole files intact, uses it. TCP does not encrypt anything — that is the job of TLS or SFTP — so C is false.",
  16: "Follow the name to the address and back. D: the browser hands the domain name to the DNS client (resolver) on your computer. A: the client sends the query to the DNS server. E: the server returns the matching IP address to the client. C: the client gives that IP address to the browser. B: the browser now requests the page from the web server. D-A-E-C-B.",
  17: "In asymmetric encryption the two keys are a pair: what one key encrypts, only the other can decrypt. Encrypting with the private key means anyone can decrypt with the matching public key — which proves who sent it (a digital signature). Option 1 is the classic trap: encrypting with someone's public key gives confidentiality, not proof of the sender.",
  18: "Private IP addresses (such as 192.168.x.x or 10.x.x.x) are not routed on the Internet. NAT translates them to the router's public address so the LAN can reach the Internet. Having servers inside the LAN, or the LAN being wireless, does not by itself require NAT.",
  19: "Match each system to its job. An Expert System gives advice from stored expert knowledge (B3). An MIS summarises everyday transaction data into reports for routine decisions (B2). A CMS lets non-programmers update website content (B1). A1-B3, A2-B2, A3-B1.",
  20: "Unclear requirements that become clear once users see sample screens is exactly what prototyping is for: build a model, get feedback, refine. Spiral is chosen for high-risk projects, RAD when speed matters, and Waterfall needs requirements fixed up front — none of which fits here.",
  21: "A sealed flask exchanges energy (heat) but not matter with its surroundings — a closed system. A school takes in students and resources and interacts with society — a man-made open system. C is false: natural systems include non-living ones such as the solar system or the water cycle.",
  22: "Ask what each problem is about. A: the daily routine of the people using it gets worse — operational. B: it costs more than the budget — economic. C: it breaks the ministry's (the organisation's) policy — organisational.",
  23: "A functional requirement says what the system must do: letting a spectator pick a seat from the seating plan. Uptime, response time, ease of use and concurrent users describe how well it must do it — non-functional requirements.",
  24: "A: making sure every IF condition is executed needs knowledge of the code — white-box testing. B: checking data passed between modules joined together — integration testing. C: real users deciding whether to accept the software — acceptance testing.",
  25: "A: replacing a bank's core system is high risk, so running old and new side by side (parallel installation) is the safe choice — correct. B: COTS packages are licensed, often with recurring fees — correct. C is false: an off-the-shelf package usually needs customisation, or the business changes its processes to fit it.",
  26: "X: a record with multiple parent-child relationships is a network model. Y: every child has exactly one parent — a tree, so hierarchical. Z: records linked by shared attribute values (foreign keys) is the relational model. Network, Hierarchical, Relational.",
  27: "A relation has exactly one primary key, but may have several UNIQUE constraints (for example NIC and email). Option 1 is wrong because a unique attribute can also identify tuples (it is a candidate key); option 4 is wrong because a primary key can be composite.",
  28: "Test each statement. Credits = 0 fails the CHECK (1 to 4). UNIQUE does allow NULLs in standard SQL. Two courses cannot share a name, because CourseName is UNIQUE. CHECK limits the range; it does not stop repeats. So the only true statement is 5: both are unique, but only the primary key also forbids NULL.",
  29: "Count the violations for each row. 1: duplicate NIC — one. 2: NULL key, duplicate NIC and age 16 — three. 3: NULL name — one. 4: age 17 — one. 5: NULL primary key and duplicate NIC — exactly two.",
  30: "Both conditions must be true because of AND. DeptID = 'D01' leaves Kasun (85,000) and Ruwan (75,000); Salary > 80,000 leaves only Kasun.",
  31: "One student, many courses, and one course, many students, is many-to-many: M to N. The enrolment date belongs to a student and a course together, not to either alone, so it is an attribute of the Enroll relationship.",
  32: "2NF forbids partial dependencies: a non-key attribute depending on only part of a composite key. MemberName depends on MemberID alone, not on (MemberID, BookID) — a partial dependency that breaks 2NF. Options 1 and 2 depend on the whole key, which is fine.",
  33: "0NF still has repeating groups (D). 1NF makes every value atomic (B). 2NF removes partial dependencies on the key (C). 3NF removes transitive dependencies (A). 0-D, 1-B, 2-C, 3-A.",
  34: "Only B is right: a linker joins object files and library routines into one executable. A is backwards — an assembler translates assembly language into machine code (object code). C describes an interpreter; a loader copies the finished program into memory to run it.",
  35: "Apply precedence: ** first, then * and //, then +, then the comparison. 3 ** 2 = 9; 2 * 9 = 18; 18 // 5 = 3; 5 + 3 = 8; 8 <= 8 is True. The comparison happens last, so Python prints a Boolean.",
  36: "Trace it. x = 2, y = 0. i = 1: j = 1, so y += 2 → 2, j becomes −1 and the while ends; x becomes 3. i = 2: j = 2, so y += 3 → 5, j becomes 0 and the while ends; x becomes 4. It prints 4 5.",
  37: "Lists are passed by reference, so both functions change the same list. update sets index 1 to 50: [5, 50, 15]. restock adds 10 to indexes 0 and 1 only (range(2)): [15, 60, 15].",
  38: "record['ICT'] starts as student[2] = 20 and becomes 70, so mark_list = ['Saman', 70]. copy() makes a separate list, so clearing new_list and appending 100 does not touch mark_list. Output: ['Saman', 70] [100].",
  39: "Read the brackets. Quotes make a string (A-4), square brackets a list (B-1), round brackets a tuple (C-3), and curly braces with key: value pairs a dictionary (D-2).",
  40: "REPEAT ... UNTIL runs the body first, then stops when the condition becomes true. Python has no repeat-until, so we loop while the stop condition is false — while n >= 1 — and print before changing n. That prints 5, 3, 1, exactly as the pseudocode does. Option 3 changes n before printing, so it prints 3, 1, −1.",
  41: "Only some sites handle something private. Q takes card details and S shows a student's own results behind a login — both need authentication and encryption. A restaurant menu (P) and a weather forecast (R) are public information.",
  42: "Client-side scripts run in the browser, so the check happens instantly with no trip to the server. But anything in the browser can be bypassed, so the server must check the same data again. Option 1 is the trap: client-side checks are for convenience, not security.",
  43: "GET puts form data in the URL, where it lands in history, logs and bookmarks — wrong for a password. POST sends it in the request body. A search, on the other hand, should be a shareable, bookmarkable URL, so GET suits it. Neither method encrypts anything on its own; HTTPS does that.",
  44: "A session keeps the data on the server and gives the browser only a session ID in a cookie. That keeps the cart safe from tampering and the cookie small. A cart stored entirely in a cookie can be edited by the user and is limited in size.",
  45: "Personal data — names, phone numbers, purchase history — was copied and used without consent for a new purpose. That is a breach of data protection and privacy (in Sri Lanka, the Personal Data Protection Act), not a freedom-of-information or licensing issue.",
  46: "mysqli_connect(host, username, password, database, port): the server name first, then who you are, then your password, then which database. The fifth parameter is the port.",
  47: "An LDR gives a varying resistance, so it is read on an analog input (A1-B1). An LED is switched on or off — a digital output (A2-B3). A reed switch on a door is either open or closed — a digital input (A3-B2).",
  48: "A buzzer produces sound, so it is an actuator (an output that acts on the world) — correct. A reed switch only senses. An Ethernet shield talks to the Uno over SPI on digital pins 10 to 13, not the analog pins. An LDR is a resistor, not a diode. A single chip with CPU, memory and I/O is a microcontroller, not a microprocessor.",
  49: "A qubit can be in a superposition of 0 and 1 at the same time, which is what lets quantum computers explore many states at once. The other options are deliberately absurd — in this kind of question, eliminate the impossible ones first.",
  50: "In a multi-agent system each agent is autonomous: it senses its environment, decides for itself, and cooperates or communicates with other agents when needed. A single central controller giving every instruction (option 1) is the opposite of the idea.",
};
