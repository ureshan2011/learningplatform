"use client";

import { useEffect } from "react";
import { Button } from "@/components/ds";

/**
 * Printing the report.
 *
 * A student prints this and takes it home, so the printed page has to carry the
 * whole list. Four of the bands are native disclosures and a closed one prints
 * as its heading alone, so every one is opened before the dialog and put back
 * afterwards — including when the print comes from Ctrl+P rather than this
 * button.
 */

function openAll(): Element[] {
  const closed = [...document.querySelectorAll(".ict-print details:not([open])")];
  for (const el of closed) el.setAttribute("open", "");
  return closed;
}

function restore(closed: Element[]) {
  for (const el of closed) el.removeAttribute("open");
}

export function PrintReport() {
  useEffect(() => {
    let closed: Element[] = [];
    const before = () => {
      closed = openAll();
    };
    const after = () => {
      restore(closed);
      closed = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return (
    <Button
      variant="secondary"
      onClick={() => {
        // `beforeprint` does the opening; this only raises the dialog. Calling
        // it here too would leave the sections open if the event never fires.
        window.print();
      }}
    >
      Print this report
    </Button>
  );
}
