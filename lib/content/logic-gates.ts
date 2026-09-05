import type { GateType } from "@/components/illustrations/GateSymbol";

/**
 * The seven basic logic gates the A/L ICT syllabus (Digital circuits/logic
 * unit) examines directly — gate identification and truth-table completion
 * in Paper I, Boolean-expression questions in Paper II.
 *
 * Truth tables are computed from `evalGate`, not hand-typed: the same
 * boolean function that defines each gate is what renders its table, so a
 * table can never disagree with the gate it's supposed to describe.
 */
export function evalGate(type: GateType, a: 0 | 1, b: 0 | 1): 0 | 1 {
  switch (type) {
    case "AND":
      return a === 1 && b === 1 ? 1 : 0;
    case "OR":
      return a === 1 || b === 1 ? 1 : 0;
    case "NOT":
      return a === 1 ? 0 : 1;
    case "NAND":
      return a === 1 && b === 1 ? 0 : 1;
    case "NOR":
      return a === 1 || b === 1 ? 0 : 1;
    case "XOR":
      return a !== b ? 1 : 0;
    case "XNOR":
      return a === b ? 1 : 0;
  }
}

export interface GateDefinition {
  type: GateType;
  double: boolean;
  expression: string;
  sinhala: string;
  meaning: string;
  examNote: string;
}

export const GATES: GateDefinition[] = [
  {
    type: "AND",
    double: true,
    expression: "Q = A · B",
    sinhala: "AND ගේට්",
    meaning: "Output is 1 only when both inputs are 1.",
    examNote: "Drawn as a switches-in-series circuit almost every year — both switches must close for the lamp to light.",
  },
  {
    type: "OR",
    double: true,
    expression: "Q = A + B",
    sinhala: "OR ගේට්",
    meaning: "Output is 1 when at least one input is 1.",
    examNote: "The switches-in-parallel circuit — either switch alone lights the lamp.",
  },
  {
    type: "NOT",
    double: false,
    expression: "Q = A′",
    sinhala: "NOT ගේට්",
    meaning: "Output is the opposite of the single input — also called an inverter.",
    examNote: "The building block for every other inverted gate below — learn this one truth table cold.",
  },
  {
    type: "NAND",
    double: true,
    expression: "Q = (A · B)′",
    sinhala: "NAND ගේට්",
    meaning: "AND, then inverted — output is 0 only when both inputs are 1.",
    examNote: "A NAND gate with its two inputs tied together behaves exactly like a NOT gate — a favourite short-answer question.",
  },
  {
    type: "NOR",
    double: true,
    expression: "Q = (A + B)′",
    sinhala: "NOR ගේට්",
    meaning: "OR, then inverted — output is 1 only when both inputs are 0.",
    examNote: "Easy to mix up with NAND under exam pressure — check the ONE row that differs (both inputs 0) to tell them apart fast.",
  },
  {
    type: "XOR",
    double: true,
    expression: "Q = A ⊕ B",
    sinhala: "XOR ගේට්",
    meaning: "Output is 1 when the two inputs differ.",
    examNote: "Looks like OR except for one row (1,1) — that row is exactly what distinguishes them, and it's a common trick question.",
  },
  {
    type: "XNOR",
    double: true,
    expression: "Q = (A ⊕ B)′",
    sinhala: "XNOR ගේට්",
    meaning: "Output is 1 when the two inputs are the same.",
    examNote: "The \"equality checker\" gate — 1 out means A and B agree.",
  },
];

export const FAQ = [
  {
    q: "How many logic gates are there in the A/L ICT syllabus?",
    a: "Seven basic gates: AND, OR, NOT, NAND, NOR, XOR and XNOR. NAND and NOR are sometimes called \"universal gates\" because either one alone can be wired up to build every other gate — a common structured-question angle.",
  },
  {
    q: "What is the fastest way to tell NAND and NOR apart under exam pressure?",
    a: "Check only the row where both inputs are 0. NOR outputs 1 there (nothing is on, so \"neither\" is true); NAND outputs 1 everywhere except when both inputs are 1. If you can't remember the whole table, that one row is enough to identify which gate you're looking at.",
  },
  {
    q: "What's the difference between OR and XOR?",
    a: "They agree on three of the four input rows and differ on exactly one: when both inputs are 1, OR outputs 1 but XOR outputs 0. XOR means \"one or the other, but not both.\"",
  },
  {
    q: "What is De Morgan's theorem, in plain terms?",
    a: "It states that (A·B)′ = A′ + B′, and separately (A+B)′ = A′·B′ — in words, \"NOT (A AND B)\" behaves exactly like \"(NOT A) OR (NOT B)\", and \"NOT (A OR B)\" behaves like \"(NOT A) AND (NOT B)\". You can prove either version by building both truth tables and checking every row matches.",
  },
] as const;
