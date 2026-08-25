/**
 * A small interpreter for the structured-English pseudocode style used in
 * Sri Lankan O/L and A/L ICT textbooks: SET/PRINT/INPUT, IF-THEN-ELSE-ENDIF,
 * FOR-TO-STEP-NEXT, WHILE-ENDWHILE.
 *
 * Pure and dependency-free on purpose — this whole file runs entirely in the
 * student's browser. There is no server round trip for "run my code" and
 * nothing here ever touches Firestore, so practising algorithms costs the
 * platform nothing no matter how many students use it at once.
 */

export type Value = number | string | boolean;

type Stmt =
  | { kind: "assign"; name: string; expr: string }
  | { kind: "print"; expr: string }
  | { kind: "input"; name: string }
  | { kind: "if"; cond: string; then: Stmt[]; else: Stmt[] }
  | { kind: "for"; varName: string; start: string; end: string; step?: string; body: Stmt[] }
  | { kind: "while"; cond: string; body: Stmt[] };

export interface RunResult {
  output: string[];
  error?: string;
}

const MAX_STEPS = 200_000;

/** Strips comments (REM ... or // ...) and blank lines, keeping line numbers stable for error messages. */
function preprocess(source: string): string[] {
  return source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter((line) => line.length > 0 && !/^REM\b/i.test(line));
}

function parseProgram(lines: string[]): Stmt[] {
  const { body, next } = parseBlock(lines, 0, []);
  if (next < lines.length) throw new Error(`Line ${next + 1}: unexpected "${lines[next]}"`);
  return body;
}

function parseBlock(lines: string[], start: number, enders: string[]): { body: Stmt[]; next: number } {
  const body: Stmt[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    const upper = line.toUpperCase();
    const firstWord = upper.split(/\s+/)[0];
    if (enders.includes(firstWord) || enders.includes(upper)) break;

    if (upper.startsWith("IF ")) {
      const thenAt = upper.lastIndexOf(" THEN");
      if (thenAt === -1) throw new Error(`Line ${i + 1}: IF needs a THEN`);
      const cond = line.slice(3, thenAt).trim();

      const thenResult = parseBlock(lines, i + 1, ["ELSE", "ENDIF"]);
      let elseBody: Stmt[] = [];
      let after = thenResult.next;

      if (lines[after]?.toUpperCase() === "ELSE") {
        const elseResult = parseBlock(lines, after + 1, ["ENDIF"]);
        elseBody = elseResult.body;
        after = elseResult.next;
      }
      if (lines[after]?.toUpperCase() !== "ENDIF") {
        throw new Error(`Line ${i + 1}: IF is missing its ENDIF`);
      }
      body.push({ kind: "if", cond, then: thenResult.body, else: elseBody });
      i = after + 1;
      continue;
    }

    if (upper.startsWith("FOR ")) {
      const m = line.match(/^FOR\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i);
      if (!m) throw new Error(`Line ${i + 1}: expected "FOR name = start TO end"`);
      const result = parseBlock(lines, i + 1, ["NEXT"]);
      if (result.next >= lines.length) throw new Error(`Line ${i + 1}: FOR is missing its NEXT`);
      body.push({ kind: "for", varName: m[1], start: m[2], end: m[3], step: m[4], body: result.body });
      i = result.next + 1;
      continue;
    }

    if (upper.startsWith("WHILE ")) {
      const cond = line.slice(6).trim();
      const result = parseBlock(lines, i + 1, ["ENDWHILE"]);
      if (result.next >= lines.length) throw new Error(`Line ${i + 1}: WHILE is missing its ENDWHILE`);
      body.push({ kind: "while", cond, body: result.body });
      i = result.next + 1;
      continue;
    }

    if (upper.startsWith("PRINT ") || upper.startsWith("OUTPUT ")) {
      body.push({ kind: "print", expr: line.slice(line.indexOf(" ") + 1).trim() });
      i++;
      continue;
    }

    if (upper.startsWith("INPUT ")) {
      body.push({ kind: "input", name: line.slice(6).trim() });
      i++;
      continue;
    }

    const assign = line.match(/^(?:SET\s+)?([A-Za-z_]\w*)\s*(?:=|:=|←)\s*(.+)$/i);
    if (assign) {
      body.push({ kind: "assign", name: assign[1], expr: assign[2] });
      i++;
      continue;
    }

    throw new Error(`Line ${i + 1}: could not understand "${line}"`);
  }

  return { body, next: i };
}

// ---- expression evaluation -------------------------------------------------

type Token = { type: "num" | "str" | "id" | "op"; value: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '"') {
      let j = i + 1;
      let str = "";
      while (j < expr.length && expr[j] !== '"') str += expr[j++];
      tokens.push({ type: "str", value: str });
      i = j + 1;
    } else if (/[0-9]/.test(c)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ type: "num", value: expr.slice(i, j) });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < expr.length && /[A-Za-z0-9_]/.test(expr[j])) j++;
      tokens.push({ type: "id", value: expr.slice(i, j) });
      i = j;
    } else if ("<>=".includes(c)) {
      let j = i + 1;
      while (j < expr.length && "<>=".includes(expr[j])) j++;
      tokens.push({ type: "op", value: expr.slice(i, j) });
      i = j;
    } else if ("+-*/&(),".includes(c)) {
      tokens.push({ type: "op", value: c });
      i++;
    } else {
      throw new Error(`Unexpected character "${c}" in expression`);
    }
  }
  return tokens;
}

class ExprParser {
  private pos = 0;
  constructor(private tokens: Token[], private env: Map<string, Value>) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }
  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error("Unexpected end of expression");
    this.pos++;
    return t;
  }
  private isOp(value: string): boolean {
    const t = this.peek();
    return !!t && t.type === "op" && t.value === value;
  }
  private isKeyword(word: string): boolean {
    const t = this.peek();
    return !!t && t.type === "id" && t.value.toUpperCase() === word;
  }

  parse(): Value {
    const v = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected "${this.tokens[this.pos].value}" in expression`);
    }
    return v;
  }

  private parseOr(): Value {
    let left = this.parseAnd();
    while (this.isKeyword("OR")) {
      this.next();
      const right = this.parseAnd();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  private parseAnd(): Value {
    let left = this.parseNot();
    while (this.isKeyword("AND")) {
      this.next();
      const right = this.parseNot();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  private parseNot(): Value {
    if (this.isKeyword("NOT")) {
      this.next();
      return !Boolean(this.parseNot());
    }
    return this.parseComparison();
  }

  private parseComparison(): Value {
    const left = this.parseAdditive();
    const t = this.peek();
    if (t && t.type === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(t.value)) {
      this.next();
      const right = this.parseAdditive();
      switch (t.value) {
        case "=":
          return left === right;
        case "<>":
          return left !== right;
        case "<":
          return Number(left) < Number(right);
        case ">":
          return Number(left) > Number(right);
        case "<=":
          return Number(left) <= Number(right);
        case ">=":
          return Number(left) >= Number(right);
      }
    }
    return left;
  }

  private parseAdditive(): Value {
    let left = this.parseMultiplicative();
    while (this.isOp("+") || this.isOp("-") || this.isOp("&")) {
      const op = this.next().value;
      const right = this.parseMultiplicative();
      if (op === "&") {
        left = `${stringify(left)}${stringify(right)}`;
      } else if (op === "+") {
        if (typeof left !== "number" || typeof right !== "number") {
          throw new Error('+ requires two numbers — use & to join text, e.g. "Hi " & name');
        }
        left = left + right;
      } else {
        left = Number(left) - Number(right);
      }
    }
    return left;
  }

  private parseMultiplicative(): Value {
    let left = this.parseUnary();
    while (this.isOp("*") || this.isOp("/") || this.isKeyword("MOD")) {
      const opToken = this.next();
      const op = opToken.type === "id" ? "MOD" : opToken.value;
      const right = this.parseUnary();
      if (op === "*") left = Number(left) * Number(right);
      else if (op === "/") left = Number(left) / Number(right);
      else left = Number(left) % Number(right);
    }
    return left;
  }

  private parseUnary(): Value {
    if (this.isOp("-")) {
      this.next();
      return -Number(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Value {
    const t = this.next();
    if (t.type === "num") return Number(t.value);
    if (t.type === "str") return t.value;
    if (t.type === "op" && t.value === "(") {
      const v = this.parseOr();
      if (!this.isOp(")")) throw new Error('Expected ")"');
      this.next();
      return v;
    }
    if (t.type === "id") {
      const upper = t.value.toUpperCase();
      if (upper === "TRUE") return true;
      if (upper === "FALSE") return false;
      if (!this.env.has(t.value)) throw new Error(`Unknown variable "${t.value}"`);
      return this.env.get(t.value)!;
    }
    throw new Error(`Unexpected token "${t.value}"`);
  }
}

function stringify(v: Value): string {
  return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v);
}

function evalExpr(expr: string, env: Map<string, Value>): Value {
  return new ExprParser(tokenize(expr), env).parse();
}

// ---- interpreter ------------------------------------------------------------

export function runPseudocode(source: string, inputProvider: (name: string) => string): RunResult {
  const output: string[] = [];
  let steps = 0;

  function tick() {
    steps++;
    if (steps > MAX_STEPS) throw new Error("Stopped: too many steps — check for a loop that never ends.");
  }

  function execAll(stmts: Stmt[], env: Map<string, Value>) {
    for (const stmt of stmts) execOne(stmt, env);
  }

  function execOne(stmt: Stmt, env: Map<string, Value>) {
    tick();
    switch (stmt.kind) {
      case "assign":
        env.set(stmt.name, evalExpr(stmt.expr, env));
        return;
      case "print":
        output.push(stringify(evalExpr(stmt.expr, env)));
        return;
      case "input":
        env.set(stmt.name, coerceInput(inputProvider(stmt.name)));
        return;
      case "if":
        if (Boolean(evalExpr(stmt.cond, env))) execAll(stmt.then, env);
        else execAll(stmt.else, env);
        return;
      case "for": {
        const step = stmt.step ? Number(evalExpr(stmt.step, env)) : 1;
        const end = Number(evalExpr(stmt.end, env));
        for (let v = Number(evalExpr(stmt.start, env)); step > 0 ? v <= end : v >= end; v += step) {
          env.set(stmt.varName, v);
          execAll(stmt.body, env);
          tick();
        }
        return;
      }
      case "while":
        while (Boolean(evalExpr(stmt.cond, env))) {
          execAll(stmt.body, env);
          tick();
        }
        return;
    }
  }

  try {
    const program = parseProgram(preprocess(source));
    execAll(program, new Map());
    return { output };
  } catch (err) {
    return { output, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function coerceInput(raw: string): Value {
  if (raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw);
  return raw;
}

export const PSEUDOCODE_EXAMPLES: { title: string; code: string }[] = [
  {
    title: "FizzBuzz (FOR + IF)",
    code: `FOR i = 1 TO 20
    IF i MOD 15 = 0 THEN
        PRINT "FizzBuzz"
    ELSE
        IF i MOD 3 = 0 THEN
            PRINT "Fizz"
        ELSE
            IF i MOD 5 = 0 THEN
                PRINT "Buzz"
            ELSE
                PRINT i
            ENDIF
        ENDIF
    ENDIF
NEXT i`,
  },
  {
    title: "Sum of N numbers (WHILE + INPUT)",
    code: `SET total = 0
SET count = 0
SET n = 3
WHILE count < n
    INPUT x
    total = total + x
    count = count + 1
ENDWHILE
PRINT "Total: " & total`,
  },
  {
    title: "Largest of three numbers",
    code: `SET a = 12
SET b = 45
SET c = 7
IF a > b THEN
    IF a > c THEN
        PRINT "Largest is a: " & a
    ELSE
        PRINT "Largest is c: " & c
    ENDIF
ELSE
    IF b > c THEN
        PRINT "Largest is b: " & b
    ELSE
        PRINT "Largest is c: " & c
    ENDIF
ENDIF`,
  },
];
