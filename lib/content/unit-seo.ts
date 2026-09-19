/**
 * A qualifier and the long-tail phrases a student actually types for each of
 * the 14 NIE competency levels — "learn python for AL ICT", "logic gates
 * notes AL" — so this one template ranks for each unit's own granular
 * queries instead of only the site-wide "A/L ICT" terms. Keyed by
 * `competencyNumber`, which is stable across syllabus years.
 */
export const UNIT_SEO: Record<number, { qualifier?: string; keywords: string[] }> = {
  1: { keywords: ["concept of ICT notes A/L", "data vs information A/L ICT", "A/L ICT unit 1 notes"] },
  2: { keywords: ["computer generations A/L ICT", "von Neumann architecture A/L ICT", "computer hardware notes A/L ICT"] },
  3: {
    qualifier: "Number Systems",
    keywords: ["number systems A/L ICT", "binary to hexadecimal A/L ICT", "two's complement A/L ICT notes"],
  },
  4: {
    qualifier: "Logic Gates",
    keywords: ["logic gates notes AL", "logic gates notes A/L ICT", "truth tables A/L ICT", "Boolean algebra A/L ICT"],
  },
  5: { keywords: ["operating system notes A/L ICT", "types of operating systems A/L ICT"] },
  6: { keywords: ["networking notes A/L ICT", "OSI model A/L ICT", "data communication A/L ICT notes"] },
  7: { keywords: ["system analysis and design A/L ICT", "SDLC notes A/L ICT"] },
  8: {
    qualifier: "SQL & Databases",
    keywords: ["database management notes A/L ICT", "SQL notes A/L ICT", "ER diagram A/L ICT", "normalization A/L ICT"],
  },
  9: {
    qualifier: "Python",
    keywords: ["learn python for AL ICT", "python programming notes A/L ICT", "python past paper questions A/L ICT"],
  },
  10: { qualifier: "HTML5", keywords: ["HTML5 notes A/L ICT", "web development A/L ICT notes"] },
  11: { keywords: ["Internet of Things notes A/L ICT", "IoT A/L ICT"] },
  12: { keywords: ["ICT in business notes A/L", "e-commerce A/L ICT notes"] },
  13: { keywords: ["new trends in ICT A/L notes", "cloud computing and AI A/L ICT"] },
  14: { keywords: ["A/L ICT project guide", "ICT SBA project A/L"] },
};
