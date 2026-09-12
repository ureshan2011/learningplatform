import type { Locale } from "@/lib/i18n/dictionary";

/**
 * A/L ICT subject vocabulary, English and Sinhala, in one place.
 *
 * ## Why this is a glossary and not strings scattered through the components
 *
 * A Sinhala-medium student has to write the term that appears on the Sinhala
 * paper. If this platform teaches them a different word, the platform has made
 * things worse, not better — they will recognise nothing in the exam hall. So
 * the vocabulary has to be correctable in one pass by someone holding the NIE
 * teachers' resource book, without opening a single component. That is this
 * file: change a term here and every lesson, interactive and note follows.
 *
 * ## How each term was decided
 *
 * `verify: false` marks terms in settled everyday Sinhala-medium use, the same
 * standard the rest of `dictionary.ts` is written to. `verify: true` marks the
 * ones to check against the resource book and recent Sinhala past papers
 * before trusting them — they are the specialist terms where a plausible
 * translation and the examiner's translation can easily differ.
 *
 * Where a term is normally left in English inside Sinhala teaching material —
 * register names, SQL, the normal forms, Karnaugh — the Sinhala value is the
 * English word in Latin script, on purpose. That follows both the NIE books'
 * own practice and this project's rule that a coined Sinhala equivalent nobody
 * says is harder to read than the English it replaced. Abbreviations examined
 * in English (PC, MAR, MDR, CIR, ACC, FCFS, SJF, 1NF) are never translated in
 * either language.
 */

export interface Term {
  en: string;
  si: string;
  /** True when this needs checking against the NIE resource book before it is trusted. */
  verify?: boolean;
}

const t = (en: string, si: string, verify = false): Term => ({ en, si, verify });

export const ICT_TERMS = {
  /* ---- general computing, settled usage ---- */
  data: t("data", "දත්ත"),
  information: t("information", "තොරතුරු"),
  memory: t("memory", "මතකය"),
  mainMemory: t("main memory", "ප්‍රධාන මතකය"),
  address: t("address", "ලිපිනය"),
  program: t("program", "වැඩසටහන"),
  computer: t("computer", "පරිගණකය"),
  hardware: t("hardware", "දෘඩාංග"),
  software: t("software", "මෘදුකාංග"),
  input: t("input", "ආදාන"),
  output: t("output", "ප්‍රතිදාන"),
  value: t("value", "අගය"),
  table: t("table", "වගුව"),
  row: t("row", "පේළිය"),
  column: t("column", "තීරුව"),
  cell: t("cell", "කොටුව"),
  example: t("example", "උදාහරණය"),

  /* ---- unit 1: data and information ---- */
  dataLifeCycle: t("data life cycle", "දත්ත ජීවන චක්‍රය", true),
  creation: t("creation", "නිර්මාණය", true),
  management: t("management", "කළමනාකරණය", true),
  removalOfObsolete: t("removal of obsolete data", "යල් පැන ගිය දත්ත ඉවත් කිරීම", true),
  timely: t("timely", "කාලෝචිත", true),
  accurate: t("accurate", "නිරවද්‍ය", true),
  inContext: t("in context", "සන්දර්භයට ගැළපෙන", true),
  understandable: t("understandable", "තේරුම්ගත හැකි", true),
  lowUncertainty: t("low uncertainty", "අවිනිශ්චිතතාව අඩු", true),

  /* ---- unit 2: architecture ---- */
  instruction: t("instruction", "විධානය", true),
  controlUnit: t("control unit", "පාලක ඒකකය", true),
  alu: t("arithmetic and logic unit", "අංක ගණිත හා තාර්කික ඒකකය", true),
  register: t("register", "register", true),
  addressBus: t("address bus", "ලිපින බසය", true),
  dataBus: t("data bus", "දත්ත බසය", true),
  controlBus: t("control bus", "පාලක බසය", true),
  fetch: t("fetch", "ලබා ගැනීම", true),
  decode: t("decode", "විකේතනය", true),
  execute: t("execute", "ක්‍රියාත්මක කිරීම", true),
  fetchExecuteCycle: t("fetch-execute cycle", "ලබා ගැනීමේ-ක්‍රියාත්මක කිරීමේ චක්‍රය", true),
  opcode: t("opcode", "opcode", true),
  storedProgram: t("stored program concept", "ගබඩා කළ වැඩසටහන් සංකල්පය", true),

  /* ---- unit 4: digital circuits ---- */
  logicGate: t("logic gate", "තර්ක ද්වාරය", true),
  truthTable: t("truth table", "සත්‍යතා වගුව", true),
  booleanAlgebra: t("Boolean algebra", "බූලීය වීජ ගණිතය", true),
  karnaughMap: t("Karnaugh map", "Karnaugh සිතියම", true),
  grayCode: t("Gray code", "Gray code", true),
  minterm: t("minterm", "minterm", true),
  sop: t("sum of products", "ගුණිත ඓක්‍යය", true),
  pos: t("product of sums", "ඓක්‍ය ගුණිතය", true),
  group: t("group", "සමූහය", true),
  dontCare: t("don't care", "don't care", true),
  simplify: t("simplify", "සරල කිරීම", true),

  /* ---- unit 5: operating systems ---- */
  operatingSystem: t("operating system", "මෙහෙයුම් පද්ධතිය"),
  process: t("process", "ක්‍රියාවලිය", true),
  processControlBlock: t("process control block", "ක්‍රියාවලි පාලක කොටස", true),
  scheduling: t("scheduling", "උපලේඛන ගත කිරීම", true),
  scheduler: t("scheduler", "උපලේඛකය", true),
  contextSwitch: t("context switch", "context switch", true),
  quantum: t("time quantum", "time quantum", true),
  readyQueue: t("ready queue", "ready පෝලිම", true),
  arrivalTime: t("arrival time", "පැමිණීමේ කාලය", true),
  burstTime: t("burst time", "burst කාලය", true),
  completionTime: t("completion time", "සම්පූර්ණ වන කාලය", true),
  turnaroundTime: t("turnaround time", "හැරවුම් කාලය", true),
  waitingTime: t("waiting time", "රැඳී සිටීමේ කාලය", true),
  ganttChart: t("Gantt chart", "Gantt ප්‍රස්තාරය", true),
  preemption: t("pre-emption", "පූර්ව අත්පත් කිරීම", true),
  starvation: t("starvation", "starvation", true),

  /* ---- unit 8: databases ---- */
  database: t("database", "දත්ත ගබඩාව", true),
  primaryKey: t("primary key", "ප්‍රාථමික යතුර", true),
  foreignKey: t("foreign key", "විදේශීය යතුර", true),
  compositeKey: t("composite key", "සංයුක්ත යතුර", true),
  normalization: t("normalization", "සාමාන්‍යකරණය", true),
  functionalDependency: t("functional dependency", "ශ්‍රිතමය පරායත්තතාව", true),
  partialDependency: t("partial dependency", "අර්ධ පරායත්තතාව", true),
  transitiveDependency: t("transitive dependency", "සංක්‍රාන්ති පරායත්තතාව", true),
  fullDependency: t("full dependency", "පූර්ණ පරායත්තතාව", true),
  repeatingGroup: t("repeating group", "පුනරාවර්තී සමූහය", true),
  redundancy: t("redundancy", "අනවශ්‍ය පුනරාවර්තනය", true),
  insertAnomaly: t("insert anomaly", "ඇතුළත් කිරීමේ විෂමතාව", true),
  updateAnomaly: t("update anomaly", "යාවත්කාලීන කිරීමේ විෂමතාව", true),
  deleteAnomaly: t("delete anomaly", "මකා දැමීමේ විෂමතාව", true),
} as const;

export type TermKey = keyof typeof ICT_TERMS;

/** One term in the reader's language. */
export function term(key: TermKey, locale: Locale): string {
  return ICT_TERMS[key][locale];
}

/**
 * Every term still awaiting a check against the NIE resource book.
 *
 * Exported so the list can be printed rather than hunted for — see
 * `scripts/ict-terms-to-check.mjs`.
 */
export function termsToVerify(): Array<{ key: string; en: string; si: string }> {
  return Object.entries(ICT_TERMS)
    .filter(([, value]) => value.verify)
    .map(([key, value]) => ({ key, en: value.en, si: value.si }));
}
