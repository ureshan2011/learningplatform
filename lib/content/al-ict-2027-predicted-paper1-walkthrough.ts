/**
 * A/L ICT 2027 predicted Paper I — why each answer is right.
 *
 * `al-ict-2027-predicted-paper1.ts` already says why each question was
 * *predicted* (its confidence band and rationale). This says why its answer is
 * *correct*, which is what a student marking their own sitting actually needs.
 * Shown to Exam Pack holders after they submit, and on the printed answer copy.
 *
 * Keyed by question id, like the 2026 walkthrough. The arithmetic answers (two's
 * complement, hex, the subnet size, the Python trace) were re-derived before
 * being written here. Drafted with AI and reviewed by Dr. Yasas before the pack
 * goes on sale; English only for now.
 */

export const AL_ICT_2027_PREDICTED_PAPER1_WALKTHROUGH: Record<number, string> = {
  1: "Data is raw facts and figures with no context (for example 72, 85, 64). Information is that data processed into something meaningful (\"the class average is 74\"). Data can be numbers, text, images or sound, so options 1 and 5 are false.",
  2: "Predicting readmission risk from treatment records is a healthcare application — ICT used for diagnosis, treatment planning and patient management.",
  3: "Sri Lanka's Personal Data Protection Act (No. 9 of 2022) requires organisations to collect personal data only for a stated, lawful purpose and to justify each item they keep. The Right to Information Act is about access to public information; the Computer Crimes Act covers unauthorised access and misuse.",
  4: "Write +6 in 5 bits: 00110. Invert every bit: 11001. Add 1: 11010. Check: the leading 1 shows it is negative, and 11010 + 00110 = 100000, which drops to 00000 in 5 bits.",
  5: "Each hex digit becomes four bits. 2 = 0010 and F = 1111, so 2F₁₆ = 0010 1111 = 00101111₂ (47 in decimal).",
  6: "ASCII has only 128 (7-bit) codes — enough for English letters, digits and symbols, but not for Sinhala, Tamil or most other scripts. Unicode gives every character in every script its own code point, which a multilingual application needs.",
  7: "Factor out A: A.B + A.B' = A(B + B') = A.1 = A. The value of B does not matter.",
  8: "Each input can be 0 or 1, so n inputs give 2ⁿ combinations. 2³ = 8 rows.",
  9: "NAND (and NOR) are universal gates: NOT, AND and OR can all be built from NAND gates alone. For example, a NAND with both inputs joined is a NOT gate.",
  10: "Clock speed is the number of cycles per second, measured in hertz — today usually gigahertz (GHz). Bits per second and baud measure data transfer, not clock speed.",
  11: "ROM is non-volatile: it keeps its contents when power is switched off, which is why it holds start-up firmware. RAM (including DRAM), cache and registers are all volatile.",
  12: "In the Von Neumann architecture the Control Unit fetches and decodes each instruction and sends control signals to the other parts. The ALU does the calculation the Control Unit tells it to.",
  13: "Third-generation computers (1960s) were built with integrated circuits — many transistors on one chip — which shrank computers dramatically. Vacuum tubes were first generation, transistors second, and VLSI is fourth generation.",
  14: "Cache is small, very fast memory between the CPU and main memory that keeps frequently used data close to the processor. It is faster than RAM, smaller than RAM, volatile, and part of primary memory, not secondary storage.",
  15: "Several users running several programs at once, with the CPU switching rapidly between them (time-sharing), is a multi-user, multi-tasking operating system.",
  16: "Spooling puts output for a slow device, such as a printer, into a queue on disk. The CPU and the user can carry on working while the printer works through the queue at its own speed.",
  17: "In a full mesh topology every device has a direct link to every other device. It gives the most redundancy but needs n(n − 1)/2 links.",
  18: "The usable hosts on a subnet are 2ʰ − 2, where h is the number of host bits. 2⁵ − 2 = 30, so 5 host bits are needed, leaving 32 − 5 = 27 network bits: /27. A /28 gives only 14 hosts; /26 would give 62, more than needed.",
  19: "DNS (Domain Name System) translates domain names such as ictcampus.lk into IP addresses. DHCP hands out IP addresses to devices, HTTP fetches web pages, FTP transfers files and SMTP sends email.",
  20: "The transport layer (layer 4) provides end-to-end delivery between hosts, including TCP's acknowledgements, retransmission and ordering. The network layer routes packets across networks but does not guarantee delivery.",
  21: "UDP is connectionless with no acknowledgements or retransmission, so it has less overhead and lower delay. For a live video call a late packet is useless anyway, so speed matters more than guaranteed delivery. UDP guarantees nothing, and it is used all over the Internet.",
  22: "A router works at the network layer (layer 3) and forwards packets between different networks using IP addresses. Switches and bridges work at layer 2 with MAC addresses; hubs and repeaters work at layer 1.",
  23: "A firewall filters incoming and outgoing traffic against a set of rules — allowing or blocking by address, port or application. It is not antivirus, it does not encrypt data, and it can be hardware or software.",
  24: "Data is first collected, then processed, then the result is output, and it is stored for later use. Collection → Processing → Output → Storage.",
  25: "Cardinality states how many instances of one entity can relate to one instance of another — one-to-one, one-to-many, many-to-many — including the minimum and maximum.",
  26: "SELECT chooses the column, FROM the table, WHERE filters rows before they are returned. HAVING filters groups after GROUP BY, so it is the wrong clause here; UPDATE, DELETE and INSERT change data rather than read it.",
  27: "If the teacher's phone number sits in every student row, it is repeated for every student that teacher has. Changing it means updating many rows, and missing one leaves the data inconsistent — an update anomaly. Normalising moves teacher details into their own table.",
  28: "A foreign key links a row to a row in another table and enforces referential integrity: you cannot reference a record that does not exist. It does not make values unique and does not speed up queries by itself.",
  29: "DDL (Data Definition Language) defines structure: CREATE, ALTER, DROP. SELECT reads data, so it belongs to the data query/manipulation side, not DDL.",
  30: "Repeating the same product price in many rows is redundancy. Normalisation splits the data into related tables — a Product table holds each price once — so a price change is made in one place.",
  31: "range(1, 4) gives 1, 2 and 3 (the end value is not included). total becomes 0 + 1 = 1, then 3, then 6. It prints 6.",
  32: "A Python function needs def, the name, the parameters in brackets, and a colon before the body: def square(x): return x*x. A missing colon, a semicolon, or the word function are syntax errors.",
  33: "A variable created inside a function is local: it exists only while the function runs and cannot be used outside it unless it is returned (or declared global).",
  34: "a = 5 and b = 2, so a > b is true and the if-branch runs, printing X. The else-branch is skipped.",
  35: "Lists are mutable: you can change, add and remove items. Tuples are immutable: once created they cannot be changed. Both can hold any type and any number of values.",
  36: "Sequential (linear) search checks items one by one from the start. Binary search needs a sorted list and halves it each step; bubble sort and quick sort are sorting methods, not searches.",
  37: "Bubble sort compares neighbours from the start. The first pair is 5 and 2; 5 > 2 so they swap, giving [2, 5, 4]. Next it would compare 5 and 4.",
  38: "A compiler translates the whole source program into machine code before it runs, producing an executable. An interpreter translates and runs one statement at a time and produces no separate executable. Option 1 swaps them — read carefully.",
  39: "A debugger lets you run a program step by step, set breakpoints and watch variable values, which is how logic errors are found. A compiler only reports syntax errors.",
  40: "Asking again and again until a valid number is entered needs a loop (repetition) — a while loop that keeps going while the input is invalid.",
  41: "<ol> makes an ordered (numbered) list and <ul> an unordered (bulleted) one. <li> is a single list item inside either.",
  42: "Padding is the space between an element's content and its border. Margin is the space outside the border, between this element and others.",
  43: "An external stylesheet is linked in the head with <link rel=\"stylesheet\" href=\"style.css\">. The <style> tag is for CSS written inside the page, and <script> is for JavaScript.",
  44: "Data sent by a form with method=\"post\" arrives in PHP's $_POST array; $_GET holds data sent in the URL. Uploaded files are in $_FILES (with an S), and $_SESSION holds session variables.",
  45: "A web host keeps the site on a server connected to the Internet around the clock, so anyone can reach it. A site on your own computer is only available while that computer is on and reachable.",
  46: "The feasibility study decides whether the system is worth building: technically possible, economically worth the cost, and operationally workable for the people who will use it.",
  47: "Black-box testing checks what the system does — inputs against expected outputs — without looking at the code. White-box testing examines the internal code and logic.",
  48: "A business that trades only online with no physical shop is pure click (pure play). Brick-and-click has both a shop and an online store; brick-and-mortar is only a physical shop.",
  49: "Machine-to-machine means devices exchanging data and acting on it with no human involved — the thermostat and the irrigation controller coordinating by themselves.",
  50: "IoT means physical objects with sensors connected to a network, acting on data automatically. The irrigation system reads a soil-moisture sensor and opens or closes a valve on its own. The other options have no sensor, no network, or neither.",
};
