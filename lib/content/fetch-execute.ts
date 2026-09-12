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
 */

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
export function buildTrace(): TraceStep[] {
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
      explanation: `The address of the next instruction (${address}) is copied from the program counter into the memory address register, and put on the address bus.`,
      highlight: "mar",
      activeAddress: address,
      bus: "address",
    });

    registers = { ...registers, mdr: cell.label };
    push({
      phase: "fetch",
      operation: "MDR ← [MAR]",
      explanation: `Memory returns the contents of address ${address} over the data bus, and it lands in the memory data register.`,
      highlight: "mdr",
      activeAddress: address,
      bus: "data",
    });

    registers = { ...registers, pc: registers.pc + 1 };
    push({
      phase: "fetch",
      operation: "PC ← PC + 1",
      explanation: `The program counter is incremented to ${registers.pc} now, during the fetch — not after the instruction runs. This is why a jump instruction has to overwrite the PC rather than add to it.`,
      highlight: "pc",
      activeAddress: null,
      bus: null,
    });

    registers = { ...registers, cir: cell.label };
    push({
      phase: "fetch",
      operation: "CIR ← MDR",
      explanation:
        "The instruction moves out of the memory data register into the current instruction register, leaving MDR free for the data this instruction is about to need.",
      highlight: "cir",
      activeAddress: null,
      bus: null,
    });

    // ---- Decode ----
    const { opcode, operand } = cell.instruction;
    push({
      phase: "decode",
      operation: `Decode ${cell.label}`,
      explanation:
        operand === undefined
          ? `The control unit splits the instruction in CIR into its opcode (${opcode}) and its address part. ${opcode} has no address part.`
          : `The control unit splits the instruction in CIR into its opcode (${opcode}) and its address part (${operand}), and works out which control signals to raise.`,
      highlight: "cir",
      activeAddress: null,
      bus: null,
    });

    // ---- Execute: the only phase that differs between instructions ----
    if (opcode === "HALT") {
      push({
        phase: "execute",
        operation: "Stop the clock",
        explanation: "HALT ends the cycle. Without it the processor would carry on fetching whatever happens to sit in the next address and treat it as an instruction.",
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
        explanation: `The address to write to (${target}) goes into MAR, and the value to be written (${registers.acc}) goes into MDR. This is the same pair of registers as the fetch, used in the opposite direction.`,
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
        explanation: `The accumulator's value is written into address ${target}. The accumulator itself is unchanged — STORE copies, it does not move.`,
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
      explanation: `The address part of the instruction (${target}) goes into MAR. Note this is the address of the *data*, not of an instruction.`,
      highlight: "mar",
      activeAddress: target,
      bus: "address",
    });

    const operandValue = memory[target]?.value ?? 0;
    registers = { ...registers, mdr: String(operandValue) };
    push({
      phase: "execute",
      operation: "MDR ← [MAR]",
      explanation: `The data at address ${target} (${operandValue}) comes back over the data bus into MDR.`,
      highlight: "mdr",
      activeAddress: target,
      bus: "data",
    });

    if (opcode === "LOAD") {
      registers = { ...registers, acc: operandValue };
      push({
        phase: "execute",
        operation: "ACC ← MDR",
        explanation: `The accumulator now holds ${operandValue}. Whatever it held before is gone — LOAD overwrites.`,
        highlight: "acc",
        activeAddress: null,
        bus: null,
      });
    } else {
      const before = registers.acc;
      const result = opcode === "ADD" ? before + operandValue : before - operandValue;
      registers = { ...registers, acc: result };
      push({
        phase: "execute",
        operation: opcode === "ADD" ? "ACC ← ACC + MDR" : "ACC ← ACC − MDR",
        explanation: `The ALU ${opcode === "ADD" ? "adds" : "subtracts"} ${operandValue} ${opcode === "ADD" ? "to" : "from"} the ${before} already in the accumulator, and the result (${result}) goes back into the accumulator.`,
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

export const REGISTER_META: Array<{
  key: keyof Registers;
  short: string;
  name: string;
  role: string;
}> = [
  { key: "pc", short: "PC", name: "Program counter", role: "Address of the next instruction to fetch." },
  { key: "mar", short: "MAR", name: "Memory address register", role: "The address currently on the address bus." },
  { key: "mdr", short: "MDR", name: "Memory data register", role: "Data or an instruction in transit to or from memory. Some textbooks call it MBR." },
  { key: "cir", short: "CIR", name: "Current instruction register", role: "The instruction being carried out right now." },
  { key: "acc", short: "ACC", name: "Accumulator", role: "Where the ALU keeps the working value." },
];
