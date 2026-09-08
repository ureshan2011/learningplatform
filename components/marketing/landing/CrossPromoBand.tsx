import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/marketing/landing/icons";

/**
 * The one place each landing page points at the other.
 *
 * ## Why it is deliberately quiet
 *
 * ICT Campus and Campus Ready sell to the same person eighteen months apart:
 * a Grade 12 student studying for A/Ls, and the same student a year after
 * sitting them. That makes this a funnel, not two competing offers — so the
 * cross-link has to be *findable* without competing with the page it sits on.
 *
 * A student revising for an exam next term does not need a course they cannot
 * start for a year, and a full section selling one would cost the A/L page its
 * own conversion. So this is a single slim row rather than a section: an
 * eyebrow, a line, an arrow. Low enough to ignore, impossible to miss if you
 * are the person it is for.
 *
 * ## Where it goes
 *
 * After the page has made its own argument and before the FAQ — so the closing
 * CTA still closes, rather than following a second offer. Both pages place it
 * identically, which is also what makes it read as a signpost rather than an
 * advertisement.
 */
export function CrossPromoBand({
  eyebrow,
  title,
  body,
  href,
  cta,
  mark,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  /** The destination's own mark, so the link looks like where it goes. */
  mark: React.ReactNode;
}) {
  return (
    <section className="w-full py-[clamp(16px,3vw,32px)]">
      <div className="mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]">
        <Link
          href={href}
          className="lp-reveal group flex flex-wrap items-center gap-[clamp(14px,2.4vw,24px)] rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(18px,2.6vw,26px)] transition-colors duration-[120ms] hover:border-(--lp-orange-500)"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-(--lp-paper-100) text-(--lp-ink-900)">
            {mark}
          </span>

          <span className="min-w-0 flex-1 basis-[260px]">
            <span className="block text-[11px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
              {eyebrow}
            </span>
            <span className="mt-1 block font-[family-name:var(--lp-font-display)] text-lg leading-tight font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
              {title}
            </span>
            <span className="mt-1 block text-sm text-(--lp-ink-500) text-wrap-pretty">{body}</span>
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-2.5 text-sm font-semibold whitespace-nowrap text-(--lp-ink-900) group-hover:text-(--lp-orange-600)">
            {cta}
            <span className="grid size-8 place-items-center overflow-hidden rounded-full border-[1.5px] border-(--lp-ink-900) text-(--lp-ink-900) group-hover:border-(--lp-orange-500) group-hover:bg-(--lp-orange-500) group-hover:text-white">
              <ArrowUpRightIcon className="size-3.5" />
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
