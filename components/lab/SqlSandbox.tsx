"use client";

import { useState } from "react";
import { runSql, SQL_EXAMPLES, SQL_TABLES, type SqlResult } from "@/lib/lab/sql";
import { Button, Chip } from "@/components/ds";

export function SqlSandbox() {
  const [query, setQuery] = useState(SQL_EXAMPLES[0].query);
  const [result, setResult] = useState<SqlResult>(() => runSql(SQL_EXAMPLES[0].query));

  function run(q: string = query) {
    setResult(runSql(q));
  }

  return (
    <div>
      <p className="text-sm text-ict-ink-300">
        Practice SELECT queries against two sample tables — nothing here touches a real
        database.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SQL_TABLES.map((t) => (
          <Chip key={t.name}>
            {t.name} ({Object.keys(t.rows[0]).join(", ")})
          </Chip>
        ))}
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        spellCheck={false}
        className="mt-4 w-full rounded-ict-md border border-ict-border-dark bg-ict-ink-900 p-3 font-mono text-sm text-ict-paper-50 outline-none focus:border-ict-orange-500"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" arrow="none" onClick={() => run()}>
          Run query
        </Button>
        {SQL_EXAMPLES.map((ex) => (
          <Button
            key={ex.title}
            variant="outline"
            size="sm"
            arrow="none"
            onClick={() => {
              setQuery(ex.query);
              run(ex.query);
            }}
          >
            {ex.title}
          </Button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-ict-md border border-ict-border-dark">
        {result.error ? (
          <p className="p-4 text-sm text-[#f0685a]">{result.error}</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {result.columns.map((c) => (
                  <th
                    key={c}
                    className="border-b border-ict-border-dark bg-ict-ink-900 px-3 py-2 text-left text-xs font-medium text-ict-ink-300"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={result.columns.length || 1} className="px-3 py-4 text-center text-ict-ink-300">
                    No rows
                  </td>
                </tr>
              ) : (
                result.rows.map((row, i) => (
                  <tr key={i} className="odd:bg-ict-ink-900 text-ict-paper-50">
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-ict-border-dark px-3 py-1.5">
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
