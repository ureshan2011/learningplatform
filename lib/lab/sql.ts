/**
 * A small SELECT-only SQL engine over two preloaded in-memory tables.
 *
 * Scoped deliberately to what O/L and A/L ICT database questions actually
 * ask for — SELECT, WHERE, ORDER BY, LIMIT and the five common aggregates —
 * rather than a general SQL engine. Entirely client-side: there is no real
 * database to protect, so students can experiment freely and nothing here
 * ever touches Firestore or a server.
 */

export type Row = Record<string, string | number>;

export interface SqlTable {
  name: string;
  rows: Row[];
}

export const SQL_TABLES: SqlTable[] = [
  {
    name: "students",
    rows: [
      { id: 1, name: "Nimal Perera", grade: "O/L", subject: "ICT", marks: 78 },
      { id: 2, name: "Kavindi Silva", grade: "O/L", subject: "ICT", marks: 92 },
      { id: 3, name: "Ashan Fernando", grade: "A/L", subject: "ICT", marks: 65 },
      { id: 4, name: "Dilani Jayawardena", grade: "A/L", subject: "ICT", marks: 88 },
      { id: 5, name: "Ruwan Bandara", grade: "O/L", subject: "ICT", marks: 55 },
      { id: 6, name: "Ishara Gunasekara", grade: "A/L", subject: "ICT", marks: 71 },
    ],
  },
  {
    name: "subjects",
    rows: [
      { code: "ICT", title: "Information & Communication Technology", teacher: "Mr. Perera" },
      { code: "MATH", title: "Mathematics", teacher: "Mrs. Silva" },
      { code: "SCI", title: "Science", teacher: "Mr. Fernando" },
    ],
  },
];

export interface SqlResult {
  columns: string[];
  rows: (string | number)[][];
  error?: string;
}

interface Clauses {
  selectPart: string;
  tableName: string;
  wherePart: string | null;
  orderPart: string | null;
  limitPart: string | null;
}

function splitClauses(sql: string): Clauses {
  const trimmed = sql.trim().replace(/;\s*$/, "");
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith("SELECT ")) throw new Error("Only SELECT queries are supported here.");

  const fromIdx = upper.indexOf(" FROM ");
  if (fromIdx === -1) throw new Error('Expected "FROM <table>".');
  const selectPart = trimmed.slice(6, fromIdx).trim();

  let rest = trimmed.slice(fromIdx + 6).trim();

  let limitPart: string | null = null;
  const limitIdx = rest.toUpperCase().lastIndexOf(" LIMIT ");
  if (limitIdx !== -1) {
    limitPart = rest.slice(limitIdx + 7).trim();
    rest = rest.slice(0, limitIdx).trim();
  }

  let orderPart: string | null = null;
  const orderIdx = rest.toUpperCase().lastIndexOf(" ORDER BY ");
  if (orderIdx !== -1) {
    orderPart = rest.slice(orderIdx + 10).trim();
    rest = rest.slice(0, orderIdx).trim();
  }

  let wherePart: string | null = null;
  let tableName = rest;
  const whereIdx = rest.toUpperCase().indexOf(" WHERE ");
  if (whereIdx !== -1) {
    tableName = rest.slice(0, whereIdx).trim();
    wherePart = rest.slice(whereIdx + 7).trim();
  }

  return { selectPart, tableName, wherePart, orderPart, limitPart };
}

// ---- WHERE expression evaluation ------------------------------------------

type Token = { type: "num" | "str" | "id" | "op"; value: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) i++;
    else if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1;
      let s = "";
      while (j < expr.length && expr[j] !== quote) s += expr[j++];
      tokens.push({ type: "str", value: s });
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
    } else if ("<>=!".includes(c)) {
      let j = i + 1;
      while (j < expr.length && "<>=".includes(expr[j])) j++;
      tokens.push({ type: "op", value: expr.slice(i, j) });
      i = j;
    } else if ("()".includes(c)) {
      tokens.push({ type: "op", value: c });
      i++;
    } else {
      throw new Error(`Unexpected character "${c}" in WHERE`);
    }
  }
  return tokens;
}

class WhereParser {
  private pos = 0;
  private tokens: Token[];
  constructor(expr: string, private row: Row) {
    this.tokens = tokenize(expr);
  }

  private peek() {
    return this.tokens[this.pos];
  }
  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error("Incomplete WHERE clause");
    this.pos++;
    return t;
  }
  private isKeyword(word: string) {
    const t = this.peek();
    return !!t && t.type === "id" && t.value.toUpperCase() === word;
  }
  private isOp(v: string) {
    const t = this.peek();
    return !!t && t.type === "op" && t.value === v;
  }

  evaluate(): boolean {
    const v = this.parseOr();
    if (this.pos < this.tokens.length) throw new Error(`Unexpected "${this.tokens[this.pos].value}" in WHERE`);
    return v;
  }

  private parseOr(): boolean {
    let left = this.parseAnd();
    while (this.isKeyword("OR")) {
      this.next();
      left = left || this.parseAnd();
    }
    return left;
  }

  private parseAnd(): boolean {
    let left = this.parseComparison();
    while (this.isKeyword("AND")) {
      this.next();
      left = left && this.parseComparison();
    }
    return left;
  }

  private parseComparison(): boolean {
    if (this.isOp("(")) {
      this.next();
      const v = this.parseOr();
      if (!this.isOp(")")) throw new Error('Expected ")"');
      this.next();
      return v;
    }

    const left = this.parseOperand();
    const t = this.next();
    if (t.type !== "op" || !["=", "!=", "<>", "<", ">", "<=", ">="].includes(t.value)) {
      throw new Error(`Expected a comparison operator, found "${t.value}"`);
    }
    const right = this.parseOperand();

    switch (t.value) {
      case "=":
        return left === right;
      case "!=":
      case "<>":
        return left !== right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      default:
        return false;
    }
  }

  private parseOperand(): string | number {
    const t = this.next();
    if (t.type === "num") return Number(t.value);
    if (t.type === "str") return t.value;
    if (t.type === "id") {
      const key = Object.keys(this.row).find((k) => k.toLowerCase() === t.value.toLowerCase());
      if (!key) throw new Error(`Unknown column "${t.value}"`);
      return this.row[key];
    }
    throw new Error(`Unexpected token "${t.value}"`);
  }
}

// ---- query execution --------------------------------------------------------

type AggregateFn = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";

export function runSql(sql: string): SqlResult {
  try {
    const { selectPart, tableName, wherePart, orderPart, limitPart } = splitClauses(sql);

    const table = SQL_TABLES.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
    if (!table) {
      const known = SQL_TABLES.map((t) => t.name).join(", ");
      throw new Error(`Unknown table "${tableName}". Available tables: ${known}.`);
    }

    let rows = wherePart
      ? table.rows.filter((row) => new WhereParser(wherePart, row).evaluate())
      : [...table.rows];

    const aggregateMatch = selectPart.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|[A-Za-z_]+)\s*\)$/i);
    if (aggregateMatch) {
      return runAggregate(aggregateMatch[1].toUpperCase() as AggregateFn, aggregateMatch[2], rows);
    }

    if (orderPart) {
      const [colRaw, dirRaw] = orderPart.split(/\s+/);
      const dir = (dirRaw ?? "ASC").toUpperCase() === "DESC" ? -1 : 1;
      const col = Object.keys(rows[0] ?? table.rows[0] ?? {}).find(
        (k) => k.toLowerCase() === colRaw.toLowerCase(),
      );
      if (!col) throw new Error(`Unknown column "${colRaw}" in ORDER BY`);
      rows = [...rows].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * dir);
    }

    if (limitPart) {
      const n = Number(limitPart);
      if (Number.isNaN(n)) throw new Error(`Invalid LIMIT "${limitPart}"`);
      rows = rows.slice(0, n);
    }

    const allCols = Object.keys(table.rows[0] ?? {});
    const columns = selectPart.trim() === "*" ? allCols : selectPart.split(",").map((c) => c.trim());

    for (const c of columns) {
      if (!allCols.some((k) => k.toLowerCase() === c.toLowerCase())) {
        throw new Error(`Unknown column "${c}" — try one of: ${allCols.join(", ")}`);
      }
    }

    return {
      columns,
      rows: rows.map((row) =>
        columns.map((c) => row[allCols.find((k) => k.toLowerCase() === c.toLowerCase())!]),
      ),
    };
  } catch (err) {
    return { columns: [], rows: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function runAggregate(fn: AggregateFn, colRaw: string, rows: Row[]): SqlResult {
  if (fn === "COUNT" && colRaw === "*") {
    return { columns: ["COUNT(*)"], rows: [[rows.length]] };
  }
  const col = Object.keys(rows[0] ?? {}).find((k) => k.toLowerCase() === colRaw.toLowerCase());
  if (!col) throw new Error(`Unknown column "${colRaw}"`);

  const values = rows.map((r) => Number(r[col])).filter((n) => !Number.isNaN(n));
  const label = `${fn}(${colRaw})`;

  switch (fn) {
    case "COUNT":
      return { columns: [label], rows: [[values.length]] };
    case "SUM":
      return { columns: [label], rows: [[values.reduce((s, v) => s + v, 0)]] };
    case "AVG":
      return { columns: [label], rows: [[values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0]] };
    case "MIN":
      return { columns: [label], rows: [[values.length ? Math.min(...values) : 0]] };
    case "MAX":
      return { columns: [label], rows: [[values.length ? Math.max(...values) : 0]] };
  }
}

export const SQL_EXAMPLES: { title: string; query: string }[] = [
  { title: "All students", query: "SELECT * FROM students;" },
  { title: "Filter with WHERE", query: "SELECT name, marks FROM students WHERE grade = 'A/L';" },
  { title: "Sort and limit", query: "SELECT name, marks FROM students ORDER BY marks DESC LIMIT 3;" },
  { title: "Aggregate", query: "SELECT AVG(marks) FROM students WHERE subject = 'ICT';" },
  { title: "Second table", query: "SELECT * FROM subjects WHERE teacher = 'Mr. Perera';" },
];
