/**
 * Worked "distinguish between" pairs for A/L ICT.
 *
 * Static, not Firestore — fixed reference content, and the second-highest
 * intent free page after /command-words: a student who already knows what
 * "distinguish" requires (from that page) comes here to actually see it done
 * across the syllabus's most commonly-confused pairs. Every pair is a
 * standard, syllabus-version-independent computer science fact, deliberately
 * chosen so this page never goes stale.
 */
export interface DistinguishPair {
  slug: string;
  termA: string;
  termB: string;
  topic: string;
  weakAnswer: string;
  strongAnswer: string;
}

export const DISTINGUISH_PAIRS: DistinguishPair[] = [
  {
    slug: "ram-vs-rom",
    termA: "RAM",
    termB: "ROM",
    topic: "Hardware",
    weakAnswer: "RAM stores data temporarily. ROM stores data permanently.",
    strongAnswer:
      "RAM is volatile and can be both read from and written to, while ROM is non-volatile and is generally read-only — so RAM loses its contents when the power is off, but ROM does not.",
  },
  {
    slug: "primary-key-vs-foreign-key",
    termA: "Primary key",
    termB: "Foreign key",
    topic: "Databases",
    weakAnswer: "A primary key identifies a record. A foreign key links tables.",
    strongAnswer:
      "A primary key uniquely identifies each row within its own table and cannot be NULL, while a foreign key is a column that references another table's primary key to establish a relationship — and, unlike a primary key, it can repeat and can be NULL.",
  },
  {
    slug: "compiler-vs-interpreter",
    termA: "Compiler",
    termB: "Interpreter",
    topic: "Programming",
    weakAnswer: "A compiler translates code. An interpreter also translates code.",
    strongAnswer:
      "A compiler translates the entire source program into machine code before execution, producing a standalone executable file, while an interpreter translates and executes the source code one line at a time at runtime, without producing a saved executable.",
  },
  {
    slug: "lan-vs-wan",
    termA: "LAN",
    termB: "WAN",
    topic: "Networking",
    weakAnswer: "A LAN is a small network. A WAN is a big network.",
    strongAnswer:
      "A LAN covers a small area such as one building and is typically owned and controlled entirely by a single organization, while a WAN spans a large geographic area — often across cities or countries — and typically relies on third-party or leased communication links between sites.",
  },
  {
    slug: "analog-vs-digital-signals",
    termA: "Analog signal",
    termB: "Digital signal",
    topic: "Data representation",
    weakAnswer: "Analog signals are continuous. Digital signals are 0s and 1s.",
    strongAnswer:
      "An analog signal is continuous and can take any value across a range, while a digital signal is discrete and is represented using a fixed set of distinct levels, most commonly binary 0 and 1.",
  },
  {
    slug: "symmetric-vs-asymmetric-encryption",
    termA: "Symmetric encryption",
    termB: "Asymmetric encryption",
    topic: "Security",
    weakAnswer: "Symmetric encryption uses a key. Asymmetric encryption uses two keys.",
    strongAnswer:
      "Symmetric encryption uses a single shared secret key for both encrypting and decrypting, which is fast but makes securely distributing that key difficult, while asymmetric encryption uses a mathematically linked public/private key pair — data encrypted with one key can only be decrypted with the other, which is slower but avoids ever having to share a secret key.",
  },
  {
    slug: "circuit-switching-vs-packet-switching",
    termA: "Circuit switching",
    termB: "Packet switching",
    topic: "Networking",
    weakAnswer: "Circuit switching uses a dedicated line. Packet switching sends data in packets.",
    strongAnswer:
      "Circuit switching reserves a fixed, dedicated communication path for the entire duration of a call before any data is sent — the traditional telephone network — while packet switching splits data into independently routed packets that may take different paths and are reassembled at the destination, sharing the underlying network far more efficiently, as the Internet does.",
  },
  {
    slug: "sequential-vs-direct-access",
    termA: "Sequential access",
    termB: "Direct access",
    topic: "Storage",
    weakAnswer: "Sequential access reads data in order. Direct access is faster.",
    strongAnswer:
      "Sequential access media, such as magnetic tape, must be read in order from the beginning to reach a given item, while direct (random) access media, such as a hard disk or RAM, can jump straight to any location without first reading through what precedes it.",
  },
  {
    slug: "systems-software-vs-application-software",
    termA: "Systems software",
    termB: "Application software",
    topic: "Software",
    weakAnswer: "Systems software runs the computer. Application software is for users.",
    strongAnswer:
      "Systems software, such as an operating system or device drivers, manages and controls the computer's hardware and provides the platform other software runs on, while application software, such as a word processor or web browser, is designed to help the end user carry out a specific task and runs on top of the systems software.",
  },
  {
    slug: "verification-vs-validation",
    termA: "Verification",
    termB: "Validation",
    topic: "Data validation",
    weakAnswer: "Verification checks data. Validation also checks data.",
    strongAnswer:
      "Verification checks that data was copied or entered exactly as it exists in its original source — for example, by typing it twice and comparing the two — while validation checks that entered data is reasonable and acceptable against a predefined rule, such as a range or format check; data can pass validation by being a sensible value and still fail verification by being the wrong value entirely.",
  },
];
