"use client";

import { useState } from "react";
import { runPseudocode, PSEUDOCODE_EXAMPLES } from "@/lib/lab/pseudocode";

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
      <p className="text-sm text-(--color-awaken-ink-soft)">
        SET/PRINT, IF-THEN-ELSE-ENDIF, FOR-TO-NEXT, WHILE-ENDWHILE — the pseudocode style
        used in A/L ICT textbooks. INPUT asks for a value with a popup when the
        program runs.
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={14}
        spellCheck={false}
        className="mt-3 w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-3 font-mono text-sm outline-none focus:border-(--color-awaken-accent)"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
        >
          Run
        </button>
        {PSEUDOCODE_EXAMPLES.map((ex) => (
          <button
            key={ex.title}
            onClick={() => {
              setCode(ex.code);
              setHasRun(false);
            }}
            className="rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs text-(--color-awaken-ink-soft) hover:text-(--color-awaken-ink)"
          >
            {ex.title}
          </button>
        ))}
      </div>

      {hasRun ? (
        <div className="mt-4 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-3 font-mono text-sm">
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {error ? <div className="text-(--color-awaken-danger)">{error}</div> : null}
          {!error && output.length === 0 ? <div className="text-(--color-awaken-ink-soft)">(no output)</div> : null}
        </div>
      ) : null}
    </div>
  );
}
