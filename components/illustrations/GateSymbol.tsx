export type GateType = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR";

/**
 * Standard logic-gate silhouettes as inline SVG paths, at a shared 220×140
 * viewBox so every gate lines up identically regardless of type.
 *
 * NAND/NOR/XNOR reuse the AND/OR/XOR body outright and add the small output
 * "bubble" that means NOT — the same relationship the syllabus itself
 * teaches (a NAND gate *is* an AND gate with its output inverted), so the
 * component's structure mirrors the thing being taught rather than treating
 * each gate as an unrelated drawing.
 */
const AND_BODY = "M50,25 L110,25 A45,45 0 0 1 110,115 L50,115 Z";
const OR_BODY = "M50,25 C90,25 130,40 160,70 C130,100 90,115 50,115 C68,95 68,45 50,25 Z";
const NOT_BODY = "M50,25 L50,115 L150,70 Z";
/** The extra curved stroke just behind an OR body's back that turns it into XOR/XNOR. */
const XOR_EXTRA = "M40,25 C58,45 58,95 40,115";

interface GateDef {
  body: string;
  /** Rightmost x of the body shape — where the output line starts. */
  tipX: number;
  extra?: string;
  inverted: boolean;
  double: boolean;
}

const GATE_DEFS: Record<GateType, GateDef> = {
  AND: { body: AND_BODY, tipX: 155, inverted: false, double: true },
  OR: { body: OR_BODY, tipX: 160, inverted: false, double: true },
  NOT: { body: NOT_BODY, tipX: 150, inverted: true, double: false },
  NAND: { body: AND_BODY, tipX: 155, inverted: true, double: true },
  NOR: { body: OR_BODY, tipX: 160, inverted: true, double: true },
  XOR: { body: OR_BODY, tipX: 160, inverted: false, double: true, extra: XOR_EXTRA },
  XNOR: { body: OR_BODY, tipX: 160, inverted: true, double: true, extra: XOR_EXTRA },
};

export function GateSymbol({ type, className }: { type: GateType; className?: string }) {
  const def = GATE_DEFS[type];
  const bubbleCx = def.tipX + 8;
  const outputStartX = def.inverted ? bubbleCx + 7 : def.tipX;

  return (
    <svg
      viewBox="0 0 220 140"
      className={className}
      role="img"
      aria-label={`${type} gate symbol with ${def.double ? "two inputs, A and B," : "one input, A,"} and output Q`}
      fill="none"
      stroke="var(--color-awaken-ink)"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Input lines */}
      {def.double ? (
        <>
          <line x1={15} y1={45} x2={52} y2={45} />
          <line x1={15} y1={95} x2={52} y2={95} />
          <circle cx={15} cy={45} r={3} fill="var(--color-awaken-ink)" stroke="none" />
          <circle cx={15} cy={95} r={3} fill="var(--color-awaken-ink)" stroke="none" />
          <text x={12} y={36} fontSize={16} fontWeight={700} stroke="none" fill="var(--color-awaken-ink-soft)">
            A
          </text>
          <text x={12} y={116} fontSize={16} fontWeight={700} stroke="none" fill="var(--color-awaken-ink-soft)">
            B
          </text>
        </>
      ) : (
        <>
          <line x1={15} y1={70} x2={50} y2={70} />
          <circle cx={15} cy={70} r={3} fill="var(--color-awaken-ink)" stroke="none" />
          <text x={12} y={61} fontSize={16} fontWeight={700} stroke="none" fill="var(--color-awaken-ink-soft)">
            A
          </text>
        </>
      )}

      {/* Body */}
      <path d={def.body} fill="var(--color-awaken-accent-soft)" />
      {def.extra ? <path d={def.extra} fill="none" /> : null}

      {/* Output line, with an inverting bubble for NAND/NOR/NOT/XNOR */}
      {def.inverted ? (
        <circle cx={bubbleCx} cy={70} r={7} fill="var(--color-awaken-card)" />
      ) : null}
      <line x1={outputStartX} y1={70} x2={205} y2={70} />
      <circle cx={205} cy={70} r={3} fill="var(--color-awaken-ink)" stroke="none" />
      <text x={198} y={100} fontSize={16} fontWeight={700} stroke="none" fill="var(--color-awaken-ink-soft)" textAnchor="end">
        Q
      </text>
    </svg>
  );
}
