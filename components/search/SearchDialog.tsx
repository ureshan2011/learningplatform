"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { SearchEntry } from "@/lib/search";

const KIND_ICON: Record<SearchEntry["k"], IconName> = {
  unit: "auto_stories",
  lesson: "description",
  file: "receipt_long",
  page: "home",
};

/**
 * Search across the syllabus and the library.
 *
 * Fourteen units and around a hundred competency levels, and until now the
 * only way to find one was to already know which unit it lived in. A student
 * looking for "normalization" the night before a paper does not know it is
 * Unit 8, and should not have to.
 *
 * ## Why this is not a search service
 *
 * The whole corpus is about a hundred lessons plus however many files the
 * teacher has uploaded — a few tens of kilobytes. Matching it in the browser
 * is instant, works with the network off once the index is in hand, and costs
 * nothing per query. A hosted index would be another account to create,
 * another key to paste into a console, and a bill, for a dataset that fits in
 * a text message.
 *
 * The index is fetched and held by `SearchTrigger`, which outlives this
 * component: the dialog is mounted fresh on each open, so the query and the
 * highlighted row reset without an effect reaching in to clear them. It lists
 * what exists, never what is unlocked — every destination runs its own access
 * check.
 */
export function SearchDialog({
  onClose,
  labels,
  staticPages,
  entries,
  failed,
}: {
  onClose: () => void;
  labels: { placeholder: string; empty: string; hint: string; close: string; failed: string };
  /** Destinations that exist regardless of what is published — the rail's own screens. */
  staticPages: SearchEntry[];
  /** Null while the index is still in flight. */
  entries: SearchEntry[] | null;
  failed: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pool = useMemo(() => [...staticPages, ...(entries ?? [])], [staticPages, entries]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return staticPages.slice(0, 6);

    // Two passes so an exact title match never sits below an entry that only
    // mentions the word in an exam objective.
    const words = needle.split(/\s+/);
    const scored: Array<{ entry: SearchEntry; score: number }> = [];
    for (const entry of pool) {
      if (!words.every((w) => entry.q.includes(w))) continue;
      const title = entry.t.toLowerCase();
      const score = title.startsWith(needle) ? 0 : title.includes(needle) ? 1 : 2;
      scored.push({ entry, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 20).map((s) => s.entry);
  }, [query, pool, staticPages]);

  const go = useCallback(
    (entry: SearchEntry) => {
      onClose();
      router.push(entry.h);
    },
    [onClose, router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(c + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (event.key === "Enter" && results[cursor]) {
        event.preventDefault();
        go(results[cursor]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, cursor, go, onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[10vh]">
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(14,12,11,0.72)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={labels.placeholder}
        className="ict-enter relative w-full max-w-[560px] overflow-hidden rounded-ict-panel border border-ict-line bg-ict-surface-card"
      >
        <div className="flex items-center gap-3 border-b border-ict-line px-4">
          <Icon name="search" className="!text-lg shrink-0 text-ict-fg-mute" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            className="min-w-0 flex-1 bg-transparent py-3.5 text-base text-ict-fg outline-none placeholder:text-ict-fg-mute"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="grid size-8 shrink-0 place-items-center rounded-full text-ict-fg-mute transition-colors duration-[120ms] ease-ict hover:bg-ict-surface-hover hover:text-ict-fg"
          >
            <Icon name="close" className="!text-base" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ict-fg-soft">
              {failed ? labels.failed : labels.empty}
            </p>
          ) : (
            <ul>
              {results.map((entry, i) => (
                <li key={`${entry.h}-${entry.t}`}>
                  <button
                    type="button"
                    onClick={() => go(entry)}
                    onMouseEnter={() => setCursor(i)}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-ict-md px-3 py-2.5 text-left transition-colors duration-[120ms] ease-ict",
                      i === cursor ? "bg-ict-surface-hover" : "",
                    )}
                  >
                    <Icon
                      name={KIND_ICON[entry.k]}
                      className="!text-base shrink-0 text-ict-fg-mute"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ict-fg">
                        {entry.t}
                      </span>
                      <span className="block truncate text-xs text-ict-fg-soft">{entry.s}</span>
                    </span>
                    <Icon
                      name="chevron_right"
                      className="!text-base shrink-0 text-ict-fg-mute"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t border-ict-line px-4 py-2 text-xs text-ict-fg-mute">{labels.hint}</p>
      </div>
    </div>
  );
}
