/**
 * Normalisation to third normal form, worked on one table all the way down.
 *
 * Competency level 8.7 is six periods, and together with 8.4 to 8.6 it is most
 * of unit 8's Paper II weight. The question is always the same shape: here is
 * an unnormalised table, take it to 3NF and state the anomaly you removed at
 * each step.
 *
 * Students lose marks in two places. They jump straight from the unnormalised
 * table to the final set of tables, which scores nothing because the marks are
 * for the intermediate forms. And they can recite the rules ("no partial
 * dependencies") without being able to point at the column that breaks one.
 *
 * So this walks one realistic table through every stage, and at each stage
 * names the exact column that forced the split and the anomaly it caused.
 * One table throughout, deliberately: a fresh example per normal form is how
 * a student ends up believing the three forms are three unrelated procedures.
 */

import type { Locale } from "@/lib/i18n/dictionary";

export interface TableColumn {
  name: string;
  /** Part of this table's primary key — underlined in the exam, boxed here. */
  isKey?: boolean;
  /** References another table's key. Only appears from 2NF onwards. */
  isForeign?: boolean;
  /** Why this column is the problem at this stage. Drives the highlight. */
  offending?: boolean;
}

export interface NormalTable {
  name: string;
  columns: TableColumn[];
  /** A cell may hold several lines, which is exactly what makes the UNF table unnormalised. */
  rows: string[][];
  /** The key written the way an exam answer writes it. */
  keyNote: string;
}

export interface Anomaly {
  kind: string;
  text: string;
}

export interface NormalFormStage {
  key: string;
  label: string;
  title: string;
  rule: string;
  problem: string | null;
  dependency: string | null;
  anomalies: Anomaly[];
  tables: NormalTable[];
  change: string;
}

type L = Record<Locale, string>;

/**
 * The anomaly names, which are examined terms in their own right.
 *
 * Kept as one list rather than repeated per stage: a student answering "name
 * the anomaly" writes one of exactly these three, and they must read the same
 * everywhere they appear.
 */
const ANOMALY_KIND: Record<"insert" | "update" | "delete", L> = {
  // Plain noun forms in Sinhala, not the genitive "ඇතුළත් කිරීමේ". The badge
  // stands on its own beside the sentence rather than running into it, and a
  // dangling genitive reads as an unfinished phrase.
  insert: { en: "Insert", si: "ඇතුළත් කිරීම" },
  update: { en: "Update", si: "යාවත්කාලීන කිරීම" },
  delete: { en: "Delete", si: "මකා දැමීම" },
};

const RESULT_ROWS_1NF: string[][] = [
  ["S001", "Nimal Perera", "C12A", "Grade 12 A", "ICT", "Information & Comm. Tech.", "78"],
  ["S001", "Nimal Perera", "C12A", "Grade 12 A", "MAT", "Combined Maths", "65"],
  ["S002", "Kavindi Silva", "C12A", "Grade 12 A", "ICT", "Information & Comm. Tech.", "92"],
  ["S002", "Kavindi Silva", "C12A", "Grade 12 A", "PHY", "Physics", "71"],
  ["S003", "Ashan Fernando", "C12B", "Grade 12 B", "ICT", "Information & Comm. Tech.", "55"],
];

interface StageData {
  key: string;
  label: L;
  title: L;
  rule: L;
  problem: L | null;
  dependency: L | null;
  anomalies: Array<{ kind: keyof typeof ANOMALY_KIND; text: L }>;
  change: L;
  tables: Array<{ name: string; keyNote: L; columns: TableColumn[]; rows: string[][] }>;
}

/**
 * Table and column names stay in English in both languages, on purpose.
 *
 * A Sinhala-medium student writes `STUDENT_RESULT` and `StudentID` in their
 * answer script exactly as printed here — schema identifiers are not
 * translated on the Sinhala paper any more than SQL keywords are. Only the
 * explanation around the tables changes language.
 */
const STAGE_DATA: StageData[] = [
  {
    key: "unf",
    label: { en: "UNF", si: "UNF" },
    title: { en: "Unnormalised form", si: "සාමාන්‍යකරණය නොකළ ස්වරූපය (UNF)" },
    change: {
      en: "The table as it arrives — one row per student, with all of that student's subject results crammed into repeating cells.",
      si: "වගුව ආපු විදිහටම — එක ශිෂ්‍යයෙකුට එක පේළියක්, ඒ ශිෂ්‍යයාගේ හැම විෂයයකම ප්‍රතිඵල එකම කොටුවකට කොටලා.",
    },
    rule: {
      en: "A table is unnormalised when a single cell holds more than one value, or a group of columns repeats for one row.",
      si: "එක කොටුවක අගයකට වඩා තියෙනවා නම්, නැත්නම් එක පේළියක් ඇතුළේ තීරු සමූහයක් නැවත නැවත එනවා නම්, ඒ වගුව සාමාන්‍යකරණය නොකළ එකක්.",
    },
    problem: {
      en: "Three columns repeat inside one row. There is no way to write a query for \"every student who took ICT\" when the subject sits in a list rather than a column.",
      si: "එක පේළියක් ඇතුළේ තීරු තුනක් නැවත එනවා. විෂයය තීරුවක නෙවෙයි ලැයිස්තුවක තියෙන නිසා \"ICT කරපු හැම ශිෂ්‍යයෙක්ම\" කියලා query එකක් ලියන්න බෑ.",
    },
    dependency: {
      en: "Repeating group: (SubjectCode, SubjectName, Marks) repeats within one StudentID.",
      si: "පුනරාවර්තී සමූහය: එක StudentID එකක් ඇතුළේ (SubjectCode, SubjectName, Marks) නැවත නැවත එනවා.",
    },
    anomalies: [
      {
        kind: "insert",
        text: {
          en: "A new subject nobody has sat yet cannot be recorded at all — there is no row to put it in until some student takes it.",
          si: "තාම කවුරුවත් නොකරන අලුත් විෂයයක් සටහන් කරන්නම බෑ — කවුරුහරි ඒක කරනකම් ඒක දාන්න පේළියක් නෑ.",
        },
      },
      {
        kind: "update",
        text: {
          en: "Correcting a subject's name means editing it inside every student's list, and missing one leaves two names for one subject.",
          si: "විෂයයක නම හදනවා කියන්නේ හැම ශිෂ්‍යයෙකුගේම ලැයිස්තුව ඇතුළේ ඒක වෙනස් කරන එක. එකක් මඟ හැරුණොත් එක විෂයයකට නම් දෙකක් තියෙනවා.",
        },
      },
      {
        kind: "delete",
        text: {
          en: "Removing the only student taking Physics deletes the fact that Physics exists.",
          si: "Physics කරන එකම ශිෂ්‍යයා අයින් කළොත් Physics කියලා විෂයයක් තියෙනවා කියන කාරණයත් මැකෙනවා.",
        },
      },
    ],
    tables: [
      {
        name: "STUDENT_RESULT",
        keyNote: { en: "Primary key: StudentID", si: "ප්‍රාථමික යතුර: StudentID" },
        columns: [
          { name: "StudentID", isKey: true },
          { name: "StudentName" },
          { name: "ClassID" },
          { name: "ClassName" },
          { name: "SubjectCode", offending: true },
          { name: "SubjectName", offending: true },
          { name: "Marks", offending: true },
        ],
        rows: [
          ["S001", "Nimal Perera", "C12A", "Grade 12 A", "ICT\nMAT", "Information & Comm. Tech.\nCombined Maths", "78\n65"],
          ["S002", "Kavindi Silva", "C12A", "Grade 12 A", "ICT\nPHY", "Information & Comm. Tech.\nPhysics", "92\n71"],
          ["S003", "Ashan Fernando", "C12B", "Grade 12 B", "ICT", "Information & Comm. Tech.", "55"],
        ],
      },
    ],
  },
  {
    key: "1nf",
    label: { en: "1NF", si: "1NF" },
    title: { en: "First normal form", si: "පළමු සාමාන්‍ය ස්වරූපය (1NF)" },
    change: {
      en: "The repeating group is flattened: one row per student per subject. The key has to grow to StudentID + SubjectCode, because StudentID alone no longer identifies a row.",
      si: "පුනරාවර්තී සමූහය වෙන් කරනවා: එක ශිෂ්‍යයෙකුට එක විෂයයකට එක පේළියක්. දැන් StudentID එකෙන් විතරක් පේළියක් හඳුනගන්න බැරි නිසා යතුර StudentID + SubjectCode දක්වා ලොකු වෙන්න ඕන.",
    },
    rule: {
      en: "A table is in 1NF when every cell holds a single value and there are no repeating groups.",
      si: "හැම කොටුවකම එක අගයක් විතරක් තියෙනවා නම්, පුනරාවර්තී සමූහ නෑ නම්, වගුව 1NF එකේ තියෙනවා.",
    },
    problem: {
      en: "The key is now composite, and two columns depend on only half of it. StudentName is fixed by StudentID alone; SubjectName is fixed by SubjectCode alone.",
      si: "දැන් යතුර සංයුක්තයි, තීරු දෙකක් රඳා පවතින්නේ ඒකෙන් බාගයක් උඩ විතරයි. StudentName තීරණය වෙන්නේ StudentID එකෙන් විතරයි; SubjectName තීරණය වෙන්නේ SubjectCode එකෙන් විතරයි.",
    },
    dependency: {
      en: "Partial dependencies: StudentID → StudentName, ClassID, ClassName · SubjectCode → SubjectName",
      si: "අර්ධ පරායත්තතා: StudentID → StudentName, ClassID, ClassName · SubjectCode → SubjectName",
    },
    anomalies: [
      {
        kind: "update",
        text: {
          en: "Nimal Perera's name is stored once per subject he takes. Changing it in one row and not the others leaves the database disagreeing with itself.",
          si: "Nimal Perera ගේ නම එයා කරන හැම විෂයයකටම වෙන වෙනම තියෙනවා. එක පේළියක විතරක් වෙනස් කළොත් දත්ත ගබඩාව තමන් එක්කම එකඟ නොවී තියෙනවා.",
        },
      },
      {
        kind: "insert",
        text: {
          en: "A student who has not been entered for any subject yet still cannot be stored — there would be no SubjectCode to complete the key.",
          si: "තාම විෂයයකට ලියාපදිංචි නොවුණු ශිෂ්‍යයෙක් තාමත් ගබඩා කරන්න බෑ — යතුර සම්පූර්ණ කරන්න SubjectCode එකක් නෑ.",
        },
      },
      {
        kind: "delete",
        text: {
          en: "Deleting Ashan Fernando's only result deletes Ashan Fernando.",
          si: "Ashan Fernando ගේ තියෙන එකම ප්‍රතිඵලය මැකුවම Ashan Fernando කියන ශිෂ්‍යයාමත් මැකෙනවා.",
        },
      },
    ],
    tables: [
      {
        name: "STUDENT_RESULT",
        keyNote: {
          en: "Primary key: StudentID + SubjectCode (composite)",
          si: "ප්‍රාථමික යතුර: StudentID + SubjectCode (සංයුක්ත)",
        },
        columns: [
          { name: "StudentID", isKey: true },
          { name: "StudentName", offending: true },
          { name: "ClassID", offending: true },
          { name: "ClassName", offending: true },
          { name: "SubjectCode", isKey: true },
          { name: "SubjectName", offending: true },
          { name: "Marks" },
        ],
        rows: RESULT_ROWS_1NF,
      },
    ],
  },
  {
    key: "2nf",
    label: { en: "2NF", si: "2NF" },
    title: { en: "Second normal form", si: "දෙවන සාමාන්‍ය ස්වරූපය (2NF)" },
    change: {
      en: "Everything depending on only part of the composite key moves out into its own table. Marks stays behind, because marks genuinely need both the student and the subject to be meaningful.",
      si: "සංයුක්ත යතුරෙන් කොටසක් උඩ විතරක් රඳා පවතින හැම දෙයක්ම වෙනම වගුවකට යනවා. Marks විතරක් ඉතුරු වෙනවා, මොකද ලකුණකට අර්ථයක් එන්නේ ශිෂ්‍යයායි විෂයයයි දෙකම එක්කයි.",
    },
    rule: {
      en: "A table is in 2NF when it is in 1NF and every non-key column depends on the whole primary key, not just part of it.",
      si: "වගුව 1NF එකේ තියෙනවා නම්, යතුර නොවන හැම තීරුවක්ම සම්පූර්ණ ප්‍රාථමික යතුර උඩ රඳා පවතිනවා නම් (කොටසක් උඩ විතරක් නෙවෙයි), ඒක 2NF එකේ.",
    },
    problem: {
      en: "STUDENT still hides a dependency. ClassName is not determined by StudentID directly — it is determined by ClassID, which is itself just an ordinary column.",
      si: "STUDENT වගුවේ තාමත් පරායත්තතාවක් හැංගිලා. ClassName කෙලින්ම StudentID එකෙන් තීරණය වෙන්නේ නෑ — ඒක තීරණය වෙන්නේ ClassID එකෙන්, ඒකත් සාමාන්‍ය තීරුවක් විතරයි.",
    },
    dependency: {
      en: "Transitive dependency: StudentID → ClassID → ClassName",
      si: "සංක්‍රාන්ති පරායත්තතාව: StudentID → ClassID → ClassName",
    },
    anomalies: [
      {
        kind: "update",
        text: {
          en: "Renaming \"Grade 12 A\" means editing every student in that class, and any row missed leaves two names for one class.",
          si: "\"Grade 12 A\" කියන නම වෙනස් කරනවා කියන්නේ ඒ පන්තියේ හැම ශිෂ්‍යයෙකුගේම පේළිය වෙනස් කරන එක. එකක් මඟ හැරුණොත් එක පන්තියකට නම් දෙකක් තියෙනවා.",
        },
      },
      {
        kind: "insert",
        text: {
          en: "A class that has no students enrolled yet cannot be recorded.",
          si: "තාම ශිෂ්‍යයෝ නැති පන්තියක් සටහන් කරන්න බෑ.",
        },
      },
      {
        kind: "delete",
        text: {
          en: "Removing the last student in Grade 12 B removes the class as well.",
          si: "Grade 12 B එකේ ඉතුරු අන්තිම ශිෂ්‍යයා අයින් කළොත් පන්තියත් අයින් වෙනවා.",
        },
      },
    ],
    tables: [
      {
        name: "STUDENT",
        keyNote: { en: "Primary key: StudentID", si: "ප්‍රාථමික යතුර: StudentID" },
        columns: [
          { name: "StudentID", isKey: true },
          { name: "StudentName" },
          { name: "ClassID", offending: true },
          { name: "ClassName", offending: true },
        ],
        rows: [
          ["S001", "Nimal Perera", "C12A", "Grade 12 A"],
          ["S002", "Kavindi Silva", "C12A", "Grade 12 A"],
          ["S003", "Ashan Fernando", "C12B", "Grade 12 B"],
        ],
      },
      {
        name: "SUBJECT",
        keyNote: { en: "Primary key: SubjectCode", si: "ප්‍රාථමික යතුර: SubjectCode" },
        columns: [{ name: "SubjectCode", isKey: true }, { name: "SubjectName" }],
        rows: [
          ["ICT", "Information & Comm. Tech."],
          ["MAT", "Combined Maths"],
          ["PHY", "Physics"],
        ],
      },
      {
        name: "RESULT",
        keyNote: {
          en: "Primary key: StudentID + SubjectCode · both are also foreign keys",
          si: "ප්‍රාථමික යතුර: StudentID + SubjectCode · දෙකම විදේශීය යතුරුත් වෙනවා",
        },
        columns: [
          { name: "StudentID", isKey: true, isForeign: true },
          { name: "SubjectCode", isKey: true, isForeign: true },
          { name: "Marks" },
        ],
        rows: [
          ["S001", "ICT", "78"],
          ["S001", "MAT", "65"],
          ["S002", "ICT", "92"],
          ["S002", "PHY", "71"],
          ["S003", "ICT", "55"],
        ],
      },
    ],
  },
  {
    key: "3nf",
    label: { en: "3NF", si: "3NF" },
    title: { en: "Third normal form", si: "තෙවන සාමාන්‍ය ස්වරූපය (3NF)" },
    change: {
      en: "ClassName moves to a CLASS table of its own, and STUDENT keeps only ClassID as a foreign key pointing at it. Every fact is now stored in exactly one place.",
      si: "ClassName වෙනම CLASS වගුවකට යනවා, STUDENT එකේ ඉතුරු වෙන්නේ ඒකට යොමු වෙන විදේශීය යතුර වන ClassID විතරයි. දැන් හැම කාරණයක්ම තියෙන්නේ එකම තැනක.",
    },
    rule: {
      en: "A table is in 3NF when it is in 2NF and no non-key column depends on another non-key column.",
      si: "වගුව 2NF එකේ තියෙනවා නම්, යතුර නොවන තීරුවක් තව යතුර නොවන තීරුවක් උඩ රඳා පවතින්නේ නෑ නම්, ඒක 3NF එකේ.",
    },
    problem: null,
    dependency: null,
    anomalies: [],
    tables: [
      {
        name: "STUDENT",
        keyNote: {
          en: "Primary key: StudentID · ClassID is a foreign key",
          si: "ප්‍රාථමික යතුර: StudentID · ClassID විදේශීය යතුරක්",
        },
        columns: [
          { name: "StudentID", isKey: true },
          { name: "StudentName" },
          { name: "ClassID", isForeign: true },
        ],
        rows: [
          ["S001", "Nimal Perera", "C12A"],
          ["S002", "Kavindi Silva", "C12A"],
          ["S003", "Ashan Fernando", "C12B"],
        ],
      },
      {
        name: "CLASS",
        keyNote: { en: "Primary key: ClassID", si: "ප්‍රාථමික යතුර: ClassID" },
        columns: [{ name: "ClassID", isKey: true }, { name: "ClassName" }],
        rows: [
          ["C12A", "Grade 12 A"],
          ["C12B", "Grade 12 B"],
        ],
      },
      {
        name: "SUBJECT",
        keyNote: { en: "Primary key: SubjectCode", si: "ප්‍රාථමික යතුර: SubjectCode" },
        columns: [{ name: "SubjectCode", isKey: true }, { name: "SubjectName" }],
        rows: [
          ["ICT", "Information & Comm. Tech."],
          ["MAT", "Combined Maths"],
          ["PHY", "Physics"],
        ],
      },
      {
        name: "RESULT",
        keyNote: {
          en: "Primary key: StudentID + SubjectCode · both are also foreign keys",
          si: "ප්‍රාථමික යතුර: StudentID + SubjectCode · දෙකම විදේශීය යතුරුත් වෙනවා",
        },
        columns: [
          { name: "StudentID", isKey: true, isForeign: true },
          { name: "SubjectCode", isKey: true, isForeign: true },
          { name: "Marks" },
        ],
        rows: [
          ["S001", "ICT", "78"],
          ["S001", "MAT", "65"],
          ["S002", "ICT", "92"],
          ["S002", "PHY", "71"],
          ["S003", "ICT", "55"],
        ],
      },
    ],
  },
];

export function normalFormStages(locale: Locale = "en"): NormalFormStage[] {
  return STAGE_DATA.map((stage) => ({
    key: stage.key,
    label: stage.label[locale],
    title: stage.title[locale],
    rule: stage.rule[locale],
    problem: stage.problem ? stage.problem[locale] : null,
    dependency: stage.dependency ? stage.dependency[locale] : null,
    change: stage.change[locale],
    anomalies: stage.anomalies.map((a) => ({
      kind: ANOMALY_KIND[a.kind][locale],
      text: a.text[locale],
    })),
    tables: stage.tables.map((t) => ({
      name: t.name,
      keyNote: t.keyNote[locale],
      columns: t.columns,
      rows: t.rows,
    })),
  }));
}
