"use client";

import { waShareUrl } from "@/lib/share";
import { Icon } from "@/components/ui/Icon";

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
        "ict-press inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-black transition-transform duration-[120ms]"
      }
    >
      <Icon name="chat" className="!text-base" />
      {label}
    </a>
  );
}
