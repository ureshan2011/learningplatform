"use client";

import { useState } from "react";
import { runPseudocode, PSEUDOCODE_EXAMPLES } from "@/lib/lab/pseudocode";
import { Button } from "@/components/ds";

/**
 * Runs entirely in the browser via `lib/lab/pseudocode.ts` — there is no
 * server round trip, so this costs the platform nothing no matter how many
 * students run code at once.
 */
export function PseudocodeRunner() {
  const [code, setCode] = useState(PSEUDOCODE_EXAMPLES[0].code);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [hasRun, setHasRun] = useState(false);

  function run() {
    const result = runPseudocode(code, (name) => window.prompt(`INPUT ${name} =`) ?? "0");
    setOutput(result.output);
    setError(result.error);
    setHasRun(true);
  }

  return (
    <div>
      <p className="text-sm text-ict-ink-300">
        SET/PRINT, IF-THEN-ELSE-ENDIF, FOR-TO-NEXT, WHILE-ENDWHILE — the pseudocode style
        used in A/L ICT textbooks. INPUT asks for a value with a popup when the
        program runs.
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={14}
        spellCheck={false}
        className="mt-3 w-full rounded-ict-md border border-ict-border-dark bg-ict-ink-900 p-3 font-mono text-sm text-ict-paper-50 outline-none focus:border-ict-orange-500"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" arrow="none" onClick={run}>
          Run
        </Button>
        {PSEUDOCODE_EXAMPLES.map((ex) => (
          <Button
            key={ex.title}
            variant="outline"
            size="sm"
            arrow="none"
            onClick={() => {
              setCode(ex.code);
              setHasRun(false);
            }}
          >
            {ex.title}
          </Button>
        ))}
      </div>

      {hasRun ? (
        <div className="mt-4 rounded-ict-md border border-ict-border-dark bg-ict-ink-900 p-3 font-mono text-sm text-ict-paper-50">
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {error ? <div className="text-[#f0685a]">{error}</div> : null}
          {!error && output.length === 0 ? <div className="text-ict-ink-300">(no output)</div> : null}
        </div>
      ) : null}
    </div>
  );
}
