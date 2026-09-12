/**
 * The fetch–execute cycle, as a precomputed trace.
 *
 * Competency level 2.3 asks a student to "describe the fetch-execute cycle"
 * and to say which register holds what at each step. That is the one question
 * in unit 2 where a static diagram consistently fails: the diagram shows five
 * boxes, and the exam asks what is *inside* the boxes at step 7.
 *
 * The whole run is computed once, as an array of machine states, rather than
 * simulated as the student clicks. Stepping then becomes indexing, which means
 * a step backwards is free and exact, and there is no way for the display to
 * drift out of step with the machine it is describing. It also makes the trace
 * testable on its own, which a component full of `useState` would not be.
 *
 * Register names follow the NIE syllabus and the Grade 12 teachers' guide:
 * PC, MAR, MDR, CIR, ACC. The syllabus writes MDR (some textbooks call the
 * same register MBR); students should recognise both, which the notes say.
 *
 * The trace is built per language. The register abbreviations, the opcodes and
 * the arrow notation stay identical in both, because they are written in
 * English on the Sinhala paper too — only the sentences around them change.
 */

import type { Locale } from "@/lib/i18n/dictionary";

export type Phase = "fetch" | "decode" | "execute";

/** One instruction in the tiny accumulator machine below. */
export interface Instruction {
  opcode: "LOAD" | "ADD" | "SUB" | "STORE" | "HALT";
  /** Address the opcode operates on. HALT has none. */
  operand?: number;
}

export interface Registers {
  /** Program counter — address of the NEXT instruction. */
  pc: number;
  /** Memory address register — the address currently on the address bus. */
  mar: number | null;
  /** Memory data register — whatever just came back over the data bus. */
  mdr: string | null;
  /** Current instruction register — the instruction being carried out. */
  cir: string | null;
  /** Accumulator — the working value arithmetic happens in. */
  acc: number;
}

export interface TraceStep {
  phase: Phase;
  /** The micro-operation in the notation the syllabus uses, e.g. "MAR ← PC". */
  operation: string;
  /** What that line actually means, in a sentence a student can say out loud. */
  explanation: string;
  /** Registers AFTER this micro-operation has happened. */
  registers: Registers;
  /** Memory AFTER this micro-operation — STORE writes to it. */
  memory: Cell[];
  /** Which register the student should be looking at. Drives the highlight. */
  highlight: keyof Registers | null;
  /** Memory address being read or written right now, if any. */
  activeAddress: number | null;
  /** Which bus is carrying something this step. */
  bus: "address" | "data" | null;
}

export interface Cell {
  address: number;
  /** Instructions live low in memory, data above them — the layout the syllabus draws. */
  kind: "instruction" | "data";
  /** Rendered contents, e.g. "LOAD 5" or "12". */
  label: string;
  value: number | null;
  instruction?: Instruction;
}

/**
 * The demonstration program: add two numbers and store the answer.
 *
 * Deliberately the smallest program that still needs all three phases and
 * touches memory in both directions — a LOAD that reads, an ADD that reads,
 * and a STORE that writes. Anything shorter fails to show why MDR exists in
 * both directions; anything longer buries the cycle in arithmetic.
 */
const PROGRAM: Cell[] = [
  { address: 0, kind: "instruction", label: "LOAD 5", value: null, instruction: { opcode: "LOAD", operand: 5 } },
  { address: 1, kind: "instruction", label: "ADD 6", value: null, instruction: { opcode: "ADD", operand: 6 } },
  { address: 2, kind: "instruction", label: "STORE 7", value: null, instruction: { opcode: "STORE", operand: 7 } },
  { address: 3, kind: "instruction", label: "HALT", value: null, instruction: { opcode: "HALT" } },
  { address: 4, kind: "data", label: "—", value: null },
  { address: 5, kind: "data", label: "12", value: 12 },
  { address: 6, kind: "data", label: "30", value: 30 },
  { address: 7, kind: "data", label: "0", value: 0 },
];

export const INITIAL_REGISTERS: Registers = { pc: 0, mar: null, mdr: null, cir: null, acc: 0 };

interface TraceCopy {
  marFromPc: (address: number) => string;
  mdrFromMemory: (address: number) => string;
  incrementPc: (next: number) => string;
  cirFromMdr: string;
  decodeLabel: (label: string) => string;
  decodeNoOperand: (opcode: string) => string;
  decodeWithOperand: (opcode: string, operand: number) => string;
  haltOperation: string;
  haltExplanation: string;
  storeSetup: (address: number, value: number) => string;
  storeWrite: (address: number) => string;
  marFromOperand: (address: number) => string;
  mdrFromData: (address: number, value: number) => string;
  accFromMdr: (value: number) => string;
  aluOperation: (isAdd: boolean) => string;
  aluExplanation: (isAdd: boolean, before: number, operand: number, result: number) => string;
}

/**
 * The sentences, per language.
 *
 * The Sinhala is everyday spoken Sinhala with the exam's own English terms left
 * in place — register, memory, program counter, opcode, jump. That is how a
 * Sinhala-medium class actually talks about this, and those are the words the
 * Sinhala paper prints in English too.
 */
const COPY: Record<Locale, TraceCopy> = {
  en: {
    marFromPc: (address) =>
      `The address of the next instruction (${address}) is copied from the program counter into the memory address register, and put on the address bus.`,
    mdrFromMemory: (address) =>
      `Memory returns the contents of address ${address} over the data bus, and it lands in the memory data register.`,
    incrementPc: (next) =>
      `The program counter is incremented to ${next} now, during the fetch — not after the instruction runs. This is why a jump instruction has to overwrite the PC rather than add to it.`,
    cirFromMdr:
      "The instruction moves out of the memory data register into the current instruction register, leaving MDR free for the data this instruction is about to need.",
    decodeLabel: (label) => `Decode ${label}`,
    decodeNoOperand: (opcode) =>
      `The control unit splits the instruction in CIR into its opcode (${opcode}) and its address part. ${opcode} has no address part.`,
    decodeWithOperand: (opcode, operand) =>
      `The control unit splits the instruction in CIR into its opcode (${opcode}) and its address part (${operand}), and works out which control signals to raise.`,
    haltOperation: "Stop the clock",
    haltExplanation:
      "HALT ends the cycle. Without it the processor would carry on fetching whatever happens to sit in the next address and treat it as an instruction.",
    storeSetup: (address, value) =>
      `The address to write to (${address}) goes into MAR, and the value to be written (${value}) goes into MDR. This is the same pair of registers as the fetch, used in the opposite direction.`,
    storeWrite: (address) =>
      `The accumulator's value is written into address ${address}. The accumulator itself is unchanged — STORE copies, it does not move.`,
    marFromOperand: (address) =>
      `The address part of the instruction (${address}) goes into MAR. Note this is the address of the data, not of an instruction.`,
    mdrFromData: (address, value) =>
      `The data at address ${address} (${value}) comes back over the data bus into MDR.`,
    accFromMdr: (value) =>
      `The accumulator now holds ${value}. Whatever it held before is gone — LOAD overwrites.`,
    aluOperation: (isAdd) => (isAdd ? "ACC ← ACC + MDR" : "ACC ← ACC − MDR"),
    aluExplanation: (isAdd, before, operand, result) =>
      `The ALU ${isAdd ? "adds" : "subtracts"} ${operand} ${isAdd ? "to" : "from"} the ${before} already in the accumulator, and the result (${result}) goes back into the accumulator.`,
  },
  si: {
    marFromPc: (address) =>
      `ඊළඟ විධානයේ ලිපිනය (${address}) program counter එකෙන් memory address register එකට copy වෙලා, ලිපින බසයට යනවා.`,
    mdrFromMemory: (address) =>
      `ලිපිනය ${address} එකේ තියෙන දේ මතකයෙන් දත්ත බසය හරහා ඇවිත් memory data register එකට වැටෙනවා.`,
    incrementPc: (next) =>
      `Program counter එක දැන්ම ${next} දක්වා වැඩි වෙනවා — විධානය run වෙලා ඉවර වුණාට පස්සේ නෙවෙයි, fetch එක අතරතුරදීමයි. jump විධානයකට PC එකට එකතු කරනවා වෙනුවට overwrite කරන්නම වෙන්නේ ඒ නිසයි.`,
    cirFromMdr:
      "විධානය memory data register එකෙන් current instruction register එකට යනවා. එතකොට මේ විධානයට ඊළඟට ඕන දත්ත ගන්න MDR එක නිදහස් වෙනවා.",
    decodeLabel: (label) => `${label} විකේතනය කිරීම`,
    decodeNoOperand: (opcode) =>
      `පාලක ඒකකය CIR එකේ තියෙන විධානය opcode එක (${opcode}) සහ ලිපින කොටස කියලා වෙන් කරනවා. ${opcode} එකට ලිපින කොටසක් නෑ.`,
    decodeWithOperand: (opcode, operand) =>
      `පාලක ඒකකය CIR එකේ තියෙන විධානය opcode එක (${opcode}) සහ ලිපින කොටස (${operand}) කියලා වෙන් කරලා, මොන control signal ද උස්සන්න ඕන කියලා තීරණය කරනවා.`,
    haltOperation: "ඔරලෝසුව නවත්වනවා",
    haltExplanation:
      "HALT එකෙන් චක්‍රය නවතිනවා. ඒක නැත්නම් processor එක ඊළඟ ලිපිනයේ තියෙන ඕනම දෙයක් විධානයක් විදිහට අරගෙන run කරගෙන යනවා.",
    storeSetup: (address, value) =>
      `ලියන්න ඕන ලිපිනය (${address}) MAR එකට, ලියන්න ඕන අගය (${value}) MDR එකට යනවා. fetch එකේදී පාවිච්චි කරපු එකම register දෙකමයි, මෙතනදී අනිත් පැත්තට.`,
    storeWrite: (address) =>
      `Accumulator එකේ අගය ලිපිනය ${address} එකට ලියනවා. Accumulator එක වෙනස් වෙන්නේ නෑ — STORE කරන්නේ copy එකක්, ගෙනියන එකක් නෙවෙයි.`,
    marFromOperand: (address) =>
      `විධානයේ ලිපින කොටස (${address}) MAR එකට යනවා. මේක දත්තවල ලිපිනය මිසක් විධානයක ලිපිනය නෙවෙයි කියන එක මතක තියාගන්න.`,
    mdrFromData: (address, value) =>
      `ලිපිනය ${address} එකේ දත්ත (${value}) දත්ත බසය හරහා ඇවිත් MDR එකට වැටෙනවා.`,
    accFromMdr: (value) =>
      `Accumulator එකේ දැන් ${value} තියෙනවා. කලින් තිබුණු දේ නැති වෙනවා — LOAD කරනකොට overwrite වෙනවා.`,
    aluOperation: (isAdd) => (isAdd ? "ACC ← ACC + MDR" : "ACC ← ACC − MDR"),
    aluExplanation: (isAdd, before, operand, result) =>
      `ALU එක accumulator එකේ දැනටමත් තියෙන ${before} එකට ${operand} ${isAdd ? "එකතු කරනවා" : "අඩු කරනවා"}, උත්තරය (${result}) ආපහු accumulator එකට යනවා.`,
  },
};

function clone(memory: Cell[]): Cell[] {
  return memory.map((c) => ({ ...c }));
}

/**
 * Runs the program and records every micro-operation on the way.
 *
 * Each instruction contributes the same four fetch steps and one decode step,
 * then however many execute steps its opcode needs — which is the point being
 * taught: fetch and decode never change, only execute does.
 */
export function buildTrace(locale: Locale = "en"): TraceStep[] {
  const copy = COPY[locale];
  const steps: TraceStep[] = [];
  let registers: Registers = { ...INITIAL_REGISTERS };
  let memory = clone(PROGRAM);

  const push = (step: Omit<TraceStep, "registers" | "memory">) => {
    steps.push({ ...step, registers: { ...registers }, memory: clone(memory) });
  };

  // A real CPU stops only when it is told to. The bound is a guard against a
  // program that forgets its HALT, not an expected exit.
  for (let guard = 0; guard < 32; guard++) {
    const address = registers.pc;
    const cell = memory[address];
    if (!cell?.instruction) break;

    // ---- Fetch: identical for every instruction, which is the lesson ----
    registers = { ...registers, mar: address };
    push({
      phase: "fetch",
      operation: "MAR ← PC",
      explanation: copy.marFromPc(address),
      highlight: "mar",
      activeAddress: address,
      bus: "address",
    });

    registers = { ...registers, mdr: cell.label };
    push({
      phase: "fetch",
      operation: "MDR ← [MAR]",
      explanation: copy.mdrFromMemory(address),
      highlight: "mdr",
      activeAddress: address,
      bus: "data",
    });

    registers = { ...registers, pc: registers.pc + 1 };
    push({
      phase: "fetch",
      operation: "PC ← PC + 1",
      explanation: copy.incrementPc(registers.pc),
      highlight: "pc",
      activeAddress: null,
      bus: null,
    });

    registers = { ...registers, cir: cell.label };
    push({
      phase: "fetch",
      operation: "CIR ← MDR",
      explanation: copy.cirFromMdr,
      highlight: "cir",
      activeAddress: null,
      bus: null,
    });

    // ---- Decode ----
    const { opcode, operand } = cell.instruction;
    push({
      phase: "decode",
      operation: copy.decodeLabel(cell.label),
      explanation:
        operand === undefined
          ? copy.decodeNoOperand(opcode)
          : copy.decodeWithOperand(opcode, operand),
      highlight: "cir",
      activeAddress: null,
      bus: null,
    });

    // ---- Execute: the only phase that differs between instructions ----
    if (opcode === "HALT") {
      push({
        phase: "execute",
        operation: copy.haltOperation,
        explanation: copy.haltExplanation,
        highlight: null,
        activeAddress: null,
        bus: null,
      });
      break;
    }

    const target = operand as number;

    if (opcode === "STORE") {
      registers = { ...registers, mar: target, mdr: String(registers.acc) };
      push({
        phase: "execute",
        operation: "MAR ← address part, MDR ← ACC",
        explanation: copy.storeSetup(target, registers.acc),
        highlight: "mdr",
        activeAddress: target,
        bus: "address",
      });

      memory = memory.map((c) =>
        c.address === target ? { ...c, value: registers.acc, label: String(registers.acc) } : c,
      );
      push({
        phase: "execute",
        operation: "[MAR] ← MDR",
        explanation: copy.storeWrite(target),
        highlight: "acc",
        activeAddress: target,
        bus: "data",
      });
      continue;
    }

    // LOAD, ADD and SUB all read one operand from memory first.
    registers = { ...registers, mar: target };
    push({
      phase: "execute",
      operation: "MAR ← address part",
      explanation: copy.marFromOperand(target),
      highlight: "mar",
      activeAddress: target,
      bus: "address",
    });

    const operandValue = memory[target]?.value ?? 0;
    registers = { ...registers, mdr: String(operandValue) };
    push({
      phase: "execute",
      operation: "MDR ← [MAR]",
      explanation: copy.mdrFromData(target, operandValue),
      highlight: "mdr",
      activeAddress: target,
      bus: "data",
    });

    if (opcode === "LOAD") {
      registers = { ...registers, acc: operandValue };
      push({
        phase: "execute",
        operation: "ACC ← MDR",
        explanation: copy.accFromMdr(operandValue),
        highlight: "acc",
        activeAddress: null,
        bus: null,
      });
    } else {
      const before = registers.acc;
      const isAdd = opcode === "ADD";
      const result = isAdd ? before + operandValue : before - operandValue;
      registers = { ...registers, acc: result };
      push({
        phase: "execute",
        operation: copy.aluOperation(isAdd),
        explanation: copy.aluExplanation(isAdd, before, operandValue, result),
        highlight: "acc",
        activeAddress: null,
        bus: null,
      });
    }
  }

  return steps;
}

/** The program as written, for the listing beside the trace. */
export const PROGRAM_LISTING = PROGRAM;

export interface RegisterMeta {
  key: keyof Registers;
  /** Never translated: the Sinhala paper prints these abbreviations in English. */
  short: string;
  name: string;
  role: string;
}

const REGISTERS: Array<{ key: keyof Registers; short: string; name: Record<Locale, string>; role: Record<Locale, string> }> = [
  {
    key: "pc",
    short: "PC",
    name: { en: "Program counter", si: "Program counter" },
    role: {
      en: "Address of the next instruction to fetch.",
      si: "ලබා ගන්න ඕන ඊළඟ විධානයේ ලිපිනය.",
    },
  },
  {
    key: "mar",
    short: "MAR",
    name: { en: "Memory address register", si: "Memory address register" },
    role: {
      en: "The address currently on the address bus.",
      si: "දැන් ලිපින බසයේ තියෙන ලිපිනය.",
    },
  },
  {
    key: "mdr",
    short: "MDR",
    name: { en: "Memory data register", si: "Memory data register" },
    role: {
      en: "Data or an instruction in transit to or from memory. Some textbooks call it MBR.",
      si: "මතකයට යන හෝ මතකයෙන් එන දත්ත හෝ විධානයක්. සමහර පොත්වල මේකට MBR කියනවා.",
    },
  },
  {
    key: "cir",
    short: "CIR",
    name: { en: "Current instruction register", si: "Current instruction register" },
    role: {
      en: "The instruction being carried out right now.",
      si: "දැන් ක්‍රියාත්මක වෙමින් තියෙන විධානය.",
    },
  },
  {
    key: "acc",
    short: "ACC",
    name: { en: "Accumulator", si: "Accumulator" },
    role: {
      en: "Where the ALU keeps the working value.",
      si: "ALU එක වැඩ කරන අගය තියාගන්න තැන.",
    },
  },
];

export function registerMeta(locale: Locale = "en"): RegisterMeta[] {
  return REGISTERS.map((r) => ({
    key: r.key,
    short: r.short,
    name: r.name[locale],
    role: r.role[locale],
  }));
}
