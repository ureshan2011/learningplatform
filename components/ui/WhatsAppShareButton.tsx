"use client";

import { waShareUrl } from "@/lib/share";

/**
 * Opens WhatsApp with a pre-filled message. Plain `<a>`, not a click handler —
 * that way it works as a normal link (opens in a new tab, middle-click, etc.)
 * with no JavaScript dependency.
 */
export function WhatsAppShareButton({
  text,
  phone,
  label = "Share on WhatsApp",
  className,
}: {
  text: string;
  /** E.164 phone to message directly instead of opening a generic share sheet. */
  phone?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={waShareUrl(text, phone)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-black"
      }
    >
      <span aria-hidden>💬</span>
      {label}
    </a>
  );
}
