/**
 * A tiny formula engine for the Spreadsheet sandbox — cell references,
 * ranges, SUM/AVERAGE/MIN/MAX/COUNT/IF and basic arithmetic. Entirely
 * client-side and dependency-free: this is a teaching tool for the A/L ICT
 * spreadsheets unit, not a spreadsheet replacement, so it only needs to cover
 * what that unit actually tests.
 */

export type CellValue = number | string | boolean;
export type CellResult = CellValue | { error: string };

const CELL_REF = /^[A-Z]+[0-9]+$/;

export function evaluateSheet(cells: Record<string, string>): Record<string, CellResult> {
  const cache = new Map<string, CellResult>();
  const stack = new Set<string>();
  const result: Record<string, CellResult> = {};
  for (const id of Object.keys(cells)) {
    result[id] = getCellValue(id, cells, cache, stack);
  }
  return result;
}

function getCellValue(
  id: string,
  cells: Record<string, string>,
  cache: Map<string, CellResult>,
  stack: Set<string>,
): CellResult {
  if (cache.has(id)) return cache.get(id)!;
  if (stack.has(id)) return { error: "#CIRCULAR" };

  const raw = (cells[id] ?? "").trim();
  if (raw === "") return "";

  stack.add(id);
  try {
    let value: CellResult;
    if (raw.startsWith("=")) {
      value = new FormulaParser(raw.slice(1), cells, cache, stack).parse();
    } else if (raw !== "" && !Number.isNaN(Number(raw))) {
      value = Number(raw);
    } else {
      value = raw;
    }
    cache.set(id, value);
    return value;
  } catch (err) {
    const value = { error: err instanceof Error ? err.message : "#ERROR" };
    cache.set(id, value);
    return value;
  } finally {
    stack.delete(id);
  }
}

/** A1:B3 → ["A1", "A2", "A3", "B1", "B2", "B3"] (rectangular fill). */
function expandRange(from: string, to: string): string[] {
  const [, colA, rowA] = from.match(/^([A-Z]+)([0-9]+)$/)!;
  const [, colB, rowB] = to.match(/^([A-Z]+)([0-9]+)$/)!;
  const [r1, r2] = [Number(rowA), Number(rowB)].sort((a, b) => a - b);
  const cols = [colA, colB].sort();
  const ids: string[] = [];
  for (let c = cols[0].charCodeAt(0); c <= cols[1].charCodeAt(0); c++) {
    for (let r = r1; r <= r2; r++) ids.push(`${String.fromCharCode(c)}${r}`);
  }
  return ids;
}

function asNumber(v: CellResult): number {
  if (typeof v === "object") throw new Error(v.error);
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error("#VALUE — expected a number");
  return n;
}

type Token = { type: "num" | "str" | "id" | "op"; value: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) i++;
    else if (c === '"') {
      let j = i + 1;
      let s = "";
      while (j < expr.length && expr[j] !== '"') s += expr[j++];
      tokens.push({ type: "str", value: s });
      i = j + 1;
    } else if (/[0-9]/.test(c)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ type: "num", value: expr.slice(i, j) });
      i = j;
    } else if (/[A-Za-z]/.test(c)) {
      let j = i;
      while (j < expr.length && /[A-Za-z0-9]/.test(expr[j])) j++;
      tokens.push({ type: "id", value: expr.slice(i, j).toUpperCase() });
      i = j;
    } else if ("<>=".includes(c)) {
      let j = i + 1;
      while (j < expr.length && "<>=".includes(expr[j])) j++;
      tokens.push({ type: "op", value: expr.slice(i, j) });
      i = j;
    } else if ("+-*/(),:&".includes(c)) {
      tokens.push({ type: "op", value: c });
      i++;
    } else {
      throw new Error(`#ERROR — unexpected "${c}"`);
    }
  }
  return tokens;
}

class FormulaParser {
  private tokens: Token[];
  private pos = 0;

  constructor(
    expr: string,
    private cells: Record<string, string>,
    private cache: Map<string, CellResult>,
    private stack: Set<string>,
  ) {
    this.tokens = tokenize(expr);
  }

  parse(): CellResult {
    const v = this.parseComparison();
    if (this.pos < this.tokens.length) throw new Error(`#ERROR — unexpected "${this.tokens[this.pos].value}"`);
    return v;
  }

  private peek() {
    return this.tokens[this.pos];
  }
  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error("#ERROR — incomplete formula");
    this.pos++;
    return t;
  }
  private isOp(v: string) {
    const t = this.peek();
    return !!t && t.type === "op" && t.value === v;
  }

  private ref(id: string): CellResult {
    return getCellValue(id, this.cells, this.cache, this.stack);
  }

  private parseComparison(): CellResult {
    const left = this.parseAdditive();
    const t = this.peek();
    if (t && t.type === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(t.value)) {
      this.next();
      const right = this.parseAdditive();
      const l = typeof left === "object" ? NaN : left;
      const r = typeof right === "object" ? NaN : right;
      switch (t.value) {
        case "=":
          return l === r;
        case "<>":
          return l !== r;
        case "<":
          return Number(l) < Number(r);
        case ">":
          return Number(l) > Number(r);
        case "<=":
          return Number(l) <= Number(r);
        case ">=":
          return Number(l) >= Number(r);
      }
    }
    return left;
  }

  private parseAdditive(): CellResult {
    let left = this.parseMultiplicative();
    while (this.isOp("+") || this.isOp("-") || this.isOp("&")) {
      const op = this.next().value;
      const right = this.parseMultiplicative();
      if (op === "&") left = `${stringify(left)}${stringify(right)}`;
      else if (op === "+") left = asNumber(left) + asNumber(right);
      else left = asNumber(left) - asNumber(right);
    }
    return left;
  }

  private parseMultiplicative(): CellResult {
    let left = this.parseUnary();
    while (this.isOp("*") || this.isOp("/")) {
      const op = this.next().value;
      const right = this.parseUnary();
      left = op === "*" ? asNumber(left) * asNumber(right) : asNumber(left) / asNumber(right);
    }
    return left;
  }

  private parseUnary(): CellResult {
    if (this.isOp("-")) {
      this.next();
      return -asNumber(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): CellResult {
    const t = this.next();

    if (t.type === "num") return Number(t.value);
    if (t.type === "str") return t.value;

    if (t.type === "op" && t.value === "(") {
      const v = this.parseComparison();
      if (!this.isOp(")")) throw new Error("#ERROR — missing )");
      this.next();
      return v;
    }

    if (t.type === "id") {
      if (this.isOp("(")) return this.parseFunctionCall(t.value);
      if (CELL_REF.test(t.value)) {
        if (this.isOp(":")) {
          this.next();
          const to = this.next();
          if (to.type !== "id" || !CELL_REF.test(to.value)) throw new Error("#ERROR — bad range");
          // A bare range with no aggregate function around it isn't meaningful on its own.
          throw new Error("#ERROR — a range needs a function, e.g. =SUM(A1:A3)");
        }
        return this.ref(t.value);
      }
      if (t.value === "TRUE") return true;
      if (t.value === "FALSE") return false;
      throw new Error(`#NAME — unknown identifier "${t.value}"`);
    }

    throw new Error(`#ERROR — unexpected "${t.value}"`);
  }

  private parseFunctionCall(name: string): CellResult {
    this.next(); // consume "("
    const args = this.parseArgList();
    if (!this.isOp(")")) throw new Error("#ERROR — missing )");
    this.next();

    switch (name) {
      case "SUM":
        return args.reduce((s: number, v) => s + asNumber(v), 0);
      case "AVERAGE":
        return args.length === 0 ? 0 : args.reduce((s: number, v) => s + asNumber(v), 0) / args.length;
      case "MIN":
        return Math.min(...args.map(asNumber));
      case "MAX":
        return Math.max(...args.map(asNumber));
      case "COUNT":
        return args.filter((v) => typeof v === "number").length;
      case "IF": {
        if (args.length !== 3) throw new Error("#ERROR — IF needs 3 arguments: IF(condition, then, else)");
        return Boolean(args[0]) ? args[1] : args[2];
      }
      default:
        throw new Error(`#NAME — unknown function "${name}"`);
    }
  }

  /** Arguments can be single values or A1:B3 ranges, which expand into multiple values. */
  private parseArgList(): CellValue[] {
    const values: CellValue[] = [];
    if (this.isOp(")")) return values;

    for (;;) {
      values.push(...this.parseArg());
      if (this.isOp(",")) {
        this.next();
        continue;
      }
      break;
    }
    return values;
  }

  private parseArg(): CellValue[] {
    // Look ahead for a "CELL : CELL" range before falling back to a normal expression.
    const start = this.pos;
    const t = this.peek();
    if (t?.type === "id" && CELL_REF.test(t.value) && this.tokens[start + 1]?.value === ":") {
      const from = this.next().value;
      this.next(); // ":"
      const toTok = this.next();
      if (toTok.type !== "id" || !CELL_REF.test(toTok.value)) throw new Error("#ERROR — bad range");
      return expandRange(from, toTok.value).map((id) => {
        const v = this.ref(id);
        return typeof v === "object" ? 0 : v;
      });
    }
    const v = this.parseComparison();
    if (typeof v === "object") throw new Error(v.error);
    return [v];
  }
}

function stringify(v: CellResult): string {
  if (typeof v === "object") return v.error;
  return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v);
}

export const SPREADSHEET_COLS = ["A", "B", "C", "D", "E", "F"];
export const SPREADSHEET_ROWS = 10;

export const SPREADSHEET_EXAMPLE: Record<string, string> = {
  A1: "Item",
  B1: "Price",
  A2: "Pen",
  B2: "50",
  A3: "Book",
  B3: "180",
  A4: "Bag",
  B4: "1200",
  A6: "Total",
  B6: "=SUM(B2:B4)",
  A7: "Average",
  B7: "=AVERAGE(B2:B4)",
  A8: "Grade",
  B8: '=IF(B6>1000,"Over budget","Within budget")',
};
