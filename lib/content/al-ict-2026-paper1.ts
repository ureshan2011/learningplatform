/**
 * A/L ICT 2026 Paper I — full 50-question MCQ paper, free and public.
 *
 * Static, not Firestore: this is fixed reference content and the platform's
 * single highest-intent acquisition page — a student searching "A/L ICT 2026
 * paper 1 answers" lands here with zero reads and zero sign-in friction.
 *
 * Every answer was independently re-derived (not copied from any marking
 * sheet) and cross-checked: the six programming questions were run, not
 * hand-traced; the Boolean algebra question was brute-force verified against
 * a truth table. Two questions from the original scan turned out to be
 * unrecoverable and were replaced rather than presented with a wrong or
 * ambiguous answer:
 *
 * - Q11: the OCR'd Boolean expression didn't equal ANY of the 5 printed
 *   options under exhaustive truth-table testing — a lost complement bar
 *   somewhere in the scan, most likely. Replaced with an equivalent-style,
 *   verified expression.
 * - Q32: had two simultaneously-valid partial-key dependencies among the
 *   options (a real ambiguity in the source paper, not a scan error).
 *   Replaced with an unambiguous version of the same 2NF concept.
 * - Q42–45: entirely missing from the provided scan (outside the
 *   photographed page range). Replaced with four original questions at the
 *   same difficulty, covering adjacent syllabus ground (client/server
 *   scripting, HTTP methods, cookies/sessions, ICT law & ethics) so the
 *   paper still reads as a complete 50-question set.
 *
 * `replaced: true` marks all six so the page can disclose this plainly
 * rather than silently presenting reconstructed content as the original
 * paper — a parent or teacher checking this against the real gazette paper
 * deserves to know exactly where it diverges.
 */

export interface McqQuestion {
  id: number;
  topic: string;
  en: { stem: string; options: [string, string, string, string, string] };
  si: { stem: string; options: [string, string, string, string, string] };
  /** 0-based index into `options`. */
  correctIndex: number;
  replaced?: boolean;
}

export const PAPER_TITLE_EN = "A/L ICT 2026 — Paper I (MCQ)";
export const PAPER_TITLE_SI = "උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය 2026 — I ප්‍රශ්න පත්‍රය";
export const PAPER_DURATION_MINUTES = 120;
export const PAPER_QUESTION_COUNT = 50;

export const AL_ICT_2026_PAPER1: McqQuestion[] = [
  {
    id: 1,
    topic: "Fundamentals",
    en: {
      stem: "Which of the following tasks requires real-time processing?",
      options: [
        "Printing monthly bank statements for account holders",
        "Generating water bills for customers",
        "Verifying fingerprints and approving entry at an office entrance door",
        "Printing name badges for participants before a conference",
        "Compiling an annual leave summary for employees",
      ],
    },
    si: {
      stem: "පහත දැක්වෙන කාර්යයන් අතුරෙන් කවරක් සඳහා තථ්‍ය කාලීන සැකසුම (real-time processing) අවශ්‍ය වේ ද?",
      options: [
        "ගිණුම් හිමියන් සඳහා මාසික බැංකු වාර්තා මුද්‍රණය කිරීම",
        "ගනුදෙනුකරුවන්ට ජල බිල්පත් ජනනය කිරීම",
        "කාර්යාල ප්‍රවේශ දොරටුවේ දී ඇඟිලි සලකුණු සත්‍යාපනය කර අනුමත කිරීම",
        "සහභාගිවන්නන් සඳහා සම්මන්ත්‍රණයකට පෙර නාම ලාංඡන මුද්‍රණය කිරීම",
        "සේවකයන්ගේ වාර්ෂික නිවාඩු සාරාංශය සම්පාදනය කිරීම",
      ],
    },
    correctIndex: 2,
  },
  {
    id: 2,
    topic: "Data validation",
    en: {
      stem:
        "A student registration system verifies its inputs using: (i) \"Date of Birth\" must not be blank, (ii) \"Telephone Number\" must consist exclusively of numeric characters, (iii) \"Grade\" must be strictly between 1 and 13. Which sequence of validation methods correctly corresponds to these three rules, in order?",
      options: [
        "Range check, Logic check, Format check",
        "Logic check, Range check, Format check",
        "Format check, Logic check, Range check",
        "Logic check, Format check, Range check",
        "Range check, Format check, Logic check",
      ],
    },
    si: {
      stem:
        "සිසුන් ලියාපදිංචි කිරීමේ පද්ධතියක් එහි ආදාන පහත නීති භාවිත කරමින් සත්‍යාපනය කරයි: (i) \"උපන්දිනය\" ක්ෂේත්‍රය හිස්ව නොතිබිය යුතුය, (ii) \"දුරකථන අංකය\" අනිවාර්යයෙන්ම සංඛ්‍යාත්මක අනුලක්ෂණවලින් සමන්විත විය යුතුය, (iii) \"ශ්‍රේණිය\" හි අගය අනිවාර්යයෙන්ම 1 සහ 13 අතර විය යුතුය. මෙම නීති තුන සඳහා නිවැරදි අනුපිළිවෙලින් අනුරූප වන්නේ පහත කවර දත්ත සත්‍යාපන ක්‍රමවේද අනුක්‍රමය ද?",
      options: [
        "පරාස පරීක්ෂාව, තර්කන පරීක්ෂාව, ප්‍රරූප පරීක්ෂාව",
        "තර්කන පරීක්ෂාව, පරාස පරීක්ෂාව, ප්‍රරූප පරීක්ෂාව",
        "ප්‍රරූප පරීක්ෂාව, තර්කන පරීක්ෂාව, පරාස පරීක්ෂාව",
        "තර්කන පරීක්ෂාව, ප්‍රරූප පරීක්ෂාව, පරාස පරීක්ෂාව",
        "පරාස පරීක්ෂාව, ප්‍රරූප පරීක්ෂාව, තර්කන පරීක්ෂාව",
      ],
    },
    correctIndex: 3,
  },
  {
    id: 3,
    topic: "Storage media",
    en: {
      stem: "Which of the following storage media cannot be written to or deleted by users?",
      options: ["CD-ROM", "CD-RW", "Floppy disk", "Hard disk", "Flash drive"],
    },
    si: {
      stem: "පරිශීලකයන්ට දත්ත ලිවීම හෝ මැකීම කළ නොහැකි ආචයන මාධ්‍යය වන්නේ පහත කවරක් ද?",
      options: ["CD-ROM", "CD-RW", "නම්‍ය තැටිය", "දෘඪ තැටිය", "සැණෙලි ධාවකය"],
    },
    correctIndex: 0,
  },
  {
    id: 4,
    topic: "Computer architecture",
    en: {
      stem:
        "In which of the following operation(s) does the control bus intervene? A - Sending a read signal from the CPU to main memory. B - Transferring a data word from main memory to the CPU. C - Carrying the memory address of the data word to be accessed.",
      options: ["A only", "B only", "A and B only", "A and C only", "All of A, B, and C"],
    },
    si: {
      stem:
        "පහත සඳහන් කුමන මෙහෙයුමක දී / මෙහෙයුම්වල දී පාලන බසය (control bus) මැදිහත් වේ ද? A - CPU මගින් කියවුම් සංඥාවක් ප්‍රධාන මතකයට යැවීම. B - දත්ත වදනක් ප්‍රධාන මතකයේ සිට CPU වෙත මාරු කිරීම. C - ප්‍රවේශ විය යුතු දත්ත වදනේ මතක යොමුව රැගෙන යාම.",
      options: ["A පමණි", "B පමණි", "A සහ B පමණි", "A සහ C පමණි", "A, B සහ C සියල්ලම"],
    },
    correctIndex: 0,
  },
  {
    id: 5,
    topic: "Computer architecture",
    en: {
      stem:
        "During the execution of a program, which of the following stores the memory address of the next instruction to be executed?",
      options: ["Accumulator", "Arithmetic and Logic Unit (ALU)", "Instruction register", "Program counter", "Data bus"],
    },
    si: {
      stem:
        "ක්‍රමලේඛයක් ක්‍රියාකරවීම අතරතුර දී, ඊළඟට ක්‍රියාකරවිය යුතු උපදෙසේ මතක යොමුව ගබඩා කරන්නේ පහත සඳහන් කවරක් මගින් ද?",
      options: ["ඇකියුමිලේටරය", "අංකගණිත හා තාර්කික ඒකකය (ALU)", "උපදේශන රෙජිස්තරය", "වැඩසටහන් ගණකය", "දත්ත බසය"],
    },
    correctIndex: 3,
  },
  {
    id: 6,
    topic: "Number systems",
    en: {
      stem: "What is the 8-bit 2's complement representation of -1?",
      options: ["11111111", "00000000", "00000001", "10000000", "11111110"],
    },
    si: {
      stem: "බිටු 8 පද්ධතියක් තුළ -1 හි ද්විමය 2 හි අනුපූරක (2's complement) නිරූපණය කුමක් ද?",
      options: ["11111111", "00000000", "00000001", "10000000", "11111110"],
    },
    correctIndex: 0,
  },
  {
    id: 7,
    topic: "Number systems",
    en: {
      stem: "If the hexadecimal Unicode code point for 'A' is 41, what does 4E414D45 represent?",
      options: ["NAVY", "NAME", "FOOD", "GAME", "CAPE"],
    },
    si: {
      stem: "A සඳහා යුනිකෝඩ් කේත ලක්ෂ්‍යය ෂඩ්දශමය 41 නම්, 4E414D45 නිරූපණය කරන්නේ කුමක් ද?",
      options: ["NAVY", "NAME", "FOOD", "GAME", "CAPE"],
    },
    correctIndex: 1,
  },
  {
    id: 8,
    topic: "Number systems",
    en: {
      stem:
        "Which of the following is/are correct? A - 9A₁₆ = 10011010₂. B - 93₁₀ = 1011101₂. C - 645₈ = 110100111₂.",
      options: ["A only", "A and B only", "A and C only", "B and C only", "All of A, B, and C"],
    },
    si: {
      stem:
        "සංඛ්‍යා පද්ධති පරිවර්තන සම්බන්ධයෙන් වූ පහත ප්‍රකාශ අතුරෙන් නිවැරදි වන්නේ මොනවා ද? A - 9A₁₆ = 10011010₂. B - 93₁₀ = 1011101₂. C - 645₈ = 110100111₂.",
      options: ["A පමණි", "A සහ B පමණි", "A සහ C පමණි", "B සහ C පමණි", "A, B සහ C සියල්ලම"],
    },
    correctIndex: 1,
  },
  {
    id: 9,
    topic: "Number systems",
    en: {
      stem: "What is the correct binary equivalent of the decimal number 14.3125₁₀?",
      options: ["1101.0101₂", "1101.1010₂", "1111.0110₂", "1110.0101₂", "1110.1010₂"],
    },
    si: {
      stem: "14.3125₁₀ දශමය සංඛ්‍යාවේ නිවැරදි ද්විමය තුල්‍ය සංඛ්‍යාව කුමක් ද?",
      options: ["1101.0101₂", "1101.1010₂", "1111.0110₂", "1110.0101₂", "1110.1010₂"],
    },
    correctIndex: 3,
  },
  {
    id: 10,
    topic: "Logic gates",
    en: {
      stem: "A two-input X-OR gate has inputs A and B, producing output F. If A = 1, the output F will be:",
      options: ["1", "0", "A", "B", "B̅ (NOT B)"],
    },
    si: {
      stem: "රූපයේ දැක්වෙන්නේ ආදාන දෙකක් සහිත X-OR ද්වාරයකි. A=1 නම් F ප්‍රතිදානය වන්නේ,",
      options: ["1", "0", "A", "B", "B̅"],
    },
    correctIndex: 4,
  },
  {
    id: 11,
    topic: "Boolean algebra",
    replaced: true,
    en: {
      stem: "The Boolean expression AB + AB' + A'C is equivalent to:",
      options: ["A", "B", "C", "A + B", "A + C"],
    },
    si: {
      stem: "AB + AB' + A'C බූලියන් ප්‍රකාශනය තුල්‍ය වන්නේ,",
      options: ["A", "B", "C", "A + B", "A + C"],
    },
    correctIndex: 4,
  },
  {
    id: 12,
    topic: "Networking media",
    en: {
      stem: "Which of the following media is most susceptible to electromagnetic interference?",
      options: ["UTP", "Microwaves", "STP", "Co-axial cable", "Fibre optic"],
    },
    si: {
      stem: "විද්‍යුත්-චුම්භක බාධකවලින් වඩාත්ම බලපෑමට ලක්විය හැක්කේ මින් කුමන මාධ්‍යය ද?",
      options: ["UTP", "ක්ෂුද්‍ර තරංග (Microwaves)", "STP", "සමාක්ෂ රැහැන් (Co-axial cable)", "ප්‍රකාශ තන්තු (Fibre optic)"],
    },
    correctIndex: 0,
  },
  {
    id: 13,
    topic: "Networking",
    en: {
      stem: "What is the network mask when the full IPv4 address space is divided equally into 4 subnets?",
      options: ["/2", "/4", "/8", "/24", "/26"],
    },
    si: {
      stem: "සම්පූර්ණ IPv4 ලිපින අවකාශය, උපජාල 4 කට සමානව බෙදනු ලබන ජාල ආවරණය (network mask) කුමක් ද?",
      options: ["/2", "/4", "/8", "/24", "/26"],
    },
    correctIndex: 0,
  },
  {
    id: 14,
    topic: "Networking",
    en: {
      stem: "In a school laboratory's LAN, in what form does a switch forward data between computers?",
      options: ["Messages", "Segments", "Packets", "Frames", "Bits"],
    },
    si: {
      stem: "පාසල් විද්‍යාගාරයක ඇති ස්ථානීය පෙදෙස් ජාලයේ දී (LAN), ස්විචයක් මගින් පරිගණක අතර දත්ත යොමු කරන්නේ කුමන ස්වරූපයෙන් ද?",
      options: ["පණිවුඩ", "කොටස්", "පැකට්ටු", "රාමු", "බිටු"],
    },
    correctIndex: 3,
  },
  {
    id: 15,
    topic: "Networking protocols",
    en: {
      stem:
        "FTP uses TCP instead of UDP as the transport layer protocol, because TCP: A - Ensures reliable data delivery. B - Delivers data in the correct sequence. C - Uses encryption to secure data. Which of the above is/are correct?",
      options: ["A only", "A and B only", "A and C only", "B and C only", "All of A, B, and C"],
    },
    si: {
      stem:
        "FTP, ප්‍රවාහන ස්තරයේ නියමාවලිය ලෙස UDP වෙනුවට TCP භාවිත කරන්නේ, TCP මගින්: A - විශ්වාසදායක දත්ත ගෙනයාමක් සහතික කරන බැවිනි. B - නිවැරදි අනුපිළිවෙලින් දත්ත බෙදාහරින බැවිනි. C - දත්ත ආරක්ෂා කිරීම සඳහා ගුප්ත කේතනය භාවිත කරන බැවිනි. ඉහත ප්‍රකාශ අතුරෙන් නිවැරදි වන්නේ,",
      options: ["A පමණි", "A සහ B පමණි", "A සහ C පමණි", "B සහ C පමණි", "A, B සහ C සියල්ලම"],
    },
    correctIndex: 1,
  },
  {
    id: 16,
    topic: "Networking — DNS",
    en: {
      stem:
        "When a user enters a URL and accesses a website: A - The DNS client sends a query for the domain name to the DNS server. B - Using the received IP address, the browser sends its page request to the web server. C - The DNS server provides the IP address to the browser. D - The browser gives the domain name to the DNS client on the user's computer. E - The DNS server sends the matching IP address to the DNS client. What is the correct sequence?",
      options: ["A-E-D-C-B", "B-D-A-E-C", "D-A-C-E-B", "D-A-E-C-B", "D-C-A-E-B"],
    },
    si: {
      stem:
        "පරිශීලකයෙකු වෙබ් අතිරික්සුවක URL එකක් ඇතුළත් කර වෙබ් අඩවියකට ප්‍රවේශ වන විට: A - DNS සේවාදායකයා වසම් නාමය සඳහා විමසුමක් DNS සේවායෝජකයාට යවයි. B - ලැබුණු IP ලිපිනය භාවිත කරමින් අතිරික්සුව සිය පිටු ඉල්ලීම වෙබ් සේවාදායකයාට යවයි. C - DNS සේවායෝජකයා IP ලිපිනය අතිරික්සුවට ලබා දෙයි. D - අතිරික්සුව URL එකෙහි වසම් නාමය පරිශීලකයාගේ පරිගණකයේ ඇති DNS සේවාදායකයාට ලබාදෙයි. E - DNS සේවායෝජකයා ගැළපෙන IP ලිපිනය DNS සේවාදායකයාට යවයි. ඉහත සිදුවීම්වල නිවැරදි අනුපිළිවෙල කුමක් ද?",
      options: ["A-E-D-C-B", "B-D-A-E-C", "D-A-C-E-B", "D-A-E-C-B", "D-C-A-E-B"],
    },
    correctIndex: 3,
  },
  {
    id: 17,
    topic: "Cryptography",
    en: {
      stem: "Which of the following is true regarding Asymmetric Key Encryption?",
      options: [
        "Encrypting data with a public key ensures the sender's identity.",
        "The public key and the private key are identical.",
        "A message encrypted using a private key can only be decrypted using that exact same private key.",
        "A public key cannot be used for decryption.",
        "A message encrypted using a private key can only be decrypted by using the corresponding public key.",
      ],
    },
    si: {
      stem: "අසමමිතික යතුරු ගුප්ත කේතනය සම්බන්ධයෙන් නිවැරදි වන්නේ මින් කුමක් ද?",
      options: [
        "පොදු යතුරකින් දත්ත ගුප්ත කේතනය කිරීම මගින් යවන්නාගේ අනන්‍යතාවය සහතික කෙරේ.",
        "පොදු යතුර සහ පෞද්ගලික යතුර සර්වසම වේ.",
        "පෞද්ගලික යතුරක් භාවිත කර ගුප්ත කේතනය කරන ලද පණිවුඩයක් විකේතනය කළ හැක්කේ එම පෞද්ගලික යතුර භාවිතයෙන්ම පමණි.",
        "විකේතනය සඳහා පොදු යතුර භාවිත කළ නොහැක.",
        "පෞද්ගලික යතුරක් භාවිත කර ගුප්ත කේතනය කරන ලද පණිවුඩයක් විකේතනය කළ හැක්කේ අදාළ පොදු යතුර භාවිත කිරීමෙන් පමණකි.",
      ],
    },
    correctIndex: 4,
  },
  {
    id: 18,
    topic: "Networking — NAT",
    en: {
      stem:
        "For which of the following is Network Address Translation (NAT) required? A - Server computers exist within the LAN. B - The LAN is wireless. C - The LAN uses private IP addresses.",
      options: ["A only", "B only", "C only", "A and B only", "A and C only"],
    },
    si: {
      stem:
        "ජාල ලිපින පරිවර්තන (NAT) අවශ්‍ය වන්නේ පහත කවරක් සඳහා ද? A - ස්ථානීය ප්‍රදේශ ජාලය තුළ සේවාදායක පරිගණක පවතින විට. B - ස්ථානීය ප්‍රදේශ ජාලය රැහැන් රහිත වූ විට. C - ස්ථානීය ප්‍රදේශ ජාලය පෞද්ගලික IP ලිපින භාවිත කරන විට.",
      options: ["A පමණි", "B පමණි", "C පමණි", "A සහ B පමණි", "A සහ C පමණි"],
    },
    correctIndex: 2,
  },
  {
    id: 19,
    topic: "Information systems",
    en: {
      stem:
        "Match systems A1–A3 with descriptions B1–B3. A1 - Expert Systems (ES). A2 - Management Information Systems (MIS). A3 - Content Management Systems (CMS). B1 - Lets authorized employees with no programming knowledge modify what's shown on the organization's website. B2 - Converts records from daily business activities into summaries used for routine decision-making. B3 - Suggests the course of action to take in a given situation, based on accumulated expert experience within the system.",
      options: [
        "A1-B1, A2-B2, A3-B3",
        "A1-B2, A2-B3, A3-B1",
        "A1-B3, A2-B1, A3-B2",
        "A1-B3, A2-B2, A3-B1",
        "A1-B1, A2-B3, A3-B2",
      ],
    },
    si: {
      stem:
        "A1 සිට A3 තෙක් ලේබල් කර ඇති පද්ධති සමග B1 සිට B3 තෙක් ලේබල් කර ඇති විස්තර ගළපන්න. A1 - විශේෂඥ පද්ධති (ES). A2 - කළමනාකරණ තොරතුරු පද්ධති (MIS). A3 - අන්තර්ගත කළමනාකරණ පද්ධති (CMS). B1 - ක්‍රමලේඛන දැනුම නොමැති අවසරලත් සේවකයන්ට ආයතනයේ වෙබ් අඩවියේ පෙන්වන දෑ වෙනස් කිරීමට පහසුකම් සලසන පද්ධතියකි. B2 - දෛනික ව්‍යාපාරික කටයුතුවලින් ජනිතවන වාර්තා, නිතිපතා තීරණ ගැනීම සඳහා යොදාගන්නා සාරාංශ බවට පරිවර්තනය කරන පද්ධතියකි. B3 - පද්ධතිය තුළ රැස් කර ඇති පළපුරුදු සේවකයන්ගේ අත්දැකීම් ඇසුරෙන්, දී ඇති අවස්ථාවකට ගත යුතු ක්‍රියාමාර්ගය යෝජනා කරන පද්ධතියකි.",
      options: [
        "A1-B1, A2-B2, A3-B3",
        "A1-B2, A2-B3, A3-B1",
        "A1-B3, A2-B1, A3-B2",
        "A1-B3, A2-B2, A3-B1",
        "A1-B1, A2-B3, A3-B2",
      ],
    },
    correctIndex: 3,
  },
  {
    id: 20,
    topic: "SDLC models",
    en: {
      stem:
        "A team is developing a small system with low technical risk. The client cannot clearly state requirements but gives useful feedback once shown sample interfaces, and does not need the system very quickly. Which development model is most suitable?",
      options: ["Waterfall model", "Spiral model", "Agile model", "Prototyping", "Rapid Application Development (RAD)"],
    },
    si: {
      stem:
        "අඩු තාක්ෂණික අවදානමක් සහිත කුඩා පද්ධතියක් සංවර්ධනය කිරීමට පවරා ඇත. සේවාලාභියාට පද්ධති අවශ්‍යතා පැහැදිලිව දැක්විය නොහැකි නමුත්, නියැදි අතුරුමුහුණත් පෙන්වූ පසු ප්‍රයෝජනවත් ප්‍රතිපෝෂණ ලබා දිය හැකිය. සේවාලාභියාට මෙම පද්ධතිය ඉතා ඉක්මනින් අවශ්‍ය නොවේ. වඩාත්ම සුදුසු පද්ධති සංවර්ධන ආකෘතිය කුමක් ද?",
      options: [
        "දියඇලි (waterfall) ආකෘතිය",
        "සර්පිලාකාර (spiral) ආකෘතිය",
        "සුචල්‍ය (agile) ආකෘතිය",
        "මූලාකෘතිකරණය (prototyping)",
        "ශීඝ්‍ර යෙදුම් සංවර්ධනය (RAD)",
      ],
    },
    correctIndex: 3,
  },
  {
    id: 21,
    topic: "Systems theory",
    en: {
      stem:
        "Regarding system classification: A - A sealed chemical flask in a laboratory can be considered a closed system. B - A school is a man-made open system because it interacts with its environment. C - Every natural system is a living system. Which statement(s) is/are correct?",
      options: ["A only", "B only", "A and B only", "B and C only", "All of A, B, and C"],
    },
    si: {
      stem:
        "පද්ධති වර්ගීකරණය සම්බන්ධයෙන් පහත සඳහන් කුමන ප්‍රකාශය/ප්‍රකාශ නිවැරදි වන්නේ ද? A - විද්‍යාගාරයක ඇති මුද්‍රා තබන ලද රසායනික ප්ලාස්කුවක් සංවෘත පද්ධතියක් සේ සැලකිය හැකිය. B - පාසල, මිනිසා විසින් නිපදවූ විවෘත පද්ධතියක් වන්නේ එය එහි පරිසරය සමග අන්තර්ක්‍රියා කරන බැවිනි. C - සෑම ස්වාභාවික පද්ධතියක්ම ජීවී පද්ධතියකි.",
      options: ["A පමණි", "B පමණි", "A සහ B පමණි", "B සහ C පමණි", "A, B සහ C සියල්ලම"],
    },
    correctIndex: 2,
  },
  {
    id: 22,
    topic: "Feasibility study",
    en: {
      stem:
        "A school plans to computerize attendance and term-test marks. Feasibility study found: A - Entering each student's attendance separately every morning delays the first period. B - The cost of proposed equipment exceeds the annual budget. C - Keeping records only at the school violates the ministry's policy of centralized storage. Which correctly matches the feasibility types?",
      options: [
        "A-Operational, B-Economic, C-Organizational",
        "A-Technical, B-Economic, C-Operational",
        "A-Operational, B-Technical, C-Organizational",
        "A-Organizational, B-Economic, C-Operational",
        "A-Technical, B-Operational, C-Organizational",
      ],
    },
    si: {
      stem:
        "පාසලක් ශිෂ්‍ය පැමිණීම හා වාර විභාග ලකුණු පරිගණකගත කිරීමට සැලසුම් කරයි. ශක්‍යතා අධ්‍යයනයේදී: A - සෑම උදෑසනකම එක් එක් සිසුවාගේ පැමිණීම වෙන වෙනම ඇතුළත් කිරීමෙන් පළමු කාලච්ඡේදය ආරම්භවීම ප්‍රමාද වේ. B - යෝජිත උපකරණවල පිරිවැය වාර්ෂික අයවැය වෙන් කිරීමට වඩා වැඩිවනු ඇත. C - පාසලේම වාර්තා පවත්වාගෙන යාම, සියලුම පාසල් වාර්තා මධ්‍යගත පද්ධතියක ගබඩා කිරීමේ අමාත්‍යාංශයේ ප්‍රතිපත්තියට පටහැනි වේ. පහත සඳහන් කවරක් ශක්‍යතා ප්‍රරූප සමග නිවැරදිව ගැළපේ ද?",
      options: [
        "A - මෙහෙයුම්, B - ආර්ථික, C - ආයතනික",
        "A - තාක්ෂණික, B - ආර්ථික, C - මෙහෙයුම්",
        "A - මෙහෙයුම්, B - තාක්ෂණික, C - ආයතනික",
        "A - ආයතනික, B - ආර්ථික, C - මෙහෙයුම්",
        "A - තාක්ෂණික, B - මෙහෙයුම්, C - ආයතනික",
      ],
    },
    correctIndex: 0,
  },
  {
    id: 23,
    topic: "Requirements",
    en: {
      stem: "Which of the following is a functional requirement of an online cinema ticket reservation system?",
      options: [
        "The system must be operational 99.9% of the total time.",
        "The system must respond to any search within 2 seconds.",
        "The system must allow the spectator to choose their seat from a seating plan.",
        "The system interface must be easy to use for a new user.",
        "The system must support up to 5000 concurrent users.",
      ],
    },
    si: {
      stem: "මාර්ගගත සිනමා ප්‍රවේශ පත්‍ර වෙන් කරගැනීමේ පද්ධතියක කාර්යබද්ධ (functional) අවශ්‍යතාවක් වන්නේ පහත කවරක් ද?",
      options: [
        "පද්ධතිය මුළු කාලයෙන් 99.9%ක්ම ක්‍රියාත්මකව පැවතිය යුතුය.",
        "ඕනෑම සෙවුමකට තත්පර 2ක් තුළ පද්ධතිය ප්‍රතිචාර දැක්විය යුතුය.",
        "ආසන සැලසුමකින් තම ආසනය තෝරාගැනීමට පද්ධතිය මගින් ප්‍රේක්ෂකයාට ඉඩ සැලසිය යුතුය.",
        "නව පරිශීලකයෙකුට පද්ධති අතුරුමුහුණත භාවිතය පහසු විය යුතුය.",
        "පද්ධතිය, එකවර පරිශීලකයන් 5000ක් දක්වා සහාය දැක්විය යුතුය.",
      ],
    },
    correctIndex: 2,
  },
  {
    id: 24,
    topic: "Software testing",
    en: {
      stem:
        "In A ......... testing, a programmer prepared test data to ensure every IF condition is executed. In B ......... testing, data exchanged between integrated modules was tested. In C ......... testing, office workers used the software for daily tasks and decided whether to approve it. Correct combination for A, B, C?",
      options: [
        "A-white-box, B-integration, C-acceptance",
        "A-black-box, B-integration, C-system",
        "A-white-box, B-system, C-acceptance",
        "A-black-box, B-white-box, C-integration",
        "A-white-box, B-system, C-integration",
      ],
    },
    si: {
      stem:
        "A ......... පරීක්ෂාවේදී, සෑම IF කොන්දේසියක්ම ක්‍රියාත්මකවන බව සහතික කිරීම සඳහා ක්‍රමලේඛකයකු පරීක්ෂණ දත්ත සකස් කළේය. B ......... පරීක්ෂාවේදී, සංයෝජිත මොඩියුල අතර හුවමාරුවන දත්ත පරීක්ෂා කරන ලදී. C ......... පරීක්ෂාවේදී, කාර්යාල සේවකයෝ තම දෛනික කටයුතු සඳහා මෘදුකාංගය භාවිත කර, එය අනුමත කරන්නේද යන්න තීරණය කළහ. A, B සහ C සඳහා නිවැරදි සංයෝජනය කුමක් ද?",
      options: [
        "A - ශ්වේත මංජුසා, B - අනුකලන, C - ප්‍රතිග්‍රහණ",
        "A - කාල මංජුසා, B - අනුකලන, C - පද්ධති",
        "A - ශ්වේත මංජුසා, B - පද්ධති, C - ප්‍රතිග්‍රහණ",
        "A - කාල මංජුසා, B - ශ්වේත මංජුසා, C - අනුකලන",
        "A - ශ්වේත මංජුසා, B - පද්ධති, C - අනුකලන",
      ],
    },
    correctIndex: 0,
  },
  {
    id: 25,
    topic: "COTS software",
    en: {
      stem:
        "A bank replaces its core banking software with a Commercial Off-The-Shelf (COTS) package. A - Since failure is highly risky, parallel installation is recommended. B - Using a COTS package may involve recurring license fee costs. C - A COTS package always matches the bank's existing business processes with no customization. Which are correct?",
      options: ["A only", "B only", "A and B only", "B and C only", "All of A, B, and C"],
    },
    si: {
      stem:
        "බැංකුවක් ඔවුන්ගේ මූලික බැංකු මෘදුකාංගය වාණිජමය පෙර නිමි පැකේජයකින් (COTS) ප්‍රතිස්ථාපනය කරයි. A - පද්ධතියේ අසාර්ථකවීමක් ඉතා අවදානම් බැවින් සමාන්තර ස්ථාපනය නිර්දේශ කෙරේ. B - වාණිජමය පෙර නිමි පැකේජ භාවිතය සමග පුනරාවර්තන බලපත්‍ර ගාස්තු පිරිවැය ද බැඳී පැවතිය හැකිය. C - වාණිජමය පෙර නිමි පැකේජ කිසිදු අභිරුචිකරණයකින් තොරව සෑමවිටම බැංකුවේ පවතින ව්‍යාපාර ක්‍රියාවලි සමග ගැළපේ.",
      options: ["A පමණි", "B පමණි", "A සහ B පමණි", "B සහ C පමණි", "A, B සහ C සියල්ලම"],
    },
    correctIndex: 2,
  },
  {
    id: 26,
    topic: "Database models",
    en: {
      stem:
        "Model X: data organized as a collection of interconnected records, where a record can participate in multiple parent-child relationships. Model Y: data organized in parent-child relationships, where every child node has only one parent node. Model Z: data organized as a set of logically linked records connected by shared attribute values. Which correctly identifies X, Y, Z respectively?",
      options: [
        "Hierarchical, Network, Relational",
        "Relational, Hierarchical, Network",
        "Network, Relational, Object-relational",
        "Object-relational, Hierarchical, Relational",
        "Network, Hierarchical, Relational",
      ],
    },
    si: {
      stem:
        "X ආකෘතිය: දත්ත සංවිධානය වී ඇත්තේ අන්තර් සම්බන්ධිත රෙකෝඩ එකතුවක් වශයෙනි; රෙකෝඩයකට මාපිය-දරු සම්බන්ධතා කිහිපයකට සහභාගි විය හැක. Y ආකෘතිය: දත්ත, මාපිය-දරු සම්බන්ධතාවයෙන් සංවිධානය වී ඇති අතර, සෑම දරු මාංසලකටම පවතින්නේ එක් මාපිය මාංසලක් පමණි. Z ආකෘතිය: තාර්කිකව සබැඳි රෙකෝඩවල එකතු සමූහයක් ලෙස දත්ත සංවිධානය වන අතර පොදු උපලක්ෂණ අගයයන් මගින් රෙකෝඩ එකිනෙක අතර සම්බන්ධතා ඇති කරගනී. පිළිවෙළින් X, Y හා Z ආකෘති නිවැරදිව හඳුන්වා ඇත්තේ පහත කවරක ද?",
      options: [
        "ධූරක, ජාල, සම්බන්ධිත",
        "සම්බන්ධිත, ධූරක, ජාල",
        "ජාල, සම්බන්ධිත, වස්තු-සම්බන්ධිත",
        "වස්තු-සම්බන්ධිත, ධූරක, සම්බන්ධිත",
        "ජාල, ධූරක, සම්බන්ධිත",
      ],
    },
    correctIndex: 4,
  },
  {
    id: 27,
    topic: "Databases — keys",
    en: {
      stem: "Which of the following is always true regarding the PRIMARY KEY and UNIQUE constraint of a relational database?",
      options: [
        "Although both a primary key and a unique constraint enforce uniqueness, only a primary key can be used to identify tuples in a relation.",
        "A relation can have several unique constraints, but it can have only one primary key.",
        "A unique constraint is used to establish relationships between relations, while a primary key is used only to enforce uniqueness.",
        "A primary key must consist of only a single attribute, while a unique constraint can consist of multiple attributes.",
        "A relation can consist of multiple primary keys, but it can have only one unique constraint.",
      ],
    },
    si: {
      stem: "සම්බන්ධක දත්ත සමුදායක ප්‍රාථමික යතුර (PRIMARY KEY) සහ අනන්‍ය සංරෝධකය (UNIQUE) සම්බන්ධයෙන් සැමකල්හිම සත්‍ය වන්නේ මින් කුමන ප්‍රකාශය ද?",
      options: [
        "ප්‍රාථමික යතුරක් සහ අනන්‍ය සංරෝධකයක් යන දෙකම අනන්‍යතාවය බලාත්මක කරවන නමුදු, සම්බන්ධයක රෙකෝඩ හඳුනාගැනීමට භාවිත කළ හැක්කේ ප්‍රාථමික යතුර පමණි.",
        "සම්බන්ධයකට අනන්‍ය සංරෝධක කිහිපයක් පැවතිය හැකි අතර, එයට පැවතිය හැක්කේ එක ප්‍රාථමික යතුරක් පමණි.",
        "අනන්‍ය සංරෝධකයක් භාවිත කරනුයේ සම්බන්ධ අතර සබැඳියාවන් ස්ථාපිත කිරීමට වන අතර, ප්‍රාථමික යතුර අනන්‍යතාවය බලාත්මක කිරීමට පමණක් භාවිත කරයි.",
        "ප්‍රාථමික යතුරක් තනි උපලක්ෂණයකින් පමණක් සමන්විත විය යුතු අතර, අනන්‍ය සංරෝධකයක් බහු උපලක්ෂණවලින් සමන්විත විය හැකිය.",
        "සම්බන්ධයක් ප්‍රාථමික යතුරු කිහිපයකින් සමන්විත විය හැකි අතර, එහි පැවතිය හැක්කේ එක් අනන්‍ය සංරෝධකයකි.",
      ],
    },
    correctIndex: 1,
  },
  {
    id: 28,
    topic: "SQL constraints",
    en: {
      stem:
        "COURSE(CourseID PRIMARY KEY, CourseName UNIQUE, Credits CHECK (Credits BETWEEN 1 AND 4)). Which of the following statements is correct?",
      options: [
        "A course can be inserted with Credits = 0, provided there is no other course with the same CourseID.",
        "The UNIQUE constraint on CourseName does not allow the use of NULL values for CourseName.",
        "Two courses can have the same CourseName provided they have different CourseID values.",
        "The CHECK constraint on Credits ensures the same credit value is not assigned to two courses.",
        "Although both CourseID and CourseName are unique attributes, only CourseID does not allow NULL values.",
      ],
    },
    si: {
      stem:
        "COURSE(CourseID PRIMARY KEY, CourseName UNIQUE, Credits CHECK (Credits BETWEEN 1 AND 4)). පහත ප්‍රකාශ අතුරෙන් කුමක් නිවැරදි වේ ද?",
      options: [
        "සමාන CourseID අගය සහිත වෙනත් පාඨමාලාවක් නොමැති තාක්, Credits = 0 ලෙස පාඨමාලාවක් ඇතුළත් කළ හැකිය.",
        "CourseName මත වූ අනන්‍ය සංරෝධකය CourseName සඳහා NULL අගයන් භාවිත කිරීමට ඉඩ නොදේ.",
        "CourseID අගයන් වෙනස් යැයි දී ඇති විට පාඨමාලා දෙකක් සඳහා එකම CourseName එක පැවතිය හැකිය.",
        "Credits මත වූ CHECK සංරෝධකය එකම credit අගය පාඨමාලා දෙකකට යොදා නොගන්නා බව සහතික කරයි.",
        "CourseID සහ CourseName යන දෙකම අනන්‍ය උපලක්ෂණ වන නමුදු, CourseID සඳහා පමණක් NULL අගයන්ට අවසර නොදේ.",
      ],
    },
    correctIndex: 4,
  },
  {
    id: 29,
    topic: "SQL constraints",
    en: {
      stem:
        "STUDENT(StudentID VARCHAR(10) PRIMARY KEY, NIC VARCHAR(12) UNIQUE, Age INTEGER CHECK(Age >= 18), Name VARCHAR(50) NOT NULL). One record already exists: StudentID='S001', NIC='200012345678', Age=20, Name='Saman'. Which subsequent INSERT violates exactly two constraints?",
      options: [
        "('S002', '200012345678', 20, 'Amal')",
        "(NULL, '200012345678', 16, 'Nimal')",
        "('S004', '200078945612', 20, NULL)",
        "('S003', '200078945612', 17, 'Sunil')",
        "(NULL, '200012345678', 20, 'Kamal')",
      ],
    },
    si: {
      stem:
        "STUDENT(StudentID VARCHAR(10) PRIMARY KEY, NIC VARCHAR(12) UNIQUE, Age INTEGER CHECK(Age >= 18), Name VARCHAR(50) NOT NULL). එක් රෙකෝඩයක් දැනටමත් ඇතුළත් කර ඇත: StudentID='S001', NIC='200012345678', Age=20, Name='Saman'. පසුව කරනු ලබන ඇතුළු කිරීම් මගින් සංරෝධන දෙකක් පමණක් උල්ලංඝනය කරනු ලබන්නේ පහත සඳහන් කවර වගන්තියේ ද?",
      options: [
        "('S002', '200012345678', 20, 'Amal')",
        "(NULL, '200012345678', 16, 'Nimal')",
        "('S004', '200078945612', 20, NULL)",
        "('S003', '200078945612', 17, 'Sunil')",
        "(NULL, '200012345678', 20, 'Kamal')",
      ],
    },
    correctIndex: 4,
  },
  {
    id: 30,
    topic: "SQL queries",
    en: {
      stem:
        "EMPLOYEE table: E01 Kasun 85000 D01; E02 Dilini 72000 D02; E03 Ruwan 75000 D01; E04 Amaya 68000 D03. Query: SELECT Name, Salary FROM EMPLOYEE WHERE DeptID='D01' AND Salary > 80000; What is the output?",
      options: [
        "Kasun — 85,000",
        "Ruwan — 75,000",
        "Kasun — 85,000; Ruwan — 75,000",
        "Kasun — 85,000; Dilini — 72,000; Ruwan — 75,000",
        "Kasun — 85,000; Ruwan — 75,000; Amaya — 68,000",
      ],
    },
    si: {
      stem:
        "EMPLOYEE වගුව: E01 Kasun 85000 D01; E02 Dilini 72000 D02; E03 Ruwan 75000 D01; E04 Amaya 68000 D03. විමසුම: SELECT Name, Salary FROM EMPLOYEE WHERE DeptID='D01' AND Salary > 80000; ප්‍රතිදානය කුමක් ද?",
      options: [
        "Kasun — 85,000",
        "Ruwan — 75,000",
        "Kasun — 85,000; Ruwan — 75,000",
        "Kasun — 85,000; Dilini — 72,000; Ruwan — 75,000",
        "Kasun — 85,000; Ruwan — 75,000; Amaya — 68,000",
      ],
    },
    correctIndex: 0,
  },
  {
    id: 31,
    topic: "ER modelling",
    en: {
      stem:
        "A student can enrol in many courses; a course can have many enrolled students; every student-course enrolment date must be recorded. Which correctly represents all these requirements?",
      options: [
        "Student [1] — Course [M], with EnrollmentDate as an attribute of the Enroll relationship",
        "Student [M] — Course [N], with EnrollmentDate as an attribute of the Enroll relationship",
        "Student [M] — Course [N], with EnrollmentDate as an attribute of the Course entity",
        "Student [1] — Course [1], with EnrollmentDate as an attribute of the Enroll relationship",
        "Student [M] — Course [1], with EnrollmentDate as an attribute of the Student entity",
      ],
    },
    si: {
      stem:
        "එක් සිසුවෙකුට බොහෝ පාඨමාලාවන්ට ලියාපදිංචි විය හැකිය; එක් පාඨමාලාවකට බොහෝ ලියාපදිංචි සිසුන් සිටිය හැකිය; සෑම සිසු-පාඨමාලා ලියාපදිංචි දිනයක්ම වාර්තා කර තැබිය යුතුමය. මෙම අවශ්‍යතා සියල්ල නිවැරදිව නිරූපණය වන්නේ පහත සඳහන් කවරකින් ද?",
      options: [
        "Student [1] — Course [M], EnrollmentDate උපලක්ෂණය Enroll සබැඳියාවට සම්බන්ධයි",
        "Student [M] — Course [N], EnrollmentDate උපලක්ෂණය Enroll සබැඳියාවට සම්බන්ධයි",
        "Student [M] — Course [N], EnrollmentDate උපලක්ෂණය Course වස්තුවට සම්බන්ධයි",
        "Student [1] — Course [1], EnrollmentDate උපලක්ෂණය Enroll සබැඳියාවට සම්බන්ධයි",
        "Student [M] — Course [1], EnrollmentDate උපලක්ෂණය Student වස්තුවට සම්බන්ධයි",
      ],
    },
    correctIndex: 1,
  },
  {
    id: 32,
    topic: "Normalization",
    replaced: true,
    en: {
      stem:
        "Consider BORROW(MemberID, BookID, BorrowDate, MemberName, DueDate), with primary key (MemberID, BookID). Which dependency violates 2NF?",
      options: [
        "(MemberID, BookID) → BorrowDate",
        "(MemberID, BookID) → DueDate",
        "MemberID → MemberName",
        "BookID → BorrowDate",
        "DueDate → BorrowDate",
      ],
    },
    si: {
      stem:
        "BORROW(MemberID, BookID, BorrowDate, MemberName, DueDate) සම්බන්ධය සලකන්න. ප්‍රාථමික යතුර (MemberID, BookID) වේ. දෙවෙනි ප්‍රමත අවස්ථාව (2NF) උල්ලංඝනය කරන පරායත්තතාව කුමක් ද?",
      options: [
        "(MemberID, BookID) → BorrowDate",
        "(MemberID, BookID) → DueDate",
        "MemberID → MemberName",
        "BookID → BorrowDate",
        "DueDate → BorrowDate",
      ],
    },
    correctIndex: 2,
  },
  {
    id: 33,
    topic: "Normalization",
    en: {
      stem:
        "Match Normal Forms 0–3 with descriptions A–D. 0-0NF, 1-1NF, 2-2NF, 3-3NF. A - No transitive dependencies. B - All attributes are atomic. C - No partial dependencies on the primary key. D - Repeating records/groups exist.",
      options: [
        "0-D, 1-B, 2-C, 3-A",
        "0-B, 1-D, 2-C, 3-A",
        "0-D, 1-C, 2-B, 3-A",
        "0-A, 1-B, 2-D, 3-C",
        "0-D, 1-B, 2-A, 3-C",
      ],
    },
    si: {
      stem:
        "0 සිට 3 තෙක් ලේබල් කරන ලද ප්‍රමත අවස්ථා (0-0NF, 1-1NF, 2-2NF, 3-3NF) A සිට D තෙක් ලේබල් කරන ලද අදාළ විස්තර සමග ගළපන්න. A - සංක්‍රාන්ති පරායත්තතා නැත. B - සියලු උපලක්ෂණ පරමාණුක වේ. C - ප්‍රාථමික යතුර මත ආංශික පරායත්තතා නොමැත. D - පුනරාවර්තන රෙකෝඩ පවතී.",
      options: [
        "0-D, 1-B, 2-C, 3-A",
        "0-B, 1-D, 2-C, 3-A",
        "0-D, 1-C, 2-B, 3-A",
        "0-A, 1-B, 2-D, 3-C",
        "0-D, 1-B, 2-A, 3-C",
      ],
    },
    correctIndex: 0,
  },
  {
    id: 34,
    topic: "Program development tools",
    en: {
      stem:
        "A: Assembler → Translates object code into assembly language and produces an executable file. B: Linker → Combines object files and library routines into a single executable program. C: Loader → Executes the program line by line during translation. Which statement(s) correctly describe the tool's function?",
      options: ["A only", "B only", "A and B only", "A and C only", "All of A, B, and C"],
    },
    si: {
      stem:
        "ක්‍රමලේඛ සංවර්ධනයේදී භාවිත වූ මෘදුකාංග මෙවලමක කාර්යය නිවැරදිව විස්තර කරනු ලබන්නේ පහත කවර ප්‍රකාශය/ප්‍රකාශ ද? A: එසෙම්බලරය → වස්තු කේතය එසෙම්බලි භාෂාවට පරිවර්තනය කර ක්‍රියාත්මක කළ හැකි ගොනුවක් නිපදවයි. B: සන්ධාරකය → වස්තු ගොනු හා පුස්තකාල රූටින තනිව ක්‍රියාත්මක කළ හැකි ක්‍රමලේඛයක් ලෙස සංයුක්ත කරයි. C: ලෝඩර් → පරිවර්තනය අතරතුර දී ක්‍රමලේඛ පේළියෙන් පේළිය ක්‍රියාත්මක කරයි.",
      options: ["A පමණි", "B පමණි", "A සහ B පමණි", "A සහ C පමණි", "A, B සහ C සියල්ලම"],
    },
    correctIndex: 1,
  },
  {
    id: 35,
    topic: "Python",
    en: {
      stem: "What could be the output of: print(5 + 2 * 3 ** 2 // 5 <= 8)",
      options: ["0", "1", "7", "True", "False"],
    },
    si: {
      stem: "පහත දැක්වෙන පයිතන් ප්‍රකාශයේ ප්‍රතිදානය විය හැක්කේ කුමක් ද? print(5 + 2 * 3 ** 2 // 5 <= 8)",
      options: ["0", "1", "7", "True", "False"],
    },
    correctIndex: 3,
  },
  {
    id: 36,
    topic: "Python",
    en: {
      stem:
        "What could be the output? x=2; y=0; for i in range(1,3): j=i; while j>0: y+=x; j-=2; x+=1; print(x, y)",
      options: ["3 5", "4 4", "4 5", "4 6", "5 9"],
    },
    si: {
      stem:
        "පහත දැක්වෙන පයිතන් කේතයේ ප්‍රතිදානය විය හැක්කේ කුමක් ද? x=2; y=0; for i in range(1,3): j=i; while j>0: y+=x; j-=2; x+=1; print(x, y)",
      options: ["3 5", "4 4", "4 5", "4 6", "5 9"],
    },
    correctIndex: 2,
  },
  {
    id: 37,
    topic: "Python",
    en: {
      stem:
        "def update(quantities): quantities[1]=50. def restock(quantities): for i in range(2): quantities[i]+=10. stock=[5,10,15]; update(stock); restock(stock); print(stock)",
      options: ["[5, 50, 15]", "[15, 20, 25]", "[15, 60, 15]", "[15, 60, 25]", "An error occurs during execution."],
    },
    si: {
      stem:
        "def update(quantities): quantities[1]=50. def restock(quantities): for i in range(2): quantities[i]+=10. stock=[5,10,15]; update(stock); restock(stock); print(stock) — ප්‍රතිදානය කුමක් ද?",
      options: ["[5, 50, 15]", "[15, 20, 25]", "[15, 60, 15]", "[15, 60, 25]", "ක්‍රියාත්මකවන විට දෝෂ ඇති වේ."],
    },
    correctIndex: 2,
  },
  {
    id: 38,
    topic: "Python",
    en: {
      stem:
        "student=(\"Saman\",17,20); record={\"ICT\":student[2],\"Age\":student[1],\"Name\":student[0]}; record[\"ICT\"]+=50; mark_list=[record[\"Name\"],record[\"ICT\"]]; new_list=mark_list.copy(); new_list.clear(); new_list.append(100); print(mark_list, new_list)",
      options: [
        "['Saman', 70] [100]",
        "['Saman', 67] [100]",
        "['Saman', 20] []",
        "[] [100]",
        "['Saman', 70] ['Saman', 70, 100]",
      ],
    },
    si: {
      stem:
        "student=(\"Saman\",17,20); record={\"ICT\":student[2],\"Age\":student[1],\"Name\":student[0]}; record[\"ICT\"]+=50; mark_list=[record[\"Name\"],record[\"ICT\"]]; new_list=mark_list.copy(); new_list.clear(); new_list.append(100); print(mark_list, new_list) — ප්‍රතිදානය කුමක් ද?",
      options: [
        "['Saman', 70] [100]",
        "['Saman', 67] [100]",
        "['Saman', 20] []",
        "[] [100]",
        "['Saman', 70] ['Saman', 70, 100]",
      ],
    },
    correctIndex: 0,
  },
  {
    id: 39,
    topic: "Python data structures",
    en: {
      stem:
        "Match Python values A-D with data structures 1-4. A - \"My Name\". B - [10, 20, 30]. C - (10, 20, 30). D - {\"B\": 85, \"A\": 90}. 1-List, 2-Dictionary, 3-Tuple, 4-String.",
      options: ["A-1, B-4, C-3, D-2", "A-2, B-1, C-3, D-4", "A-4, B-3, C-1, D-2", "A-4, B-1, C-3, D-2", "A-4, B-1, C-2, D-3"],
    },
    si: {
      stem:
        "A සිට D තෙක් ලේබල් කර ඇති පයිතන් විචල්‍ය අගයන් සමග 1 සිට 4 තෙක් ලේබල් කර ඇති දත්ත ව්‍යුහයන් ගළපන්න. A - \"My Name\". B - [10, 20, 30]. C - (10, 20, 30). D - {\"B\": 85, \"A\": 90}. 1-List, 2-Dictionary, 3-Tuple, 4-String.",
      options: ["A-1, B-4, C-3, D-2", "A-2, B-1, C-3, D-4", "A-4, B-3, C-1, D-2", "A-4, B-1, C-3, D-2", "A-4, B-1, C-2, D-3"],
    },
    correctIndex: 3,
  },
  {
    id: 40,
    topic: "Pseudocode → Python",
    en: {
      stem:
        "Pseudocode: START; n:=5; REPEAT PRINT n; n:=n-2; UNTIL n<1; STOP. Which Python code correctly represents this?",
      options: [
        "n=5\\nwhile n<1:\\n  print(n)\\n  n-=2",
        "n=5\\nwhile True:\\n  print(n)\\n  n-=2\\n  if n>1: break",
        "n=5\\nwhile n>=1:\\n  n-=2\\n  print(n)",
        "n=5\\nfor i in range(5): print(i)",
        "n=5\\nwhile n>=1:\\n  print(n)\\n  n-=2",
      ],
    },
    si: {
      stem:
        "ව්‍යාජ කේතය: START; n:=5; REPEAT PRINT n; n:=n-2; UNTIL n<1; STOP. මෙය නිවැරදිව නිරූපණය කරන පයිතන් කේතය කුමක් ද?",
      options: [
        "n=5\\nwhile n<1:\\n  print(n)\\n  n-=2",
        "n=5\\nwhile True:\\n  print(n)\\n  n-=2\\n  if n>1: break",
        "n=5\\nwhile n>=1:\\n  n-=2\\n  print(n)",
        "n=5\\nfor i in range(5): print(i)",
        "n=5\\nwhile n>=1:\\n  print(n)\\n  n-=2",
      ],
    },
    correctIndex: 4,
  },
  {
    id: 41,
    topic: "Web security",
    en: {
      stem:
        "Four client websites: P - view restaurant menu & location. Q - purchase products online by credit card. R - view daily weather forecasts. S - university students check exam results after logging in. In which must BOTH secure authentication and encrypted communication be primary requirements?",
      options: ["P and Q only", "P and S only", "Q and R only", "Q and S only", "R and S only"],
    },
    si: {
      stem:
        "සේවාලාභීන් සිව්දෙනෙකු සඳහා වෙබ් අඩවි: P - අවන්හලෙහි මෙනු අයිතම සහ පිහිටි ස්ථානය. Q - ණයපත් භාවිතයෙන් මාර්ගගතව නිෂ්පාදන මිලදී ගැනීම. R - දෛනික කාලගුණ අනාවැකි. S - ඇතුළු වූ පසු විභාග ප්‍රතිඵල පරීක්ෂා කිරීම. ආරක්ෂිත පරිශීලක සත්‍යාපනය හා ගුප්ත කේතන සන්නිවේදනය දෙකම අනිවාර්ය අවශ්‍යතා විය යුත්තේ කවර වෙබ් අඩවිවල ද?",
      options: ["P සහ Q පමණි", "P සහ S පමණි", "Q සහ R පමණි", "Q සහ S පමණි", "R සහ S පමණි"],
    },
    correctIndex: 3,
  },
  {
    id: 42,
    topic: "Client-side vs server-side scripting",
    replaced: true,
    en: {
      stem:
        "A web form checks that a \"phone number\" field contains only digits before the form is submitted, giving instant feedback with no page reload. Why is this best done with client-side scripting (e.g. JavaScript)?",
      options: [
        "Client-side scripting is more secure, so all validation should happen there instead of on the server",
        "It runs in the browser, giving instant feedback without a server round trip — though the server must still re-validate the same data",
        "Server-side scripts cannot read form field values at all",
        "Client-side scripting permanently stores the validation rules in the site's database",
        "Client-side validation removes any need for server-side processing",
      ],
    },
    si: {
      stem:
        "වෙබ් පෝරමයක් ඉදිරිපත් කිරීමට පෙරම \"දුරකථන අංකය\" ක්ෂේත්‍රයේ ඇත්තේ ඉලක්කම් පමණක් දැයි පිටුව නැවත පූරණය නොකර වහාම පරීක්ෂා කරයි. මෙය සේවාලාභී පාර්ශ්වීය ස්ක්‍රිප්ට් කිරීමෙන් සිදු කිරීම වඩාත් සුදුසු වන්නේ ඇයි?",
      options: [
        "සේවාලාභී පාර්ශ්වීය ස්ක්‍රිප්ට් කිරීම වඩාත් ආරක්ෂිත බැවින්, සියලු සත්‍යාපනය එහිදී සිදු කළ යුතුය",
        "එය අතිරික්සුව තුළ ක්‍රියාත්මක වන බැවින් සේවාදායකයට යාමකින් තොරව ක්ෂණික ප්‍රතිචාරයක් ලබාදෙයි — නමුත් සේවාදායකය ද එම දත්ත නැවත සත්‍යාපනය කළ යුතුමය",
        "සේවාදායක පාර්ශ්වීය ස්ක්‍රිප්ට්වලට පෝරම ක්ෂේත්‍ර අගයන් කිසිසේත් කියවිය නොහැක",
        "සේවාලාභී පාර්ශ්වීය ස්ක්‍රිප්ට් කිරීම සත්‍යාපන නීති දත්තසමුදායේ ස්ථිරව ගබඩා කරයි",
        "සේවාලාභී පාර්ශ්වීය සත්‍යාපනය සේවාදායක පාර්ශ්වීය සැකසුමේ අවශ්‍යතාව සම්පූර්ණයෙන් ඉවත් කරයි",
      ],
    },
    correctIndex: 1,
  },
  {
    id: 43,
    topic: "HTTP methods",
    replaced: true,
    en: {
      stem:
        "A site has a login form (username + password) and a public catalogue search (the term appears in the URL, e.g. ?q=laptop). Which HTTP method choice is correct?",
      options: [
        "Login should use GET, since GET is encrypted by default; search should use POST",
        "Both should use GET, since GET is faster for all requests",
        "Login should use POST, since sensitive data shouldn't appear in the URL/history; search can use GET, since a shareable URL is expected there",
        "Both should use POST, since POST always encrypts data over HTTP",
        "The choice of GET or POST has no effect on where submitted data appears",
      ],
    },
    si: {
      stem:
        "වෙබ් අඩවියක පිවිසුම් පෝරමයක් (පරිශීලක නාමය + මුරපදය) සහ පොදු නිෂ්පාදන ලැයිස්තු සෙවුමක් (සෙවුම් පදය URL එකේ දිස්වේ, උදා: ?q=laptop) පවතී. නිවැරදි HTTP ක්‍රමවේද තේරීම කුමක් ද?",
      options: [
        "පිවිසුම GET භාවිත කළ යුතුය, GET සැමවිට ගුප්තකේතනය කරන බැවින්; සෙවුම POST භාවිත කළ යුතුය",
        "දෙකම GET භාවිත කළ යුතුය, සියලු ඉල්ලීම් සඳහා GET වේගවත් බැවින්",
        "පිවිසුම POST භාවිත කළ යුතුය, සංවේදී දත්ත URL/ඉතිහාසයේ නොතිබිය යුතු බැවින්; බෙදාගත හැකි URL එකක් අපේක්ෂිත බැවින් සෙවුමට GET භාවිත කළ හැකිය",
        "දෙකම POST භාවිත කළ යුතුය, POST සැමවිට HTTP හරහා දත්ත ගුප්තකේතනය කරන බැවින්",
        "GET හෝ POST තේරීමෙන් ඉදිරිපත් කළ දත්ත පෙනෙන ස්ථානයට කිසිදු බලපෑමක් නැත",
      ],
    },
    correctIndex: 2,
  },
  {
    id: 44,
    topic: "Cookies & sessions",
    replaced: true,
    en: {
      stem:
        "An online store must remember a shopper's cart across pages, keeping the actual cart data on the server, with only a small identifier in the browser. Best approach?",
      options: [
        "Store the entire cart inside a cookie, with no server-side storage",
        "Store a unique session ID in a cookie, and keep the actual cart data in server-side session storage linked to that ID",
        "Store the cart contents inside the page's HTML source, one copy per visitor",
        "Store the cart contents only in the URL of every page visited",
        "Disable cookies and identify the cart by the shopper's IP address",
      ],
    },
    si: {
      stem:
        "අන්තර්ජාල වෙළඳසැලක් සිය පිටු පුරා සාප්පු කරුවෙකුගේ කරත්තය මතක තබාගත යුතු අතර, තැබිය යුත්තේ සේවාදායකයේ ඇත්ත කරත්ත දත්ත, අතිරික්සුවේ ඇත්තේ කුඩා හඳුනාගැනීමේ අගයක් පමණි. වඩාත් සුදුසු ක්‍රමය කුමක් ද?",
      options: [
        "සම්පූර්ණ කරත්තය කුකියක් තුළම ගබඩා කරන්න, සේවාදායක පාර්ශ්වීය ගබඩාවක් නොමැතිව",
        "අනන්‍ය සැසි හැඳුනුම්පතක් කුකියක තබා, ඇත්ත කරත්ත දත්ත එම හැඳුනුම්පතට සම්බන්ධ සේවාදායක සැසි ගබඩාවක තබන්න",
        "කරත්ත අන්තර්ගතය පිටුවේ HTML මූලාශ්‍රය තුළ, එක් අමුත්තෙකුට එක් පිටපතක් ලෙස ගබඩා කරන්න",
        "කරත්ත අන්තර්ගතය පිවිසින සෑම පිටුවක URL එකේම පමණක් ගබඩා කරන්න",
        "කුකී අක්‍රීය කර සාප්පු කරුගේ IP ලිපිනයෙන් කරත්තය හඳුනාගන්න",
      ],
    },
    correctIndex: 1,
  },
  {
    id: 45,
    topic: "ICT law & ethics",
    replaced: true,
    en: {
      stem:
        "A former employee copied the customer database (names, phone numbers, purchase history) to a personal USB drive before leaving, and now uses it to contact those customers for a personal business, without consent. This is primarily a violation of:",
      options: ["Freedom of Information", "Data protection / privacy", "Net neutrality", "Open source licensing", "Digital divide"],
    },
    si: {
      stem:
        "හිටපු සේවකයෙක් සමාගමෙන් ඉවත්වීමට පෙර පාරිභෝගික දත්තසමුදාය පුද්ගලික සැණෙලි ධාවකයකට පිටපත් කර, දැන් එය තම පෞද්ගලික ව්‍යාපාරයක් සඳහා එම පාරිභෝගිකයන් අමතන්නට කැමැත්තකින් තොරව භාවිත කරයි. මෙය ප්‍රධාන වශයෙන් උල්ලංඝනය කරන්නේ:",
      options: ["තොරතුරු නිදහස", "දත්ත ආරක්ෂාව / පෞද්ගලිකත්වය", "ජාල මධ්‍යස්ථභාවය", "විවෘත මූලාශ්‍ර බලපත්‍රීකරණය", "ඩිජිටල් පරතරය"],
    },
    correctIndex: 1,
  },
  {
    id: 46,
    topic: "PHP & MySQL",
    en: {
      stem: '$conn = mysqli_connect("1", "2", "3", "4", "5"); What is the correct parameter sequence for mysqli_connect?',
      options: [
        "1-server's name, 2-password, 3-database name, 4-username",
        "1-server's name, 2-username, 3-database name, 4-password",
        "1-database name, 2-username, 3-password, 4-server's name",
        "1-username, 2-password, 3-database name, 4-server's name",
        "1-server's name, 2-username, 3-password, 4-database name",
      ],
    },
    si: {
      stem: '$conn = mysqli_connect("1", "2", "3", "4", "5"); mysqli_connect ශ්‍රිතය වෙත ආදේශ වන පරාමිති පටිපාටිය නිවැරදිව දක්වන්නේ පහත සඳහන් කවරක ද?',
      options: [
        "1 - සේවාදායකයාගේ නම, 2 - මුරපදය, 3 - දත්තසමුදායේ නම, 4 - පරිශීලක නාමය",
        "1 - සේවාදායකයාගේ නම, 2 - පරිශීලක නාමය, 3 - දත්තසමුදායේ නම, 4 - මුරපදය",
        "1 - දත්තසමුදායේ නම, 2 - පරිශීලක නාමය, 3 - මුරපදය, 4 - සේවාදායකයාගේ නම",
        "1 - පරිශීලක නාමය, 2 - මුරපදය, 3 - දත්තසමුදායේ නම, 4 - සේවාදායකයාගේ නම",
        "1 - සේවාදායකයාගේ නම, 2 - පරිශීලක නාමය, 3 - මුරපදය, 4 - දත්තසමුදායේ නම",
      ],
    },
    correctIndex: 4,
  },
  {
    id: 47,
    topic: "Embedded systems",
    en: {
      stem:
        "Match components A1-A3 with board features B1-B3. A1 - LDR. A2 - LED. A3 - Reed switch fixed to a door. B1 - Analog input. B2 - Digital input. B3 - Digital output.",
      options: ["A1-B1, A2-B2, A3-B3", "A1-B1, A2-B3, A3-B2", "A1-B2, A2-B3, A3-B1", "A1-B2, A2-B1, A3-B3", "A1-B3, A2-B1, A3-B2"],
    },
    si: {
      stem:
        "A1 සිට A3 තෙක් ලේබල් කර ඇති සංරචකයන් සමග B1 සිට B3 තෙක් ලේබල් කර ඇති පුවරුවේ ලක්ෂණ ගළපන්න. A1 - LDR. A2 - LED. A3 - දොරක සවි කළ රීඩ් ස්විචය. B1 - ප්‍රතිසමක ආදානය. B2 - ඩිජිටල් ආදානය. B3 - ඩිජිටල් ප්‍රතිදානය.",
      options: ["A1-B1, A2-B2, A3-B3", "A1-B1, A2-B3, A3-B2", "A1-B2, A2-B3, A3-B1", "A1-B2, A2-B1, A3-B3", "A1-B3, A2-B1, A3-B2"],
    },
    correctIndex: 1,
  },
  {
    id: 48,
    topic: "Embedded systems & IoT",
    en: {
      stem: "Which of the following is correct regarding embedded systems and IoT?",
      options: [
        "A piezo buzzer can be used as an actuator in an IoT application.",
        "A reed switch can be used as both a sensor and an actuator in an IoT application.",
        "An ethernet shield connected to an Arduino Uno communicates with it via the A0 to A4 analog pins.",
        "An LDR is a type of diode that changes its resistance based on the light intensity falling on it.",
        "A microprocessor is a single chip that includes a CPU, memory, input/output ports, and other peripherals.",
      ],
    },
    si: {
      stem: "පහත ඒවා අතුරෙන් නිහිත පද්ධති සහ IoT සම්බන්ධව නිවැරදි වන්නේ කුමක් ද?",
      options: [
        "IoT යෙදුමක දී piezo බසරයක්, යෝජකයක් (actuator) සේ භාවිත කළ හැකිය.",
        "IoT යෙදුමක දී සංවේදකයක් හා යෝජකයක් යන දෙයාකාරයටම reed ස්විචයක් භාවිත කළ හැකිය.",
        "Arduino Uno ට සම්බන්ධ කළ ethernet shield එකක් එය සමග සන්නිවේදනය කරනු ලබන්නේ A0 සිට A4 ප්‍රතිසම කූරු හරහාය.",
        "LDR යනු එය මතට පතිතවන ආලෝක තීව්‍රතාව මත පදනම්ව තම ප්‍රතිරෝධය වෙනස් කරගන්නා ආකාරයේ දියෝඩයකි.",
        "ක්ෂුද්‍ර සකසනයක් යනු CPU, මතකය, ආදාන/ප්‍රතිදාන කෙවෙනි සහ අනෙකුත් පර්යන්ත ඇතුළත් වූ එක් චිපයකි.",
      ],
    },
    correctIndex: 0,
  },
  {
    id: 49,
    topic: "Quantum computing",
    en: {
      stem:
        "Conventional computers store data as bits (0 or 1). Quantum computers use 'qubits'. Compared to a standard bit, what gives a qubit its distinction and uniqueness?",
      options: [
        "Because a qubit is physically larger and heavier, it allows fast storage of massive files like movies.",
        "Because a qubit operates entirely without electricity, a quantum computer needs no power supply.",
        "A qubit can exist in a state known as superposition — representing 0, 1, or a combination of both at the same time.",
        "A qubit can automatically erase any virus present in a computer before it executes.",
        "Depending on the user's mood, a qubit can physically change the colour of the computer screen.",
      ],
    },
    si: {
      stem:
        "සාමාන්‍ය පරිගණකවල දත්ත ආචයනය වන්නේ බිටු ලෙස පමණි (0 හෝ 1). ක්වොන්ටම් පරිගණක 'qubits' භාවිත කරයි. සාමාන්‍ය බිටුවක් හා සංසන්දනය කළ විට qubit එකක වෙනස හා අනන්‍යතාවය ඇති කරනුයේ පහත කුමක් නිසා ද?",
      options: [
        "භෞතික වශයෙන් qubit එක වඩා විශාල හා බරින් යුතු බැවින්, එයට චිත්‍රපට වැනි අතිවිශාල ගොනු වේගවත්ව ආචයනය කිරීමට ඉඩ සලසයි.",
        "qubit විදුලිය කිසිසේත්ම භාවිතයෙන් තොරව ක්‍රියාත්මක වන බැවින්, ක්වොන්ටම් පරිගණක සඳහා විදුලිබල සැපයුමක් අවශ්‍ය නොවේ.",
        "superposition ලෙස හඳුන්වනු ලබන අවස්ථාවක qubit ට පැවතිය හැකි අතර, එනම් එයට 0, 1 හෝ එම දෙකෙහිම සංයෝජනයක් එකම වේලාවේදී නියෝජනය කළ හැකිය.",
        "qubit ට ස්වයංක්‍රීය අයුරෙන් පරිගණකයක පවතින ඕනෑම වයිරසයක් ක්‍රියාත්මකවීමට පෙර මැකිය හැකිය.",
        "පරිශීලකගේ මනෝභාවය අනුව, qubit ට පරිගණක තිරයේ වර්ණය භෞතික වශයෙන් වෙනස් කළ හැකිය.",
      ],
    },
    correctIndex: 2,
  },
  {
    id: 50,
    topic: "AI — multi-agent systems",
    en: {
      stem: "In a multi-agent system, which of the following describes the core characteristic of how these agents operate?",
      options: [
        "They all use a single central computer that instructs every agent exactly what to do at every microsecond.",
        "They are not allowed to talk to each other and automatically shut down if another agent is detected nearby.",
        "Each agent senses its surroundings, makes independent decisions, and communicates with others as needed.",
        "They can only function if a human manager gives them manual commands for every step they take.",
        "They are designed to physically take over the user's keyboard and mouse in an emergency.",
      ],
    },
    si: {
      stem: "බහුඒජන්ත පද්ධතියක් තුළදී මෙම ඒජන්තයන් ක්‍රියාත්මකවන ආකාරයේ මූලික ගුණාංගයක් පහත සඳහන් කුමක් මගින් විස්තර කෙරේ ද?",
      options: [
        "ඔවුන් සියල්ලම සෑම මයික්‍රෝ තත්පරයකදීම හරියටම කළ යුතු දේ කුමක්දැයි සෑම ඒජන්තයෙකුටම උපදෙස් ලබාදෙන එක් තනි මධ්‍ය පරිගණකයක් යොදාගනී.",
        "ඔවුනට එකිනෙක සමග කතා කිරීමට ඉඩ නොමැති අතර ආසන්නව පවතින තවත් ඒජන්තයෙක් අනාවරණය වුවහොත් ස්වයංක්‍රීයව වසා දැමේ.",
        "සෑම ඒජන්තයෙකුම අවට තිබෙන දේ සංවේදනය කරමින් තමන්ගේ ස්වාධීන තීරණ ගන්නා අතර අවශ්‍ය පරිදි ඔවුන් අතර සන්නිවේදනය කර ගනී.",
        "කරනු ලබන සෑම පියවරක් සඳහාම මානව කළමනාකරුවකු විසින් අත්හුරු අයුරින් විධාන ලබා දුන්නේ නම් පමණක් ඔවුනට වැඩ කළ හැකිය.",
        "හදිසි අවස්ථාවකදී පරිශීලක යතුරු පුවරුව හා මූසිකය භෞතිකව භාරගැනීම සඳහා ඔවුන්ට සැලසුම් කර ඇත.",
      ],
    },
    correctIndex: 2,
  },
];
