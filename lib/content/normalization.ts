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
  kind: "Insert" | "Update" | "Delete";
  text: string;
}

export interface NormalFormStage {
  key: string;
  /** Short label for the step rail. */
  label: string;
  title: string;
  /** The rule in the syllabus's own terms. */
  rule: string;
  /** What is still wrong after this stage — empty once we reach 3NF. */
  problem: string | null;
  /** The dependency that causes `problem`, written as an exam answer would. */
  dependency: string | null;
  anomalies: Anomaly[];
  tables: NormalTable[];
  /** What actually changed coming into this stage. */
  change: string;
}

const RESULT_ROWS_1NF: string[][] = [
  ["S001", "Nimal Perera", "C12A", "Grade 12 A", "ICT", "Information & Comm. Tech.", "78"],
  ["S001", "Nimal Perera", "C12A", "Grade 12 A", "MAT", "Combined Maths", "65"],
  ["S002", "Kavindi Silva", "C12A", "Grade 12 A", "ICT", "Information & Comm. Tech.", "92"],
  ["S002", "Kavindi Silva", "C12A", "Grade 12 A", "PHY", "Physics", "71"],
  ["S003", "Ashan Fernando", "C12B", "Grade 12 B", "ICT", "Information & Comm. Tech.", "55"],
];

export const NORMAL_FORM_STAGES: NormalFormStage[] = [
  {
    key: "unf",
    label: "UNF",
    title: "Unnormalised form",
    change:
      "The table as it arrives — one row per student, with all of that student's subject results crammed into repeating cells.",
    rule: "A table is unnormalised when a single cell holds more than one value, or a group of columns repeats for one row.",
    problem:
      "Three columns repeat inside one row. There is no way to write a query for \"every student who took ICT\" when the subject sits in a list rather than a column.",
    dependency: "Repeating group: (SubjectCode, SubjectName, Marks) repeats within one StudentID.",
    anomalies: [
      {
        kind: "Insert",
        text: "A new subject nobody has sat yet cannot be recorded at all — there is no row to put it in until some student takes it.",
      },
      {
        kind: "Update",
        text: "Correcting a subject's name means editing it inside every student's list, and missing one leaves two names for one subject.",
      },
      {
        kind: "Delete",
        text: "Removing the only student taking Physics deletes the fact that Physics exists.",
      },
    ],
    tables: [
      {
        name: "STUDENT_RESULT",
        keyNote: "Primary key: StudentID",
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
    label: "1NF",
    title: "First normal form",
    change:
      "The repeating group is flattened: one row per student per subject. The key has to grow to StudentID + SubjectCode, because StudentID alone no longer identifies a row.",
    rule: "A table is in 1NF when every cell holds a single value and there are no repeating groups.",
    problem:
      "The key is now composite, and two columns depend on only half of it. StudentName is fixed by StudentID alone; SubjectName is fixed by SubjectCode alone.",
    dependency:
      "Partial dependencies: StudentID → StudentName, ClassID, ClassName · SubjectCode → SubjectName",
    anomalies: [
      {
        kind: "Update",
        text: "Nimal Perera's name is stored once per subject he takes. Changing it in one row and not the others leaves the database disagreeing with itself.",
      },
      {
        kind: "Insert",
        text: "A student who has not been entered for any subject yet still cannot be stored — there would be no SubjectCode to complete the key.",
      },
      {
        kind: "Delete",
        text: "Deleting Ashan Fernando's only result deletes Ashan Fernando.",
      },
    ],
    tables: [
      {
        name: "STUDENT_RESULT",
        keyNote: "Primary key: StudentID + SubjectCode (composite)",
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
    label: "2NF",
    title: "Second normal form",
    change:
      "Everything depending on only part of the composite key moves out into its own table. Marks stays behind, because marks genuinely need both the student and the subject to be meaningful.",
    rule:
      "A table is in 2NF when it is in 1NF and every non-key column depends on the whole primary key, not just part of it.",
    problem:
      "STUDENT still hides a dependency. ClassName is not determined by StudentID directly — it is determined by ClassID, which is itself just an ordinary column.",
    dependency: "Transitive dependency: StudentID → ClassID → ClassName",
    anomalies: [
      {
        kind: "Update",
        text: "Renaming \"Grade 12 A\" means editing every student in that class, and any row missed leaves two names for one class.",
      },
      {
        kind: "Insert",
        text: "A class that has no students enrolled yet cannot be recorded.",
      },
      {
        kind: "Delete",
        text: "Removing the last student in Grade 12 B removes the class as well.",
      },
    ],
    tables: [
      {
        name: "STUDENT",
        keyNote: "Primary key: StudentID",
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
        keyNote: "Primary key: SubjectCode",
        columns: [
          { name: "SubjectCode", isKey: true },
          { name: "SubjectName" },
        ],
        rows: [
          ["ICT", "Information & Comm. Tech."],
          ["MAT", "Combined Maths"],
          ["PHY", "Physics"],
        ],
      },
      {
        name: "RESULT",
        keyNote: "Primary key: StudentID + SubjectCode · both are also foreign keys",
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
    label: "3NF",
    title: "Third normal form",
    change:
      "ClassName moves to a CLASS table of its own, and STUDENT keeps only ClassID as a foreign key pointing at it. Every fact is now stored in exactly one place.",
    rule:
      "A table is in 3NF when it is in 2NF and no non-key column depends on another non-key column.",
    problem: null,
    dependency: null,
    anomalies: [],
    tables: [
      {
        name: "STUDENT",
        keyNote: "Primary key: StudentID · ClassID is a foreign key",
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
        keyNote: "Primary key: ClassID",
        columns: [
          { name: "ClassID", isKey: true },
          { name: "ClassName" },
        ],
        rows: [
          ["C12A", "Grade 12 A"],
          ["C12B", "Grade 12 B"],
        ],
      },
      {
        name: "SUBJECT",
        keyNote: "Primary key: SubjectCode",
        columns: [
          { name: "SubjectCode", isKey: true },
          { name: "SubjectName" },
        ],
        rows: [
          ["ICT", "Information & Comm. Tech."],
          ["MAT", "Combined Maths"],
          ["PHY", "Physics"],
        ],
      },
      {
        name: "RESULT",
        keyNote: "Primary key: StudentID + SubjectCode · both are also foreign keys",
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
