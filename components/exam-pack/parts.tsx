import { clsx } from "clsx";

/**
 * The two small pieces every Exam Pack question card shares — the code listing
 * and the numbered option badge. Kept apart from `PaperSitting` so the public
 * sales page's sample questions do not pull the whole timed-paper screen into
 * its bundle.
 */

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-2.5 overflow-x-auto rounded-ict-md border border-ict-line bg-ict-surface-sunken p-3 font-mono text-xs whitespace-pre text-ict-fg">
      {code}
    </pre>
  );
}

export function OptionBadge({ n, tone }: { n: number; tone: "plain" | "chosen" | "right" }) {
  return (
    <span
      className={clsx(
        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        tone === "chosen" && "bg-ict-orange-500 text-white",
        tone === "right" && "bg-ict-green-500 text-white",
        tone === "plain" && "bg-ict-surface-sunken text-ict-fg-soft",
      )}
    >
      {n}
    </span>
  );
}
