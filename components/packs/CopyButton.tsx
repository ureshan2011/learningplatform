"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ds";

/**
 * Copies one block of text and says so.
 *
 * The confirmation matters more than it looks: on a phone nothing visibly
 * happens when the clipboard is written, so a student taps three times and
 * pastes three copies of the same email.
 */
export function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard refused (an insecure context, or the browser asked and was
      // told no). The text is on screen and selectable, so this is recoverable
      // without a message that would only say "it did not work".
    }
  }

  return (
    <Button variant="outline" size="sm" arrow="none" onClick={copy}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
