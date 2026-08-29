"use client";

import { useState } from "react";

/** Single-open accordion for the landing page's FAQ — first question open by default. */
export function FaqAccordion({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-[var(--lp-radius-md)] border border-(--lp-border-subtle) bg-(--lp-paper-0)"
          >
            <button
              type="button"
              onClick={() => setOpen((current) => (current === i ? -1 : i))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-[18px] text-left text-base font-semibold text-(--lp-ink-900)"
            >
              <span className="flex-1">{item.q}</span>
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-(--lp-orange-50) text-lg leading-none font-bold text-(--lp-orange-500) transition-transform duration-150"
                style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
              >
                +
              </span>
            </button>
            {isOpen ? (
              <p className="px-5 pr-14 pb-5 text-sm text-(--lp-ink-500)">{item.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
