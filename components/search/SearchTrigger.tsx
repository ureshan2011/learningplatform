"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SearchDialog } from "@/components/search/SearchDialog";
import { fetchWithSession } from "@/lib/auth/session-client";
import type { SearchEntry } from "@/lib/search";

/**
 * The way into search, in the app shell's top bar.
 *
 * A pill on desktop wide enough to read as a search field; an icon button on a
 * phone, where the top bar has room for one glyph beside the subscription
 * chip. `/` opens it from anywhere, which is what anyone who uses a computer
 * for anything else will try first — guarded so it does not steal the key
 * while a student is typing an answer into the Code Lab or a practice box.
 */
export function SearchTrigger({
  labels,
  staticPages,
}: {
  labels: {
    search: string;
    placeholder: string;
    empty: string;
    hint: string;
    close: string;
    failed: string;
  };
  staticPages: SearchEntry[];
}) {
  const [open, setOpen] = useState(false);
  // Held here rather than in the dialog so it survives closing and reopening,
  // and so the dialog can be mounted fresh each time — which is what resets
  // the query without an effect clearing state on the way out.
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);

  // Fetched on first open. A student who never searches never pays for it.
  const load = useCallback(async () => {
    if (loading.current || entries !== null) return;
    loading.current = true;
    try {
      const res = await fetchWithSession("/api/search");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { entries: SearchEntry[] };
      setEntries(data.entries);
    } catch {
      setFailed(true);
      // The rail's own screens are passed in separately, so search degrades to
      // a navigator rather than to nothing.
      setEntries([]);
    }
  }, [entries]);

  const openSearch = useCallback(() => {
    setOpen(true);
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-label={labels.search}
        className="ict-press inline-flex h-[30px] items-center gap-2 rounded-full border border-ict-line bg-ict-surface-raised px-3 text-xs font-semibold text-ict-fg-soft transition-colors duration-[120ms] ease-ict hover:text-ict-fg"
      >
        <Icon name="search" className="!text-sm" />
        <span className="hidden sm:inline">{labels.search}</span>
      </button>

      {open ? (
        <SearchDialog
          onClose={() => setOpen(false)}
          labels={labels}
          staticPages={staticPages}
          entries={entries}
          failed={failed}
        />
      ) : null}
    </>
  );
}
