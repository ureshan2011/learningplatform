"use client";

import { useState } from "react";
import { runSql, SQL_EXAMPLES, SQL_TABLES, type SqlResult } from "@/lib/lab/sql";

export function SqlSandbox() {
  const [query, setQuery] = useState(SQL_EXAMPLES[0].query);
  const [result, setResult] = useState<SqlResult>(() => runSql(SQL_EXAMPLES[0].query));

  function run(q: string = query) {
    setResult(runSql(q));
  }

  return (
    <div>
      <p className="text-sm text-white/60">
        Practice SELECT queries against two sample tables — nothing here touches a real
        database.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {SQL_TABLES.map((t) => (
          <span
            key={t.name}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60"
          >
            {t.name} ({Object.keys(t.rows[0]).join(", ")})
          </span>
        ))}
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        spellCheck={false}
        className="mt-4 w-full rounded-lg border border-white/15 bg-black/30 p-3 font-mono text-sm outline-none focus:border-[--color-brand]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => run()}
          className="rounded-lg bg-[--color-brand] px-4 py-2 text-sm font-semibold text-black"
        >
          Run query
        </button>
        {SQL_EXAMPLES.map((ex) => (
          <button
            key={ex.title}
            onClick={() => {
              setQuery(ex.query);
              run(ex.query);
            }}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:text-white"
          >
            {ex.title}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
        {result.error ? (
          <p className="p-4 text-sm text-[--color-danger]">{result.error}</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {result.columns.map((c) => (
                  <th
                    key={c}
                    className="border-b border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-white/60"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={result.columns.length || 1} className="px-3 py-4 text-center text-white/40">
                    No rows
                  </td>
                </tr>
              ) : (
                result.rows.map((row, i) => (
                  <tr key={i} className="odd:bg-white/[0.015]">
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-white/5 px-3 py-1.5">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
